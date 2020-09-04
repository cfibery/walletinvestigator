import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useSearch, useDebounce } from '../../hooks';
import { formatName } from './utils';
import SearchInput from './SearchInput';
import TopSearches from './TopSearches';
import Results from './Results';

const Wrapper = styled.div`
  position: relative;
  margin-bottom: 10px;
`;

const TitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  & > h3 {
    margin: 0;
  }
`;

const SelectedButton = styled.button`
  background: none;
  color: ${({ theme }) => theme.color};
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  margin: 10px;
  margin-left: 0;
  margin-bottom: 0;
  &[disabled] {
    cursor: wait;
  }
`;

function Search() {
  const { query, selected, loading } = useSelector(
    ({ query, selected, loading }) => ({ query, selected, loading }),
    shallowEqual
  );
  const dispatch = useDispatch();
  const debouncedQuery = useDebounce(query, 300);
  const results = useSearch(debouncedQuery);

  const handleRemoveSelected = async (token, idx) => {
    dispatch({
      type: 'REMOVE_SELECTED',
      payload: { address: token.address, idx },
    });
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <h3>Token name, symbol, or contract address:</h3>
        <TopSearches />
      </TitleWrapper>
      <SearchInput />
      {query && results?.length > 0 && <Results results={results} />}
      {selected.map((token, i) => (
        <SelectedButton
          key={`selected-${token.address}`}
          onClick={() => handleRemoveSelected(token, i)}
          disabled={loading}
        >
          {formatName(token.name)} ({token.symbol}){' '}
          <FontAwesomeIcon icon={faTimesCircle} />
        </SelectedButton>
      ))}
    </Wrapper>
  );
}

export default Search;
