const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 4000;
app.use(bodyParser.json());
app.use('/', express.static('build'));

const cache = {};

const blacklist = ['0x0000000000000000000000000000000000000000'];

const topSearches = {};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let throttleTime = 0;
async function throttle(ms) {
  return await sleep(Math.floor(Math.random() * ms) + throttleTime);
}

app.get('/top-searches', (_, res) => {
  const sortedSearches = Object.values(topSearches)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  res.send({ payload: sortedSearches });
});

app.get('/search', async (req, res) => {
  const { term } = req.query;
  try {
    const { data } = await axios.get(
      `https://etherscan.io/searchHandler?term=${term}`
    );
    res.send({ payload: data, success: true });
  } catch (err) {
    res.send({ payload: err, success: false });
  }
});

function extractAddresses(data) {
  const $ = cheerio.load(data);
  return $('tr')
    .map((_, tr) =>
      $(tr)
        .find('td')
        .map((_, td) => $(td).text())
    )
    .filter((_, row) => typeof row[1] === 'string' && row[1].match(/^0x.+/))
    .map((_, row) => row[1])
    .get();
}

async function getRichAddresses(contractAddress) {
  const responses = await Promise.all(
    Array.from({ length: 20 }).map(async (_, i) => {
      await throttle(5000);
      return axios.get(
        `https://etherscan.io/token/generic-tokenholders2?a=${contractAddress}&p=${
          i + 1
        }`
      );
    })
  );

  return responses.reduce(
    (acc, { data }) => acc.concat(extractAddresses(data)),
    []
  );
}

function parseMoney(str) {
  return parseFloat(str.replace(/[$,]/g, ''));
}

async function getHoldings(richAddresses, contractAddress) {
  const responses = await Promise.all(
    richAddresses.map(async (address) => {
      await throttle(5000);
      return axios.get(
        `https://etherscan.io/tokenholdingsHandler.aspx?a=${address}&sort=total_price_usd&order=desc&fav=`
      );
    })
  );

  return responses
    .map((response) => {
      const rows = cheerio('tr', response.data.layout);
      return rows.map((_, tr) =>
        cheerio(tr)
          .find('td')
          .map((_, td) => cheerio(td).text())
      );
    })
    .reduce(
      (acc, tokens, i) =>
        acc.concat(
          tokens
            .map((_, tokenInfo) =>
              mapTokenToHolding(tokenInfo, richAddresses[i])
            )
            .get()
        ),
      []
    )
    .filter(
      (holding) =>
        holding &&
        holding.address !== contractAddress &&
        holding.ticker !== 'ETH' &&
        !isNaN(holding.value) &&
        holding.value >= 1000
    );
}

function getAggregateHoldings(holdingsList) {
  return holdingsList.reduce(
    (acc, { value, address, holdings, wallet, ...rest }) => ({
      ...acc,
      [address]: acc[address]
        ? {
            address,
            value: acc[address].value + value,
            holdings: acc[address].holdings + holdings,
            wallets: acc[address].wallets.concat(wallet),
            ...rest,
          }
        : {
            address,
            value,
            holdings,
            wallets: [wallet],
            ...rest,
          },
    }),
    {}
  );
}

function mapTokenToHolding(tokenInfo, wallet) {
  if (!tokenInfo[1] || tokenInfo[2] === 'ETH' || blacklist.includes(wallet))
    return null;

  const [name, address] = tokenInfo[1].replace('0x', '%%0x').split('%%');
  const cleanedAddress = address.slice((address.match(/0x/g).length - 1) * 2);
  const holdings = parseMoney(tokenInfo[3]);
  const price = parseMoney(tokenInfo[4]);
  const value = parseMoney(tokenInfo[7]);
  return {
    name,
    address: cleanedAddress.toLowerCase(),
    ticker: tokenInfo[2],
    holdings,
    price,
    value,
    wallet,
  };
}

