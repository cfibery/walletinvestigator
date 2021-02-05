import { batch, useSelector, useDispatch } from 'react-redux';
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({ minTime: 200, maxConcurrent: 1 });
const wrappedFetch = limiter.wrap(fetch);

function sliceArray(arr, len) {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / len);
    if (!resultArray[chunkIndex]) resultArray[chunkIndex] = []; // start a new chunk
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
}

async function getTopHolders(address) {
  const response = await fetch(`/top-holders?address=${address}`);
  const { payload } = await response.json();
  return payload;
}

async function getLastBlock() {
  const response = await fetch(
    'https://api.ethplorer.io/getLastBlock?apiKey=freekey'
  );
  const { lastBlock } = await response.json();
  return lastBlock;
}

const AVERAGE_BLOCK_TIME = 15;
const secondsInDay = 24 * 60 * 60;
const blockCount24h = secondsInDay / AVERAGE_BLOCK_TIME;
const blockCount7d = (secondsInDay * 7) / AVERAGE_BLOCK_TIME;

function makeHoldingsQuery(addresses) {
  return `{
    ethereum {
      address(address: {in: ${JSON.stringify(addresses)}}) {
        balances{
          currency {
            address
            name
            symbol
          }
          value
        }
        address
        smartContract {
          contractType
        }
      }
    }
  }`;
}

function makeHistoryQuery(addresses, lastBlock) {
  return `{
    ethereum {
      address(address: {in: ${JSON.stringify(addresses)}}) {
        balances(height: {between: [
          ${lastBlock - blockCount7d}, ${lastBlock - blockCount24h}
        ]}) {
          currency {
            address
          }
          history {
            timestamp
            value
            transferAmount
          }
        }
        address
      }
    }
  }`;
}

async function queryHoldings(addresses) {
  const response = await wrappedFetch('https://graphql.bitquery.io/', {
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query: makeHoldingsQuery(addresses),
    }),
  });
  return await response.json();
}

async function queryHistory(addresses, lastBlock) {
  const response = await wrappedFetch('https://graphql.bitquery.io/', {
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query: makeHistoryQuery(addresses, lastBlock),
    }),
  });
  return await response.json();
}

function getHistoryBalance(history) {
  const result = Math.abs(history.value - history.transferAmount);
  return result < 0.0001 ? 0 : result;
}

function isPastDate(firstDate, secondDate) {
  return firstDate.setHours(0, 0, 0, 0) - secondDate.setHours(0, 0, 0, 0) < 0;
}

function appendBalanceHistory(balance, historyData, i) {
  if (balance.currency.address === '-') return [];
  const found = historyData.ethereum.address[i].balances.find(
    ({ currency }) => currency.address === balance.currency.address
  );
  let balance24h, balance7d;
  if (!found) {
    balance24h = balance7d = 0;
  } else {
    const { history } = found;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const history24h = history.find(
      ({ timestamp }) => new Date(timestamp).getDate() === yesterday.getDate()
    );
    const history7d = history.find(({ timestamp }) =>
      isPastDate(new Date(timestamp), yesterday)
    );
    balance24h = history24h ? getHistoryBalance(history24h) : balance.value;
    balance7d = history7d ? getHistoryBalance(history7d) : balance.value;
  }

  return {
    currency: balance.currency,
    balance: balance.value,
    balance24h,
    balance7d,
  };
}

async function fetchBalances(addresses) {
  const lastBlock = await getLastBlock();
  const addressSlices = sliceArray(addresses, 1000);
  let holdings = [];
  await Promise.all(
    addressSlices.map(async (addressSlice) => {
      const { data: holdingsData } = await queryHoldings(addressSlice);
      const { data: historyData } = await queryHistory(addressSlice, lastBlock);

      const data = holdingsData.ethereum.address.map(
        ({ balances, address, smartContract }, i) => ({
          address,
          smartContract,
          balances: balances.reduce(
            (acc, balance) =>
              acc.concat(appendBalanceHistory(balance, historyData, i)),
            []
          ),
        })
      );
      holdings = holdings.concat(data);
    })
  );
  return holdings.reduce(
    (acc, { balances, address, smartContract }) =>
      smartContract ? acc : acc.concat({ balances, wallet: address }),
    []
  );
}

