import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { useDebounce } from '../../hooks';

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

function SearchInput() {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 100);
  const { query, loading } = useSelector(
    ({ query, loading }) => ({ query, loading }),
    shallowEqual
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'SET_QUERY', payload: debouncedValue });
  }, [dispatch, debouncedValue]);
  useEffect(() => {
    if (!query) setValue('');
  }, [query, setValue]);
  return (
    <Input
      onChange={(e) => setValue(e.target.value)}
      value={value}
      disabled={loading}
    />
  );
}

export default SearchInput;
