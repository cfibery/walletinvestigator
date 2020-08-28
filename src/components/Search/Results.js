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

function Results({ results, handleClick }) {
  return (
    <Wrapper>
      {results
        .filter((result) => result.match(/<div/))
        .map((result) => {
          const div = document.createElement('div');
          div.innerHTML = result;
          const name = div.querySelector('div').textContent;
          const ticker = name.match(/ \((.+)\)$/)?.[1];
          const address = div.querySelector('span.text-secondary').textContent;
          const img = result.match(/([a-zA-Z0-9_]+\.png)$/);
          return (
            <SearchOption
              key={address}
              img={img ? img[1] : null}
              name={name}
              ticker={ticker}
              address={address}
              handleClick={handleClick}
            />
          );
        })}
    </Wrapper>
  );
}

export default Results;
