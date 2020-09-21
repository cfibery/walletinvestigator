import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Sorting from './Sorting';
import Filters from './Filters';
import ModeSwitcher from './ModeSwitcher';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  h6 {
    margin: 0;
  }
  h4 {
    margin: 0;
    margin-bottom: 5px;
  }
`;

const FiltersWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 20px;
`;

const ResponsiveWrapper = styled.div`
  display: ${({ type }) => (type === 'mobile' ? 'grid' : 'none')};
  @media (min-width: 768px) {
    display: ${({ type }) => (type === 'mobile' ? 'none' : 'grid')};
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
      <ResponsiveWrapper type="mobile">
        <Filters />
      </ResponsiveWrapper>
      <FiltersWrapper>
        <ResponsiveWrapper type="desktop">
          <Filters />
        </ResponsiveWrapper>
        <ModeSwitcher />
      </FiltersWrapper>
      <ResponsiveWrapper type="desktop">
        <h6>Last updated: {lastUpdateMessage}</h6>
      </ResponsiveWrapper>
    </Wrapper>
  );
}

export default Toolbar;
