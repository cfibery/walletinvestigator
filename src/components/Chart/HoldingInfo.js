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

function formatNumber(value) {
  if (value % 1 !== 0) return value.toFixed(2);
  return new Intl.NumberFormat(navigator.language).format(value);
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
          {formatNumber(data.holdings)}
        </>
      );
    case '%':
      return (
        <>
          <Additional>Ownership: </Additional>%
          {formatNumber(data.ownershipPercentage)}
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
          <Additional>Mixed: </Additional>
          {data.aggregate.toFixed(2)}
        </>
      );
  }
}

function HoldingInfo({ ticker, address, marketCap, value, ...rest }) {
  const sorting = useSelector(({ sorting }) => sorting);
  return (
    <Wrapper>
      <h3>{ticker}</h3>
      <Address>{address}</Address>
      <p>Market cap: ${formatNumber(marketCap)}</p>
      <p>{renderAdditionalInfo(sorting, rest)}</p>
      <p>
        <Value>Value: </Value>${formatNumber(value)}
      </p>
    </Wrapper>
  );
}

export default HoldingInfo;
