import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { sortingKeys } from '../Toolbar/Sorting';
import HoldingInfo from './HoldingInfo';
import Modal from '../Modal';

const LinksWrapper = styled.div`
  margin-top: 5px;
`;

const Link = styled.a`
  display: block;
  text-decoration: none;
  padding: 10px 0;
  color: #607d8b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:first-child {
    border-bottom: 1px solid #ddd;
  }
  &:hover {
    color: #2196f3;
  }
`;

function InfoModal({ open, onClose, data }) {
  const { sorting } = useSelector(({ sorting }) => ({ sorting }));
  const sortedWallets = data.wallets.sort(
    (a, b) => b[sortingKeys[sorting]] - a[sortingKeys[sorting]]
  );
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
        {sortedWallets.map((wallet, i) => (
          <Link
            href={`https://etherscan.io/tokenholdings?a=${wallet}`}
            target="_blank"
            key={`wallet-${wallet}`}
          >
            Wallet {i + 1} <FontAwesomeIcon icon={faExternalLinkAlt} />
          </Link>
        ))}
      </LinksWrapper>
    </Modal>
  );
}

export default InfoModal;
