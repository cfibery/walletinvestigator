import React, { useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { BarChart, Bar, XAxis, Tooltip, Legend } from 'recharts';
import styled from 'styled-components';
import { memoizedSorting } from './utils';
import CustomTooltip from './CustomTooltip';
import HiddenTokens from './HiddenTokens';
import Sorting, { sortingKeys } from './Sorting';
import Filters from './Filters';

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  & > h6 {
    margin: 0;
  }
`;

function formatLegend(val) {
  return val
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((str) => str[0].toUpperCase() + str.slice(1).toLowerCase())
    .join(' ');
}

function Chart({ data }) {
  const { selected, sorting, filter, lastUpdate } = useSelector(
    ({ selected, sorting, filter, lastUpdate }) => ({
      selected,
      sorting,
      filter,
      lastUpdate,
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
  const filteredData = memoizedSorting(data, filter, sorting)
    .filter(
      (holding) =>
        !hiddenData[holding.address]?.hidden &&
        selected.every(({ address }) => address !== holding.address)
    )
    .slice(0, 20);
  const { width, height } = window.visualViewport;
  const lastUpdateMinutes = Math.floor((Date.now() - lastUpdate) / (1000 * 60));
  const lastUpdateMessage =
    lastUpdateMinutes <= 1 ? 'Just now' : `${lastUpdateMinutes} minutes ago`;
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
        width={width - 20}
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
      <Toolbar>
        <Sorting />
        <Filters />
        <h6>Last updated: {lastUpdateMessage}</h6>
      </Toolbar>
    </div>
  );
}

export default Chart;
