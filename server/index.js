const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const Bottleneck = require('bottleneck');
const exchangeWallets = require('./exchangeWallets.json');
const ApiCache = require('./apicache');
const port = process.env.PORT || 4000;
app.use(bodyParser.json());
app.use('/', express.static('build'));

const apiCache = new ApiCache(1000 * 60 * 60 * 6);
const blacklist = ['0x0000000000000000000000000000000000000000'].concat(
  exchangeWallets
);
const topSearches = {};

// 133.33 -> ~7.5 requests / second
const limiter = new Bottleneck({ minTime: 133.33 });
const getCoinGeckoData = limiter.wrap(axios.get);
const getEthplorerData = limiter.wrap(axios.get);

app.get('/top-searches', (_, res) => {
  const sortedSearches = Object.values(topSearches)
    .sort((a, b) => b.count - a.count)
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
    console.log('CMC get tokens error', err);
  }
}
setInterval(getCmcTokens, 1000 * 60 * 60 * 12); // get coins every 12 hours
getCmcTokens(); // initial call

app.get('/search', async (_, res) => {
  res.send({ payload: cmcTokens, success: true });
});

async function searchCoinGecko(address) {
  try {
    const { data } = await getCoinGeckoData(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
    );
    return [
      {
        img: data.image.small,
        name: data.name,
        symbol: data.symbol,
        address,
      },
    ];
  } catch (err) {
    console.log(`${address} not found on CoinGecko`);
    return null;
  }
}

async function searchEthplorer(address) {
  try {
    const { data } = await getEthplorerData(
      `https://api.ethplorer.io/getTokenInfo/${address}?apiKey=${process.env.ETHPLORER_KEY}`
    );
    return [
      {
        img: 'http://etherscan.io/images/main/empty-token.png',
        name: data.name,
        symbol: data.symbol,
        address,
      },
    ];
  } catch (err) {
    console.log(`${address} not found on Ethplorer`);
    return null;
  }
}

app.get('/search-contract', async (req, res) => {
  const { address } = req.query;
  let payload = await searchCoinGecko(address);
  if (!payload) payload = await searchEthplorer(address);
  if (!payload) return res.send({ payload: 'Not found', success: false });
  res.send({ payload, success: true });
});

async function getRichAddresses(contractAddress) {
  const { data } = await getEthplorerData(
    `https://api.ethplorer.io/getTopTokenHolders/${contractAddress}?apiKey=${process.env.ETHPLORER_KEY}&limit=1000`
  );
  return data.holders.map(({ address }) => address);
}

function toDecimal(num, decimals) {
  return num * `1e-${decimals}`;
}

function reduceTokensToHoldings({ tokens, address }, contractAddress) {
  return tokens.reduce((acc, { tokenInfo, balance }) => {
    const tokenAddress = tokenInfo.address.toLowerCase();
    const decimalBalance = toDecimal(balance, tokenInfo.decimals);
    const value = decimalBalance * tokenInfo.price?.rate || 0;
    if (tokenAddress === contractAddress || value < 1000) return acc;

    return acc.concat({
      wallet: address.toLowerCase(),
      address: tokenAddress,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      balance: decimalBalance,
      value,
      marketCap:
        tokenInfo.price?.marketCapUsd ||
        toDecimal(tokenInfo.totalSupply, tokenInfo.decimals) *
          tokenInfo.price?.rate,
    });
  }, []);
}

async function getHoldings(richAddresses, contractAddress) {
  const responses = await Promise.all(
    richAddresses.map(async (address) => {
      if (apiCache.isValid(address)) return apiCache.get(address).payload;
      const response = await getEthplorerData(
        `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=${process.env.ETHPLORER_KEY}`
      );
      apiCache.set(address, response);
      return response;
    })
  );

  return responses.reduce((acc, { data }) => {
    if (data.contractInfo || blacklist.includes(data.address.toLowerCase()))
      return acc;

    return acc.concat(reduceTokensToHoldings(data, contractAddress));
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

function recordSearch(name, address) {
  topSearches[name] = {
    name,
    address,
    count: topSearches[name] ? topSearches[name].count + 1 : 1,
  };
}

const pending = {};
app.post('/generate', async (req, res) => {
  const contractAddress = req.body.address.toLowerCase();
  const name = req.body.name;
  recordSearch(name, contractAddress);
  if (apiCache.isValid(contractAddress)) {
    return res.send({ ...apiCache.get(contractAddress), success: true });
  }
  if (pending[contractAddress]) {
    return res.send({
      payload: 'Token data pending, please try again in a few minutes.',
      success: false,
    });
  }
  pending[contractAddress] = true;
  try {
    const richAddresses = await getRichAddresses(contractAddress);
    const holdings = await getHoldings(richAddresses, contractAddress);
    const filteredHoldings = filterHoldings(holdings);

    apiCache.set(contractAddress, filteredHoldings);
    res.send({
      payload: filteredHoldings,
      timestamp: apiCache.get(contractAddress).timestamp,
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.send({ payload: err.message, success: false });
  }
  pending[contractAddress] = false;
});

app.get('*', (_, res) => {
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
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