async function fetchPrices(holdings) {
  const priceTokensMap = holdings.reduce((acc, data) => {
    data.balances.forEach(({ currency }) => {
      acc[currency.address.toLowerCase()] = true;
    });
    return acc;
  }, {});

  let addressSlices = sliceArray(Object.keys(priceTokensMap), 150); // 150 addresses is about the max the API can handle
  let tokenPricesMap = {};
  do {
    addressSlices = addressSlices.filter((e) => e !== true);
    const prices = await Promise.all(
      addressSlices.map(async (addressSlice, idx, arr) => {
        try {
          const response = await wrappedFetch(
            `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressSlice}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`
          );
          const data = await response.json();
          arr[idx] = true;
          return data;
        } catch (err) {
          console.log(err);
        }
      })
    );
    tokenPricesMap = prices.reduce(
      (acc, data) => ({ ...acc, ...data }),
      tokenPricesMap
    );
  } while (addressSlices.some((e) => e !== true));
  return tokenPricesMap;
}

function reduceTokensToHoldings(
  { balances, wallet },
  tokenPricesMap,
  contractAddress
) {
  const searchedToken = balances.find(
    ({ currency }) => currency.address.toLowerCase() === contractAddress
  );
  return balances.reduce(
    (acc, { currency, balance, balance24h, balance7d }) => {
      const tokenAddress = currency.address.toLowerCase();
      const rate = tokenPricesMap[tokenAddress]?.usd;
      const value = balance * rate || 0;
      if (tokenAddress === contractAddress || value < 500) return acc;
      if (tokenPricesMap[tokenAddress]?.usd_24h_vol < 15000) return acc;

      const marketCap = tokenPricesMap[tokenAddress]?.usd_market_cap || 0;

      const searchedBalance = searchedToken.balance;
      const searchedBalance24h = searchedToken.balance24h;
      const searchedBalance7d = searchedToken.balance7d;
      const searchedPrice = tokenPricesMap[contractAddress].usd;
      const searchedValue = searchedBalance * searchedPrice;
      const searchedMarketCap =
        tokenPricesMap[contractAddress].usd_market_cap || 0;

      return acc.concat({
        wallet,
        address: tokenAddress,
        name: currency.name,
        symbol: currency.symbol,
        price: rate,
        balance,
        balance24h,
        balance7d,
        value,
        marketCap,
        searchedBalance,
        searchedBalance24h,
        searchedBalance7d,
        searchedValue,
        searchedPrice,
        searchedMarketCap,
      });
    },
    []
  );
}

async function cacheData(address, data) {
  const response = await fetch('/cache-data', {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ address, data }),
  });
  const { timestamp } = await response.json();
  return timestamp;
}

async function fetchCache({ name, symbol, address }) {
  const response = await fetch(
    `/data?address=${address}&name=${name}&symbol=${symbol}`
  );
  const { payload, timestamp, success } = await response.json();
  return { payload, timestamp, success };
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

const LOADING_STEPS = 6;
export default function useSearchHandler() {
  const { selected } = useSelector(({ selected }) => ({ selected }));
  const dispatch = useDispatch();
  const updateLoadingProgress = (value, message) =>
    dispatch({ type: 'SET_LOADING_PROGRESS', payload: { value, message } });

  return async ({ name, symbol, address }) => {
    address = address.toLowerCase();
    dispatch({ type: 'SET_QUERY', payload: '' });
    if (selected.find((token) => token.address === address)) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    updateLoadingProgress(1 / LOADING_STEPS, 'Fetching cache...');
    const { payload, timestamp, success } = await fetchCache({
      name,
      symbol,
      address,
    });

    const finish = (data, timestamp) => {
      updateLoadingProgress(1, '');
      batch(() => {
        dispatch({ type: 'ADD_SELECTED', payload: { name, symbol, address } });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_DATA', payload: { address, data } });
        dispatch({ type: 'SET_LAST_UPDATE', payload: timestamp });
      });
    };

    if (success) return finish(payload, timestamp);
    updateLoadingProgress(2 / LOADING_STEPS, 'Fetching top holders...');
    const addresses = await getTopHolders(address);
    updateLoadingProgress(3 / LOADING_STEPS, 'Fetching balances...');
    const balances = await fetchBalances(addresses);
    updateLoadingProgress(4 / LOADING_STEPS, 'Fetching prices...');
    const tokenPricesMap = await fetchPrices(balances);
    const holdings = balances.reduce((acc, data) => {
      return acc.concat(reduceTokensToHoldings(data, tokenPricesMap, address));
    }, []);
    const filteredHoldings = filterHoldings(holdings);
    updateLoadingProgress(5 / LOADING_STEPS, 'Saving to cache...');
    const cacheTimestamp = await cacheData(address, filteredHoldings);
    finish(filteredHoldings, cacheTimestamp);
  };
}
