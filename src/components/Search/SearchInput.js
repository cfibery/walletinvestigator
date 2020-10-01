import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useDebounce } from '../../hooks';
import Input from '../Input';

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
  return <Input onChange={setValue} value={value} disabled={loading} />;
}

export default SearchInput;
