import React from 'react';
import styled from 'styled-components';
import SearchOption from './SearchOption';

const Wrapper = styled.div`
  z-index: 1;
  position: absolute;
  width: 100%;
  background: ${({ theme }) => theme.main};
  box-shadow: 0px 3px 4px 1px ${({ theme }) => theme.boxShadow};
  max-height: 300px;
  overflow: auto;
  display: none;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  &:hover {
    display: block;
  }
`;

function Results({ results }) {
  return (
    <Wrapper>
      {results.map(({ img, name, symbol, address }) => {
        return (
          <SearchOption
            key={`search-result-${address}`}
            img={img}
            name={name}
            symbol={symbol}
            address={address}
          />
        );
      })}
    </Wrapper>
  );
}

export default Results;
