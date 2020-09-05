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

const client = new MongoClient(process.env.MONGO_URL, {
  useUnifiedTopology: true,
});
let topSearchesCollection;
async function initDb() {
  try {
    await client.connect();
    const db = await client.db('whaleinspector');
    topSearchesCollection = await db.collection('topSearches');
  } catch (err) {
    console.error(err);
  }
}
initDb();

const walletCache = new ApiCache(1000 * 60 * 60 * 6);
const dataCache = new ApiCache(1000 * 60 * 60 * 6);
const blacklist = ['0x0000000000000000000000000000000000000000']
  .concat(exchangeWallets)
  .concat(contracts);

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
    .slice(0, 20);
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
        address: platform.token_address,
      }));
  } catch (err) {
    console.error('CMC get tokens error', err);
  }
}
setInterval(getCmcTokens, 1000 * 60 * 60 * 12); // get coins every 12 hours
getCmcTokens(); // initial call

app.get('/load-tokens', (_, res) => {
  res.send({ payload: cmcTokens, success: true });
});

async function getRichAddresses(contractAddress) {
  const { data } = await getEthplorerData(
    `https://api.ethplorer.io/getTopTokenHolders/${contractAddress}?apiKey=${process.env.ETHPLORER_KEY}&limit=1000`
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
    return acc.concat({
      wallet: address.toLowerCase(),
      address: tokenAddress,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      balance: decimalBalance,
      value,
      marketCap: marketCapUsd || dilutedMarketCapUsd,
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
      if (walletCache.get(address)) return walletCache.get(address).payload;
      const response = await getEthplorerData(
        `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=${process.env.ETHPLORER_KEY}`
      );
      if (!response.data?.tokens || !response.data?.address) {
        console.error(response);
        throw new Error(`Bad data for ${address}`);
      }
      if (response.data.contractInfo) {
        walletCache.set(address, null);
        return null;
      }
      walletCache.set(address, response.data);
      return response.data;
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
      aggregateMap[address].wallets >= 5 && aggregateMap[address].value >= 10000
  );
}

const pending = {};
async function performGenerate(contractAddress) {
  pending[contractAddress] = true;
  try {
    const richAddresses = await getRichAddresses(contractAddress);
    const holdings = await getHoldings(richAddresses, contractAddress);
    const filteredHoldings = filterHoldings(holdings);

    dataCache.set(contractAddress, filteredHoldings);
  } catch (err) {
    dataCache.set(contractAddress, 'error');
    console.error(err);
  }
  pending[contractAddress] = false;
}

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

app.post('/generate', (req, res) => {
  const contractAddress = req.body.address.toLowerCase();
  const name = req.body.name;
  const symbol = req.body.symbol;
  if (dataCache.get(contractAddress)?.payload === 'error') {
    dataCache.delete(contractAddress);
    return res.send({ success: false });
  }
  if (dataCache.get(contractAddress)) {
    recordSearch(name, symbol, contractAddress);
    return res.send({ ...dataCache.get(contractAddress), success: true });
  }
  if (pending[contractAddress]) {
    return res.send({ payload: 'loading', success: true });
  }
  performGenerate(contractAddress);
  res.send({ payload: 'loading', success: true });
});

app.get('*', (_, res) => {
  return res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Sockets

let visitors = 0;

io.on('connection', (socket) => {
  visitors++;
  io.emit('visitors', visitors);
  socket.on('disconnect', () => {
    visitors = Math.max(visitors - 1, 0);
    io.emit('visitors', visitors);
  });
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
