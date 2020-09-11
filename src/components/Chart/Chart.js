import React, { useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { BarChart, Bar, XAxis, Tooltip, Legend } from 'recharts';
import { memoizedSorting } from './utils';
import { sortingKeys } from '../Toolbar/Sorting';
import CustomTooltip from './CustomTooltip';
import HiddenTokens from './HiddenTokens';

function formatLegend(val) {
  return val
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((str) => str[0].toUpperCase() + str.slice(1).toLowerCase())
    .join(' ');
}

function Chart({ data }) {
  const { selected, sorting, filter, mode } = useSelector(
    ({ selected, sorting, filter, mode }) => ({
      selected,
      sorting,
      filter,
      mode,
    }),
    shallowEqual
  );
  const [hiddenData, setHiddenData] = useState({});
  const updateHiddenData = ({ address, ...rest }, hidden) =>
    setHiddenData({
      ...hiddenData,
      [address]: { ...rest, hidden, address },
    });
  const clearHiddenData = () => {
    setHiddenData({});
  };
  const hasHiddenAddresses = Object.values(hiddenData).some(({ hidden }) =>
    Boolean(hidden)
  );
  const width = window.visualViewport?.width || window.innerWidth;
  const height = window.visualViewport?.height || window.innerHeight;
  const filteredData = memoizedSorting(data, filter, sorting, mode)
    .filter(
      (holding) =>
        !hiddenData[holding.address]?.hidden &&
        selected.every(({ address }) => address !== holding.address)
    )
    .slice(0, width < 768 ? 10 : 20);
  return (
    <div>
      {hasHiddenAddresses && (
        <HiddenTokens
          hiddenData={hiddenData}
          updateHiddenData={updateHiddenData}
          clearHiddenData={clearHiddenData}
        />
      )}
      <BarChart
        width={width - 25}
        height={Math.max(Math.floor(height * 0.65), 400)}
        data={filteredData}
      >
        <XAxis dataKey="symbol" />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={formatLegend} verticalAlign="top" />
        <Bar
          dataKey={sortingKeys[sorting]}
          fill="#8884d8"
          onClick={({ payload }) =>
            filteredData.length > 1 && updateHiddenData(payload, true)
          }
        />
      </BarChart>
    </div>
  );
}

export default Chart;
