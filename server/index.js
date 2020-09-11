const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const MongoClient = require('mongodb').MongoClient;
const Bottleneck = require('bottleneck');
const exchangeWallets = require('./exchangeWallets.json');
const contracts = require('./contracts.json');
const ApiCache = require('./apicache');
const port = process.env.PORT || 4000;
app.use(bodyParser.json());
app.use('/', express.static('build'));

const CACHE_MAX_AGE = 1000 * 60 * 60 * 6;
const dataCache = new ApiCache(CACHE_MAX_AGE);
const blacklist = ['0x0000000000000000000000000000000000000000']
  .concat(exchangeWallets)
  .concat(contracts);

const client = new MongoClient(process.env.MONGO_URL, {
  useUnifiedTopology: true,
});
let topSearchesCollection, snapshotsCollection;
async function initDb() {
  try {
    await client.connect();
    const db = await client.db(process.env.DB_NAME);
    topSearchesCollection = await db.collection('topSearches');
    snapshotsCollection = await db.collection('snapshots');
    await snapshotsCollection
      .find(
        { timestamp: { $gte: Date.now() - CACHE_MAX_AGE } },
        { contractAddress: 1, timestamp: 1 }
      )
      .forEach(({ contractAddress, timestamp }) =>
        dataCache.set(contractAddress, true, timestamp)
      );
  } catch (err) {
    console.error(err);
  }
}
initDb();

// 133.33 -> ~7.5 requests / second
const limiter = new Bottleneck({ minTime: 133.33 });
const getEthplorerData = limiter.wrap(axios.get);
const getCoinGeckoData = limiter.wrap(axios.get);

function computeSearchScore(search, maxCount, maxTimestamp, now) {
  const countScore = search.count / maxCount;
  const elapsed = now - search.timestamp;
  const minElapsed = now - maxTimestamp;
  const timestampScore = 1 / (elapsed / minElapsed);
  return countScore + timestampScore;
}

app.get('/top-searches', async (_, res) => {
  const topSearches = await topSearchesCollection.find().toArray();
  const [maxCount, maxTimestamp] = topSearches.reduce(
    (acc, { count, timestamp }) => [
      !acc[0] || acc[0] < count ? count : acc[0],
      !acc[1] || acc[1] < timestamp ? timestamp : acc[1],
    ],
    []
  );
  const now = Date.now();
  const args = [maxCount, maxTimestamp, now];
  const sortedSearches = topSearches
    .sort(
      (a, b) => computeSearchScore(b, ...args) - computeSearchScore(a, ...args)
    )
    .slice(0, 20)
    .map((search) => ({ ...search, ready: !!dataCache.get(search.address) }));
  res.send({ payload: sortedSearches });
});

let cmcTokens = [];
async function getCmcTokens() {
  try {
    const { data } = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?listing_status=active,untracked&limit=5000&sort=cmc_rank',
      {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_KEY },
      }
    );
    cmcTokens = data.data
      .filter(
        (coin) =>
          coin.platform?.symbol === 'ETH' && coin.platform?.token_address
      )
      .map(({ id, name, symbol, platform }) => ({
        img: `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`,
        name,
        symbol,
        address: platform.token_address.toLowerCase(),
      }));
  } catch (err) {
    console.error('CMC get tokens error', err);
  }
}
setInterval(getCmcTokens, 1000 * 60 * 60 * 12); // get coins every 12 hours
// getCmcTokens(); // initial call

app.get('/load-tokens', (_, res) => {
  const payload = cmcTokens.map((token) => ({
    ...token,
    ready: !!dataCache.get(token.address),
  }));
  res.send({ payload, success: true });
});

async function getRichAddresses(contractAddress) {
  const { data } = await getEthplorerData(
    `https://api.ethplorer.io/getTopTokenHolders/${contractAddress}?apiKey=${process.env.ETHPLORER_KEY}&limit=100`
  );
  return data.holders.reduce(
    (acc, { address }) =>
      blacklist.includes(address) ? acc : acc.concat(address.toLowerCase()),
    []
  );
}

