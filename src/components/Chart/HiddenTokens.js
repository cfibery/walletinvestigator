import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faBroom } from '@fortawesome/free-solid-svg-icons';
import InfoModal from './InfoModal';
import { useModal } from '../../hooks';

const HeadingWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: -5px;
  & > h4 {
    margin: 0;
    margin-right: 5px;
  }
  & > button {
    border: 0;
    background: 0;
    cursor: pointer;
    color: ${({ theme }) => theme.color};
    outline: none;
    &:hover,
    &:focus {
      color: #ff9800;
    }
  }
`;

const ButtonWrapper = styled.div`
  display: inline-flex;
  margin-top: 10px;
  margin-right: 10px;
  box-shadow: 0px 1px 3px 0px ${({ theme }) => theme.boxShadow};
  border-radius: 4px;
`;

const HiddenButton = styled.button`
  padding: 6px 12px;
  border: 0;
  background: #fff;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  cursor: pointer;
  &:hover,
  &:focus {
    color: #ff9800;
  }
  &:focus {
    outline: none;
  }
`;

const ModalButton = styled.button`
  display: flex;
  align-items: center;
  color: #fff;
  background: #607d8b;
  padding: 0 10px;
  border: 0;
  cursor: pointer;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  &:hover,
  &:focus {
    color: #ff9800;
  }
  &:focus {
    outline: none;
  }
`;

function HiddenTokens({ hiddenData, updateHiddenData, clearHiddenData }) {
  const [modalAddress, setModalAddress] = useState('');
  const { open, toggle } = useModal();

  const handleModalOpen = (address) => {
    toggle();
    setModalAddress(address);
  };
  const handleModalClose = () => {
    toggle();
    setModalAddress('');
  };
  return (
    <>
      <HeadingWrapper>
        <h4>Hidden tokens</h4>
        <button onClick={clearHiddenData}>
          <FontAwesomeIcon icon={faBroom} />
        </button>
      </HeadingWrapper>
      {Object.keys(hiddenData)
        .filter((address) => hiddenData[address].hidden)
        .map((address) => (
          <ButtonWrapper key={`hidden-${address}`}>
            <HiddenButton
              onClick={() => updateHiddenData(hiddenData[address], false)}
            >
              {hiddenData[address].symbol}
            </HiddenButton>
            <ModalButton onClick={() => handleModalOpen(address)}>
              <FontAwesomeIcon icon={faEllipsisV} />
            </ModalButton>
          </ButtonWrapper>
        ))}
      {modalAddress && (
        <InfoModal
          data={hiddenData[modalAddress]}
          open={open}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}

export default HiddenTokens;
