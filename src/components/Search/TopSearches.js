import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFireAlt,
  faArrowCircleRight,
} from '@fortawesome/free-solid-svg-icons';
import { useModal, useTopSearches, useSearchHandler } from '../../hooks';
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

const TermWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  & > span {
    text-align: right;
  }
`;

const QuickSearchButton = styled.button`
  padding: 10px 0;
  color: #607d8b;
  background: none;
  border: 0;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
  cursor: pointer;
  font-size: 1rem;
  outline: none;
  &:hover,
  &:focus {
    color: #2196f3;
  }
`;

function TopSearches() {
  const { open, toggle } = useModal();
  const topSearches = useTopSearches();
  const handleClick = useSearchHandler();
  return (
    <>
      <Button onClick={toggle}>
        <FontAwesomeIcon icon={faFireAlt} />
      </Button>
      <Modal open={open} onClose={toggle}>
        <ModalHeading>Top searches</ModalHeading>
        <TermWrapper>
          {!topSearches && (
            <SpinnerWrapper>
              <SpinnerSvg />
            </SpinnerWrapper>
          )}
          {topSearches?.length === 0 && (
            <EmptyMessage>No searches yet</EmptyMessage>
          )}
          {topSearches?.map(({ name, address, count }) => (
            <React.Fragment key={`top-search-${address}`}>
              <QuickSearchButton
                onClick={() => {
                  handleClick({ name, address });
                  toggle();
                }}
              >
                {name} <FontAwesomeIcon icon={faArrowCircleRight} />
              </QuickSearchButton>
              <span>{count}</span>
            </React.Fragment>
          ))}
        </TermWrapper>
      </Modal>
    </>
  );
}

export default TopSearches;
