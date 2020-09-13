import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { sortingKeys } from '../Toolbar/Sorting';
import HoldingInfo, { formatNumber } from './HoldingInfo';
import Modal from '../Modal';

const LinksWrapper = styled.div`
  margin-top: 5px;
`;

const Link = styled.a`
  display: block;
  text-decoration: none;
  padding: 10px 0;
  padding-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: black;
  &:first-child {
    border-bottom: 1px solid #ddd;
  }
  &:hover {
    color: #2196f3;
  }
`;

const Details = styled.span`
  color: #607d8b;
  font-size: 0.8rem;
`;

function printDetails(sorting, info) {
  switch (sorting) {
    case '$':
    case 'wallets':
    case 'aggregate':
    default:
      return `$${formatNumber(info.value)}`;
    case '%':
      return `${info.ownershipPercentage.toFixed(2)}%`;
    case '24h':
    case '7d':
      return `${info[`balanceChange${sorting}`].toFixed(2)}%`;
  }
}

function InfoModal({ open, onClose, data }) {
  const { sorting } = useSelector(({ sorting }) => ({ sorting }));
  const sortedWallets = data.wallets.sort((a, b) => {
    if (sorting === '24h' || sorting === '7d') {
      return b[`balanceChange${sorting}`] - a[`balanceChange${sorting}`];
    }
    let key = sortingKeys[sorting];
    if (sorting === 'wallets' || sorting === 'aggregate') key = 'value';
    return b[key] - a[key];
  });
  return (
    <Modal open={open} onClose={() => onClose(data.address)}>
      <HoldingInfo {...data} />
      <LinksWrapper>
        <Link
          href={`https://etherscan.io/token/${data.address}`}
          target="_blank"
        >
          Token tracker <FontAwesomeIcon icon={faExternalLinkAlt} />
        </Link>
        {sortedWallets.map(({ address, ...rest }, i) => (
          <React.Fragment key={`wallet-${address}`}>
            <Link
              href={`https://etherscan.io/tokenholdings?a=${address}`}
              target="_blank"
            >
              Wallet {i + 1} <FontAwesomeIcon icon={faExternalLinkAlt} />
            </Link>
            <Details>{printDetails(sorting, rest)}</Details>
          </React.Fragment>
        ))}
      </LinksWrapper>
    </Modal>
  );
}

export default InfoModal;
