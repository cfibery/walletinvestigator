import memoizeOne from 'memoize-one';

function combineData(data) {
  const dataMap = Object.values(data)
    .reduce((prev, next) => prev.concat(next)) // flatten
    .reduce(
      (acc, { value, address, balance, wallet, marketCap, ...rest }) => ({
        ...acc,
        [address]: {
          address,
          marketCap,
          value: acc[address]?.value + value || value,
          balance: acc[address]?.balance + balance || balance,
          wallets: acc[address]?.wallets.concat(wallet) || [wallet],
          walletCount: acc[address]?.walletCount + 1 || 1,
          ownershipPercentage:
            acc[address]?.ownershipPercentage + (value / marketCap) * 100 ||
            (value / marketCap) * 100,
          ...rest,
        },
      }),
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

function combineAndSort(data, filter, sorting) {
  const combinedData = combineData(data);
  const filteredData = filterData(combinedData, filter);
  return sortData(filteredData, sorting);
}

export const memoizedSorting = memoizeOne(combineAndSort);
