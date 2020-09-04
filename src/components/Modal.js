import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
`;
const Wrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  background: #fff;
  border-radius: 4px;
  padding: 10px;
  max-height: 400px;
  overflow: auto;
  width: 90%;
  max-width: 400px;
`;

function Modal({ open, onClose, children }) {
  return open
    ? ReactDOM.createPortal(
        <>
          <Overlay onClick={onClose} />
          <Wrapper>{children}</Wrapper>
        </>,
        document.getElementById('modal-root')
      )
    : null;
}

export default Modal;
