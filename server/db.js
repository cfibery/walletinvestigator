const MongoClient = require('mongodb').MongoClient;
const ApiCache = require('./apicache');

const CACHE_MAX_AGE = 1000 * 60 * 60;
const cache = new ApiCache(CACHE_MAX_AGE);

const mongoClient = new MongoClient(process.env.MONGO_URL, {
  useUnifiedTopology: true,
});

async function init() {
  try {
    await mongoClient.connect();
    const client = await mongoClient.db(process.env.DB_NAME);
    client.ignoreLists = await client.collection('ignoreLists');
    client.topSearches = await client.collection('topSearches');
    client.snapshots = await client.collection('snapshots');
    client.snapshots.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    await client.snapshots
      .find({}, { contractAddress: 1, timestamp: 1 })
      .forEach(({ contractAddress, timestamp }) =>
        cache.set(contractAddress, true, timestamp)
      );
    return client;
  } catch (err) {
    console.error(err);
  }
}

function recordSnapshot(client, contractAddress, holdings, timestamp) {
  client.snapshots.updateOne(
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

async function recordSearch(client, name, symbol, address) {
  const document = await client.topSearches.findOne({ address });

  client.topSearches.updateOne(
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

module.exports = { init, cache, recordSnapshot, recordSearch };
