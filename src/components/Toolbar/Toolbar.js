import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Sorting from './Sorting';
import Filters from './Filters';
import ModeSwitcher from './ModeSwitcher';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  h6 {
    margin: 0;
  }
`;

const LastUpdateWrapper = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: block;
  }
`;

function Toolbar() {
  const { lastUpdate } = useSelector(({ lastUpdate }) => ({ lastUpdate }));
  const lastUpdateMinutes = Math.floor((Date.now() - lastUpdate) / (1000 * 60));
  const lastUpdateMessage =
    lastUpdateMinutes <= 1 ? 'Just now' : `${lastUpdateMinutes} minutes ago`;
  return (
    <Wrapper>
      <Sorting />
      <Filters />
      <ModeSwitcher />
      <LastUpdateWrapper>
        <h6>Last updated: {lastUpdateMessage}</h6>
      </LastUpdateWrapper>
    </Wrapper>
  );
}

export default Toolbar;