function toDecimal(num, decimals) {
  return num * `1e-${decimals}`;
}

function reduceTokensToHoldings(
  { tokens, address },
  tokenPricesMap,
  contractAddress
) {
  const searchedToken = tokens.find(
    ({ tokenInfo }) => tokenInfo.address.toLowerCase() === contractAddress
  );
  return tokens.reduce((acc, { tokenInfo, balance }) => {
    const tokenAddress = tokenInfo.address.toLowerCase();
    const decimalBalance = toDecimal(balance, tokenInfo.decimals);
    const rate = tokenPricesMap[tokenAddress]?.usd;
    const value = decimalBalance * rate || 0;
    if (tokenAddress === contractAddress || value < 1000) return acc;
    if (tokenPricesMap[tokenAddress]?.usd_24h_vol < 15000) return acc;

    const marketCapUsd = tokenPricesMap[tokenAddress]?.usd_market_cap;
    const dilutedMarketCapUsd =
      toDecimal(tokenInfo.totalSupply, tokenInfo.decimals) * rate;

    const searchedBalance = toDecimal(
      searchedToken.balance,
      searchedToken.tokenInfo.decimals
    );
    const searchedValue = searchedBalance * tokenPricesMap[contractAddress].usd;
    const searchedMarketCap =
      tokenPricesMap[contractAddress].usd_market_cap ||
      toDecimal(
        searchedToken.tokenInfo.totalSupply,
        searchedToken.tokenInfo.decimals
      ) * tokenPricesMap[contractAddress].usd;

    return acc.concat({
      wallet: address.toLowerCase(),
      address: tokenAddress,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      balance: decimalBalance,
      value,
      marketCap: marketCapUsd || dilutedMarketCapUsd,
      searchedBalance,
      searchedValue,
      searchedMarketCap,
    });
  }, []);
}

function sliceArray(arr, len) {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / len);
    if (!resultArray[chunkIndex]) resultArray[chunkIndex] = []; // start a new chunk
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
}

