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

const ReloadButton = styled.button`
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.color};
  outline: none;
  &:hover,
  &:focus {
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
      <div>
        <h6>Last updated: {lastUpdateMessage}</h6>
        <ReloadButton>Force reload</ReloadButton>
      </div>
    </Wrapper>
  );
}

export default Toolbar;
