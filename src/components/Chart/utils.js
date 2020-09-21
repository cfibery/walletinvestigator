import memoizeOne from 'memoize-one';

function prependSearched(str) {
  return `searched${str[0].toUpperCase()}${str.slice(1)}`;
}

function combineData(data, mode) {
  const getKey = (str) => (mode === 'follow' ? str : prependSearched(str));
  const dataMap = Object.values(data)
    .reduce((prev, next) => prev.concat(next)) // flatten
    .reduce(
      (
        acc,
        {
          address,
          wallet,
          [getKey('value')]: value,
          [getKey('balance')]: balance,
          [getKey('balance24h')]: balance24h,
          [getKey('balance7d')]: balance7d,
          [getKey('price')]: price,
          [getKey('marketCap')]: marketCap,
          marketCap: tokenMarketCap,
          ...rest
        }
      ) => {
        const ownershipPercentage =
          marketCap > 0 ? (value / marketCap) * 100 : 0;
        const walletData = {
          address: wallet,
          value,
          ownershipPercentage,
          balance,
          balance24h,
          balance7d,
          balanceChange24h: getBalanceChange(
            { balance, balance24h, price },
            '24h'
          ),
          balanceChange7d: getBalanceChange(
            { balance, balance7d, price },
            '7d'
          ),
        };

        return {
          ...acc,
          [address]: {
            ...rest,
            address,
            price,
            marketCap: tokenMarketCap,
            value: acc[address]?.value + value || value,
            balance: acc[address]?.balance + balance || balance,
            balance24h: acc[address]?.balance24h + balance24h || balance24h,
            balance7d: acc[address]?.balance7d + balance7d || balance7d,
            wallets: acc[address]?.wallets.concat(walletData) || [walletData],
            walletCount: acc[address]?.walletCount + 1 || 1,
            ownershipPercentage:
              acc[address]?.ownershipPercentage + ownershipPercentage ||
              ownershipPercentage,
          },
        };
      },
      {}
    );

  return Object.values(dataMap);
}

function sortByValue(data) {
  return data.sort((a, b) => b.value - a.value);
}

function sortByOwnership(data) {
  return data.sort((a, b) => b.ownershipPercentage - a.ownershipPercentage);
}

function sortByWallets(data) {
  return data.sort((a, b) => {
    if (b.walletCount === a.walletCount) return b.value - a.value;
    return b.walletCount - a.walletCount;
  });
}

function sortByAggregate(data) {
  const [maxValue, maxWalletCount] = data.reduce(
    (acc, { value, walletCount }) => [
      !acc[0] || acc[0] < value ? value : acc[0],
      !acc[1] || acc[1] < walletCount ? walletCount : acc[1],
    ],
    []
  );
  return data
    .map((holding) => ({
      ...holding,
      aggregate:
        holding.value / maxValue + holding.walletCount / maxWalletCount,
    }))
    .sort((a, b) => b.aggregate - a.aggregate);
}

function getBalanceChange(holding, timeframe) {
  let previousBalance = holding[`balance${timeframe}`];
  if (previousBalance * holding.price < 500) previousBalance = 0;
  const balanceChange = holding.balance - previousBalance;
  const valueChange = balanceChange * holding.price;
  if (Math.abs(valueChange) < 500) return 0;
  if (previousBalance === 0) return 100;
  return (holding.balance / previousBalance - 1) * 100;
}

function sortByBalanceChange(data, timeframe) {
  return data
    .reduce(
      (acc, holding) =>
        acc.concat({
          ...holding,
          balanceChange: getBalanceChange(holding, timeframe),
        }),
      []
    )
    .sort((a, b) => b.balanceChange - a.balanceChange);
}

function sortData(data, sorting) {
  switch (sorting) {
    case '$':
    default:
      return sortByValue(data);
    case '%':
      return sortByOwnership(data);
    case 'wallets':
      return sortByWallets(data);
    case 'aggregate':
      return sortByAggregate(data);
    case '24h':
    case '7d':
      return sortByBalanceChange(data, sorting);
  }
}

function filterData(data, filter) {
  if (filter === 'all') return data;
  return data.filter((holding) => holding.marketCap < Number(filter) * 1000000);
}

function combineAndSort(data, filter, sorting, mode) {
  const combinedData = combineData(data, mode);
  const filteredData = filterData(combinedData, filter);
  return sortData(filteredData, sorting);
}

export const memoizedSorting = memoizeOne(combineAndSort);
