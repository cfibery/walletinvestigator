import memoizeOne from 'memoize-one';

function combineData(data) {
  const dataMap = Object.values(data)
    .reduce((prev, next) => prev.concat(next)) // flatten
    .reduce(
      (acc, { value, address, holdings, wallets, ...rest }) => ({
        ...acc,
        [address]: acc[address]
          ? {
              address,
              value: acc[address].value + value,
              holdings: acc[address].holdings + holdings,
              wallets: acc[address].wallets.concat(wallets),
              ...rest,
            }
          : {
              address,
              value,
              holdings,
              wallets,
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

function sortData(data, sorting) {
  switch (sorting) {
    case '$':
    default:
      return sortByValue(data);
    case '%':
      return sortByOwnership(data);
    case 'wallets':
      return sortByWallets(data);
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
