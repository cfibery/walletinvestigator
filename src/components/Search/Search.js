import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useSearch, useDebounce, useSearchHandler } from '../../hooks';
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

const Input = styled.input`
  width: 100%;
  padding: 5px 0;
  border: none;
  background: transparent;
  border-bottom: 2px solid #5dc1f8;
  font-size: 1rem;
  color: ${({ theme }) => theme.color};
  &:focus {
    border-bottom: 2px solid #0e84f1;
    outline: none;
  }
  &:focus + div {
    display: block;
  }
  &[disabled] {
    border-color: grey;
    cursor: wait;
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

  const handleResultsClick = useSearchHandler();
  const handleRemoveSelected = async (token, idx) => {
    dispatch({
      type: 'REMOVE_SELECTED',
      payload: { address: token.address, idx },
    });
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <h3>Enter token name / ticker:</h3>
        <TopSearches />
      </TitleWrapper>
      <Input
        onChange={(e) =>
          dispatch({ type: 'SET_QUERY', payload: e.target.value })
        }
        value={query}
        disabled={loading}
      />
      {query && results?.length > 0 && (
        <Results results={results} handleClick={handleResultsClick} />
      )}
      {selected.map((token, i) => (
        <SelectedButton
          key={`selected-${token.address}`}
          onClick={() => handleRemoveSelected(token, i)}
          disabled={loading}
        >
          {token.name} <FontAwesomeIcon icon={faTimesCircle} />
        </SelectedButton>
      ))}
    </Wrapper>
  );
}

export default Search;