async function appendMissingMarketCap(holding) {
  const { data } = await axios.get(
    `https://api.coingecko.com/api/v3/coins/ethereum/contract/${holding.address}`
  );
  const totalSupply = data.market_data.total_supply;
  const price = data.market_data.current_price.usd;
  return { ...holding, marketCap: price * totalSupply };
}

async function appendMarketCap(holdings) {
  const addresses = holdings.map(({ address }) => address);
  const { data } = await axios.get(
    `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd&include_market_cap=true`
  );
  const filteredHoldings = holdings.filter((holding) => data[holding.address]);
  const missingDataList = filteredHoldings.filter(
    (holding) => !data[holding.address].usd_market_cap
  );
  const appendedMissingDataList = await Promise.all(
    missingDataList.map(appendMissingMarketCap)
  );
  const missingDataMap = appendedMissingDataList.reduce((acc, holding) => {
    acc[holding.address] = holding.marketCap;
    return acc;
  }, {});

  return filteredHoldings.map((holding) => ({
    ...holding,
    marketCap:
      missingDataMap[holding.address] || data[holding.address].usd_market_cap,
  }));
}

// async function appendMarketCap(holding) {
// await throttle(5000);
// const { data } = await axios.get(
//   `https://etherscan.io/token/${holding.address}`
// );
// const $ = cheerio.load(data);
// const circulatingCapTr = $('#tokenInfo tr')
//   .get()
//   .find((tr) =>
//     $(tr)
//       .find('td')
//       .get()
//       .some((td) => $(td).text().includes('Capitalization'))
//   );
// const circulatingCap = circulatingCapTr
//   ? parseMoney($(circulatingCapTr.lastChild).text())
//   : 0;
// const dilutedCap = parseMoney(cheerio('#pricebutton', data).text());
// if (!circulatingCap && !dilutedCap) {
//   console.log('OI', holding);
// }
// return {
//   ...holding,
//   marketCap: circulatingCap || dilutedCap,
// };
// }

function getOwnershipPercentage(value, marketCap) {
  return (value / marketCap) * 100;
}

function recordSearch(name, address) {
  topSearches[name] = {
    name,
    address,
    count: topSearches[name] ? topSearches[name].count + 1 : 1,
  };
}

app.post('/generate', async (req, res) => {
  const contractAddress = req.body.address.toLowerCase();
  const name = req.body.name;
  recordSearch(name, contractAddress);
  if (
    cache[contractAddress] &&
    Date.now() - cache[contractAddress].timestamp < 1000 * 60 * 30
  ) {
    return res.send({ ...cache[contractAddress], success: true });
  }

  try {
    throttleTime += 1000;
    const richAddresses = await getRichAddresses(contractAddress);
    const holdingsList = await getHoldings(richAddresses, contractAddress);
    const aggregateHoldings = getAggregateHoldings(holdingsList);
    const filteredHoldingsList = Object.values(aggregateHoldings).filter(
      (holding) => holding.value >= 10000 && holding.wallets.length >= 5
    );
    // const holdingsMarketCap = await Promise.all(
    //   filteredHoldingsList.map(appendMarketCap)
    // );
    const holdingsMarketCap = await appendMarketCap(filteredHoldingsList);
    const cleanedList = holdingsMarketCap.map(
      ({ value, holdings, marketCap, wallets, ...rest }) => ({
        value: Math.floor(value),
        holdings: Math.floor(holdings),
        marketCap: Math.floor(marketCap),
        ownershipPercentage: getOwnershipPercentage(value, marketCap),
        walletCount: wallets.length,
        wallets,
        ...rest,
      })
    );

    throttleTime = Math.max(throttleTime - 1000, 0);
    const now = Date.now();
    cache[contractAddress] = { data: cleanedList, timestamp: now };
    res.send({ data: cleanedList, timestamp: now, success: true });
  } catch (err) {
    console.log(err);
    return res.send({ error: err.message, success: false });
  }
});

app.get('*', (req, res) => {
  return res.sendFile(__dirname + '../public/index.html');
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
