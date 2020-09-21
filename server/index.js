const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const MongoClient = require('mongodb').MongoClient;
const Bottleneck = require('bottleneck');
const blacklist = require('./blacklist.json');
const ApiCache = require('./apicache');
const port = process.env.PORT || 4000;
app.use(bodyParser.json({ limit: '50mb' }));
app.use('/', express.static('build'));

const CACHE_MAX_AGE = 1000 * 60 * 60;
const dataCache = new ApiCache(CACHE_MAX_AGE);

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
    snapshotsCollection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    await snapshotsCollection
      .find({}, { contractAddress: 1, timestamp: 1 })
      .forEach(({ contractAddress, timestamp }) =>
        dataCache.set(contractAddress, true, timestamp)
      );
  } catch (err) {
    console.error(err);
  }
}
initDb();

const limiter = new Bottleneck({ minTime: 100, maxConcurrent: 1 });
const wrappedAxiosGet = limiter.wrap(axios.get);

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
getCmcTokens(); // initial call

app.get('/load-tokens', (_, res) => {
  const payload = cmcTokens.map((token) => ({
    ...token,
    ready: !!dataCache.get(token.address),
  }));
  res.send({ payload, success: true });
});

async function getRichAddresses(contractAddress) {
  const { data } = await wrappedAxiosGet(
    `https://api.bloxy.info/token/token_holders_list?token=${contractAddress}&limit=2000&key=${process.env.BLOXY_KEY}&format=structure`
  );
  return data.reduce(
    (acc, { address, address_type, annotation }) =>
      blacklist.includes(address) || address_type !== 'Wallet' || annotation
        ? acc
        : acc.concat(address.toLowerCase()),
    []
  );
}

function recordSnapshot(contractAddress, holdings, timestamp) {
  snapshotsCollection.updateOne(
    { contractAddress },
    {
      $set: {
        expireAt: new Date(timestamp + CACHE_MAX_AGE),
        contractAddress,
        timestamp,
        holdings,
      },
    },
    { upsert: true }
  );
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

app.get('/top-holders', async (req, res) => {
  const contractAddress = req.query.address.toLowerCase();
  const addresses = await getRichAddresses(contractAddress);
  res.send({ payload: addresses, success: true });
});

app.post('/cache-data', async (req, res) => {
  const contractAddress = req.body.address.toLowerCase();
  const data = req.body.data;
  const now = Date.now();
  recordSnapshot(contractAddress, data, now);
  dataCache.set(contractAddress, true, now);
  res.send({ timestamp: now, success: true });
});

app.get('/data', async (req, res) => {
  const contractAddress = req.query.address.toLowerCase();
  const name = req.query.name;
  const symbol = req.query.symbol;
  if (dataCache.get(contractAddress)) {
    recordSearch(name, symbol, contractAddress);
    const data = await snapshotsCollection.findOne({ contractAddress });
    return res.send({
      payload: data.holdings,
      timestamp: data.timestamp,
      success: true,
    });
  }
  res.send({ success: false });
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