async function fetchCoinGeckoData(addressesInfo) {
  const priceTokensMap = addressesInfo.reduce((acc, data) => {
    if (!data) return acc;
    data.tokens.forEach(({ tokenInfo }) => {
      acc[tokenInfo.address.toLowerCase()] = true;
    });
    return acc;
  }, {});
  const addressSlices = sliceArray(Object.keys(priceTokensMap), 150); // 150 addresses is about the max the API can handle
  let tokenPricesMap = {};
  await Promise.all(
    addressSlices.map(async (addressSlice) => {
      const { data } = await getCoinGeckoData(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressSlice}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`
      );
      tokenPricesMap = { ...tokenPricesMap, ...data };
    })
  );
  return tokenPricesMap;
}

async function getHoldings(richAddresses, contractAddress) {
  const addressesInfo = await Promise.all(
    richAddresses.map(async (address) => {
      const { data } = await getEthplorerData(
        `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=${process.env.ETHPLORER_KEY}`
      );
      if (!data?.tokens || !data?.address || data?.contractInfo) return null;
      return data;
    })
  );

  const tokenPricesMap = await fetchCoinGeckoData(addressesInfo);

  return addressesInfo.reduce((acc, data) => {
    if (!data) return acc;

    return acc.concat(
      reduceTokensToHoldings(data, tokenPricesMap, contractAddress)
    );
  }, []);
}

function filterHoldings(holdings) {
  const aggregateMap = holdings.reduce(
    (acc, { address, value }) => ({
      ...acc,
      [address]: {
        wallets: acc[address]?.wallets + 1 || 1,
        value: acc[address]?.value + value || value,
      },
    }),
    {}
  );
  return holdings.filter(
    ({ address }) =>
      aggregateMap[address].wallets >= 1 && aggregateMap[address].value >= 1000
  );
}

async function recordSnapshot(contractAddress, holdings, timestamp) {
  const document = await snapshotsCollection.findOne({ contractAddress });
  // let { timestamp24h, timestamp7d, timestamp30d } = document || {};
  if (document) {
    holdings = holdings.map((holding) => {
      const previous = document.holdings.find(
        ({ address }) => address === holding.address
      );
      const balanceChange = previous?.balance
        ? (holding.balance * 100) / previous.balance - 100
        : 0;
      // let { balanceChange24h, balanceChange7d, balanceChange30d } = previous;
      // if (timestamp - timestamp24h >= 1000 * 60 * 60 * 24) {
      //   balanceChange24h = previous?.balance24h
      //     ? (holding.balance / previous.balance24h) * 100
      //     : 0;
      //   timestamp24h = timestamp;
      // }
      // if (timestamp - timestamp7d >= 1000 * 60 * 60 * 24 * 7) {
      //   balanceChange7d = previous?.balance7d
      //     ? (holding.balance / previous.balance7d) * 100
      //     : 0;
      //   timestamp7d = timestamp;
      // }
      // if (timestamp - timestamp30d >= 1000 * 60 * 60 * 24 * 30) {
      //   balanceChange30d = previous?.balance30d
      //     ? (holding.balance / previous.balance30d) * 100
      //     : 0;
      //   timestamp30d = timestamp;
      // }
      return {
        ...holding,
        balanceChange,
        // balanceChange24h,
        // balanceChange7d,
        // balanceChange30d,
      };
    });
  }
  snapshotsCollection.updateOne(
    { contractAddress },
    {
      $set: {
        contractAddress,
        timestamp,
        // timestamp24h,
        // timestamp7d,
        // timestamp30d,
        holdings,
      },
    },
    { upsert: true }
  );
}

let pending = false;
async function performGenerate(contractAddress) {
  pending = true;
  try {
    const richAddresses = await getRichAddresses(contractAddress);
    const holdings = await getHoldings(richAddresses, contractAddress);
    const filteredHoldings = filterHoldings(holdings);

    const now = Date.now();
    await recordSnapshot(contractAddress, filteredHoldings, now);
    dataCache.set(contractAddress, true, now);
  } catch (err) {
    dataCache.set(contractAddress, 'error');
    console.error(err);
  }
  queue.shift();
  pending = false;
}
setInterval(() => {
  if (queue.length > 0 && !pending) performGenerate(queue[0]);
}, 1000);

async function recordSearch(name, symbol, address) {
  const document = await topSearchesCollection.findOne({ address });

  topSearchesCollection.updateOne(
    { address },
    {
      $set: {
        name,
        symbol,
        address,
        count: document ? document.count + 1 : 1,
        timestamp: Date.now(),
      },
    },
    { upsert: true }
  );
}

function makeLoadingPayload(contractAddress) {
  return {
    payload: 'loading',
    queuePosition: queue.indexOf(contractAddress),
    success: true,
  };
}

const queue = [];
app.post('/generate', async (req, res) => {
  const contractAddress = req.body.address.toLowerCase();
  const name = req.body.name;
  const symbol = req.body.symbol;
  if (dataCache.get(contractAddress)?.payload === 'error') {
    dataCache.delete(contractAddress);
    return res.send({ success: false });
  }
  if (dataCache.get(contractAddress)) {
    recordSearch(name, symbol, contractAddress);
    const data = await snapshotsCollection.findOne({ contractAddress });
    return res.send({
      payload: data.holdings,
      timestamp: data.timestamp,
      success: true,
    });
  }
  if (queue.includes(contractAddress)) {
    return res.send(makeLoadingPayload(contractAddress));
  }
  queue.push(contractAddress);
  res.send(makeLoadingPayload(contractAddress));
});

app.get('*', (_, res) => {
  return res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Sockets

io.on('connection', (socket) => {
  io.emit('visitors', io.engine.clientsCount);
  socket.on('disconnect', () => {
    io.emit('visitors', io.engine.clientsCount);
  });
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
