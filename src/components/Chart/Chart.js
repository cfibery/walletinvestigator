import React, { useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { BarChart, Bar, Cell, XAxis, Tooltip, Legend } from 'recharts';
import { memoizedSorting } from './utils';
import { sortingKeys } from '../Toolbar/Sorting';
import CustomTooltip from './CustomTooltip';
import HiddenTokens from './HiddenTokens';
import Toolbar from '../Toolbar';

function formatLegend(val) {
  return val
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((str) => str[0].toUpperCase() + str.slice(1).toLowerCase())
    .join(' ');
}

function Chart({ data }) {
  const { selected, sorting, filter, mode, reverse, ignoreList } = useSelector(
    ({ selected, sorting, filter, mode, reverse, ignoreList }) => ({
      selected,
      sorting,
      filter,
      mode,
      reverse,
      ignoreList,
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
  let filteredData = memoizedSorting(
    data,
    filter,
    sorting,
    mode,
    ignoreList
  ).filter(
    (holding) =>
      !hiddenData[holding.address]?.hidden &&
      selected.every(({ address }) => address !== holding.address) &&
      holding.balanceChange !== 0
  );
  filteredData = reverse ? filteredData.reverse() : filteredData;
  filteredData = filteredData.slice(0, width < 768 ? 10 : 20);
  const dataKey = sortingKeys[sorting];
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
          dataKey={dataKey}
          fill="#8884d8"
          onClick={({ payload }) =>
            filteredData.length > 1 && updateHiddenData(payload, true)
          }
        >
          {filteredData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                dataKey === 'balanceChange'
                  ? (entry[dataKey] > 0 && '#4caf50') || '#f44336'
                  : '#8883d9'
              }
            />
          ))}
        </Bar>
      </BarChart>
      <Toolbar />
    </div>
  );
}

export default Chart;
