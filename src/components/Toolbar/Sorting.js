import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faPercentage,
  faWallet,
  faFlask,
  faBalanceScale,
} from '@fortawesome/free-solid-svg-icons';

const Wrapper = styled.div`
  & > h4 {
    margin: 0;
    margin-bottom: 5px;
  }
`;

const ButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 5px;
  @media (min-width: 500px) {
    display: block;
  }
`;

const FilterButton = styled.button`
  padding: 10px;
  border: 0;
  margin-right: 10px;
  outline: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: ${({ active }) => (active ? '#ff9800' : 'black')};
  &:hover,
  &:focus {
    color: #ff9800;
  }
`;

export const sortingKeys = {
  $: 'value',
  '%': 'ownershipPercentage',
  wallets: 'walletCount',
  aggregate: 'aggregate',
};

function Sorting() {
  const sorting = useSelector(({ sorting }) => sorting);
  const dispatch = useDispatch();
  return (
    <Wrapper>
      <h4>Sorting</h4>
      <ButtonsWrapper>
        <FilterButton
          title="Sort by total $ value"
          active={sorting === '$'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: '$' })}
        >
          <FontAwesomeIcon icon={faDollarSign} />
        </FilterButton>
        <FilterButton
          title="Sort by market cap % ownership"
          active={sorting === '%'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: '%' })}
        >
          <FontAwesomeIcon icon={faPercentage} />
        </FilterButton>
        <FilterButton
          title="Sort by wallet count"
          active={sorting === 'wallets'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: 'wallets' })}
        >
          <FontAwesomeIcon icon={faWallet} />
        </FilterButton>
        <FilterButton
          title="Sort by aggregated value and wallet count"
          active={sorting === 'aggregate'}
          onClick={() =>
            dispatch({ type: 'SET_SORTING', payload: 'aggregate' })
          }
        >
          <FontAwesomeIcon icon={faFlask} />
        </FilterButton>
        <FilterButton
          title="Sort by percentage holdings change"
          active={sorting === 'balanceChange'}
          onClick={() =>
            dispatch({ type: 'SET_SORTING', payload: 'balanceChange' })
          }
        >
          <FontAwesomeIcon icon={faBalanceScale} />
        </FilterButton>
      </ButtonsWrapper>
    </Wrapper>
  );
}

export default Sorting;