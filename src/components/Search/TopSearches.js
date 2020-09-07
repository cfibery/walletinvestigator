import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFireAlt,
  faArrowCircleRight,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useModal, useTopSearches, useSearchHandler } from '../../hooks';
import { formatName } from './utils';
import Modal from '../Modal';
import SpinnerSvg from './SpinnerSvg';

const Button = styled.button`
  color: #9e9e9e;
  cursor: pointer;
  border: 0;
  background: none;
  outline: none;
  font-size: 1rem;
  &:hover,
  &:focus {
    color: #ff9800;
  }
  &[disabled] {
    cursor: wait;
    color: #607d8b;
  }
`;

const ModalHeading = styled.h3`
  margin: 0;
`;

const EmptyMessage = styled.p`
  color: #607d8b;
  margin: 10px 0;
  margin-bottom: 0;
`;

const SpinnerWrapper = styled.div`
  text-align: center;
`;

const QuickSearchButton = styled.button`
  padding: 10px 0;
  padding-bottom: 0;
  background: none;
  border: 0;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  font-size: 1rem;
  outline: none;
  & > span > svg {
    color: #4caf50;
  }
  &:hover,
  &:focus {
    color: #2196f3;
  }
`;

const AddressLink = styled.a`
  text-decoration: none;
  font-size: 0.8rem;
  color: #607d8b;
  &:hover {
    color: #ff9800;
  }
`;

function TopSearches() {
  const { loading } = useSelector(({ loading }) => ({ loading }));
  const { open, toggle } = useModal();
  const topSearches = useTopSearches();
  const handleClick = useSearchHandler();
  return (
    <>
      <Button onClick={toggle} disabled={loading}>
        <FontAwesomeIcon icon={faFireAlt} />
      </Button>
      <Modal open={open} onClose={toggle}>
        <ModalHeading>Top searches</ModalHeading>
        {!topSearches && (
          <SpinnerWrapper>
            <SpinnerSvg />
          </SpinnerWrapper>
        )}
        {topSearches?.length === 0 && (
          <EmptyMessage>No searches yet</EmptyMessage>
        )}
        {topSearches?.map(({ name, symbol, address, ready }) => (
          <div key={`top-search-${address}`}>
            <QuickSearchButton
              onClick={() => {
                handleClick({ name, symbol, address });
                toggle();
              }}
            >
              <span>
                {formatName(name)} ({symbol}){' '}
                {ready && <FontAwesomeIcon icon={faCheckCircle} />}
              </span>
              <FontAwesomeIcon icon={faArrowCircleRight} />
            </QuickSearchButton>
            <AddressLink
              href={`https://etherscan.io/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {address}
            </AddressLink>
          </div>
        ))}
      </Modal>
    </>
  );
}

export default TopSearches;
