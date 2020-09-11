import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: grid;
  & > h4 {
    margin: 0;
  }
`;

const Select = styled.select`
  width: 100px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

function Filters() {
  const { filter } = useSelector(({ filter }) => ({ filter }));
  const dispatch = useDispatch();
  return (
    <Wrapper>
      <h4>Filtering</h4>
      <Select
        value={filter}
        onChange={(e) =>
          dispatch({ type: 'SET_FILTER', payload: e.target.value })
        }
      >
        <option value="all">All</option>
        <option value="500">&lt; $500M</option>
        <option value="250">&lt; $250M</option>
        <option value="100">&lt; $100M</option>
        <option value="50">&lt; $50M</option>
        <option value="25">&lt; $25M</option>
        <option value="10">&lt; $10M</option>
        <option value="5">&lt; $5M</option>
      </Select>
    </Wrapper>
  );
}

export default Filters;
