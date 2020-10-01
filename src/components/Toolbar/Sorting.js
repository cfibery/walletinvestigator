import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faPercentage,
  faWallet,
  faFlask,
  faCalendarDay,
  faCalendarWeek,
  faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';
import Button from '../Button';

const Wrapper = styled.div``;

const HeadingWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ReverseButton = styled.button`
  border: 0;
  background: 0;
  margin-bottom: 5px;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? '#ff9800' : theme.color)};
  outline: none;
  &:hover,
  &:focus {
    color: #ff9800;
  }
`;

const ButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-gap: 5px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(6, auto);
    grid-gap: 10px;
  }
`;

export const sortingKeys = {
  $: 'value',
  '%': 'ownershipPercentage',
  wallets: 'walletCount',
  aggregate: 'aggregate',
  '24h': 'balanceChange',
  '7d': 'balanceChange',
};

function Sorting() {
  const { sorting, reverse } = useSelector(
    ({ sorting, reverse }) => ({ sorting, reverse }),
    shallowEqual
  );
  const dispatch = useDispatch();
  return (
    <Wrapper>
      <HeadingWrapper>
        <h4>Sorting</h4>
        <ReverseButton
          onClick={() => dispatch({ type: 'TOGGLE_REVERSE' })}
          active={reverse}
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
        </ReverseButton>
      </HeadingWrapper>
      <ButtonsWrapper>
        <Button
          title="Sort by total $ value"
          active={sorting === '$'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: '$' })}
        >
          <FontAwesomeIcon icon={faDollarSign} />
        </Button>
        <Button
          title="Sort by market cap % ownership"
          active={sorting === '%'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: '%' })}
        >
          <FontAwesomeIcon icon={faPercentage} />
        </Button>
        <Button
          title="Sort by wallet count"
          active={sorting === 'wallets'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: 'wallets' })}
        >
          <FontAwesomeIcon icon={faWallet} />
        </Button>
        <Button
          title="Sort by aggregated value and wallet count"
          active={sorting === 'aggregate'}
          onClick={() =>
            dispatch({ type: 'SET_SORTING', payload: 'aggregate' })
          }
        >
          <FontAwesomeIcon icon={faFlask} />
        </Button>
        <Button
          title="Sort by percentage holdings change 24h"
          active={sorting === '24h'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: '24h' })}
        >
          <FontAwesomeIcon icon={faCalendarDay} />
        </Button>
        <Button
          title="Sort by percentage holdings change 7d"
          active={sorting === '7d'}
          onClick={() => dispatch({ type: 'SET_SORTING', payload: '7d' })}
        >
          <FontAwesomeIcon icon={faCalendarWeek} />
        </Button>
      </ButtonsWrapper>
    </Wrapper>
  );
}

export default Sorting;
