import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const Wrapper = styled.div`
  h3,
  p {
    margin: 0;
  }
`;

const Address = styled.p`
  color: #607d8b;
  font-size: 0.8rem;
`;

const Additional = styled.span`
  color: #ff5722;
`;

const Value = styled.span`
  color: #2196f3;
`;

const BalanceChange = styled.span`
  color: ${({ change }) => (change >= 0 ? 'green' : 'red')};
`;

export function formatNumber(value) {
  if (value < 1) return value;
  return new Intl.NumberFormat(navigator.language).format(Math.floor(value));
}

function singularize(val, str) {
  return Number(val) === 1 ? str.slice(0, -1) : str;
}

function renderAdditionalInfo(sorting, data) {
  switch (sorting) {
    case '$':
    default:
      return (
        <>
          <Additional>Holdings: </Additional>
          {formatNumber(data.balance)}
        </>
      );
    case '%':
      return (
        <>
          <Additional>Ownership: </Additional>%
          {data.ownershipPercentage.toFixed(2)}
        </>
      );
    case 'wallets':
      const formattedValue = formatNumber(data.walletCount);
      return (
        <>
          <Additional>Wallets: </Additional>
          {formattedValue} {singularize(formattedValue, sorting)}
        </>
      );
    case 'aggregate':
      return (
        <>
          <Additional>Score: </Additional>
          {data.aggregate.toFixed(2)}
        </>
      );
    case '24h':
    case '7d':
      return (
        <>
          <Additional>Change: </Additional>
          <BalanceChange change={data.balanceChange}>
            {data.balanceChange.toFixed(2)}
          </BalanceChange>
          %
        </>
      );
  }
}

function HoldingInfo({ symbol, address, marketCap, value, ...rest }) {
  const sorting = useSelector(({ sorting }) => sorting);
  return (
    <Wrapper>
      <h3>{symbol}</h3>
      <Address>{address}</Address>
      <p>Market cap: {marketCap === 0 ? '?' : `$${formatNumber(marketCap)}`}</p>
      <p>{renderAdditionalInfo(sorting, rest)}</p>
      <p>
        <Value>Value: </Value>${formatNumber(value)}
      </p>
    </Wrapper>
  );
}

export default HoldingInfo;
