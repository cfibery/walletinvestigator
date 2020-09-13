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
          [getKey('marketCap')]: marketCap,
          marketCap: tokenMarketCap,
          ...rest
        }
      ) => {
        return {
          ...acc,
          [address]: {
            ...rest,
            address,
            marketCap: tokenMarketCap,
            value: acc[address]?.value + value || value,
            balance: acc[address]?.balance + balance || balance,
            wallets: acc[address]?.wallets.concat(wallet) || [wallet],
            walletCount: acc[address]?.walletCount + 1 || 1,
            ownershipPercentage:
              acc[address]?.ownershipPercentage + (value / marketCap) * 100 ||
              (value / marketCap) * 100,
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
