import React from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

const Wrapper = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  & > img {
    width: 200px;
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position-x: 0px;
  }
  100% {
    background-position-x: 150px;
  }
`;

const Message = styled.div`
  margin-bottom: 10px;
`;

const ProgressBar = styled.div`
  width: 150px;
  height: 12px;
  border-radius: 4px;
  background: #ddd;
  margin: 0 auto;
  position: relative;
  &::after {
    content: '';
    background: radial-gradient(circle at 50%, #8883d9 25%, #0e84f1);
    animation: ${gradientAnimation} 1.2s cubic-bezier(0.1, 0.2, 0.3, 0.1)
      infinite;
    box-shadow: 0 0 6px 0 #0e84f1;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    transform: ${({ progress }) => `scaleX(${progress})`};
    transform-origin: left;
    transition: transform ease-in-out 0.4s;
  }
`;

function Loading() {
  const { loadingProgress } = useSelector(({ loadingProgress }) => ({
    loadingProgress,
  }));
  return (
    <Wrapper>
      <div>
        <Message>{loadingProgress.message}</Message>
        <ProgressBar progress={loadingProgress.value} />
      </div>
    </Wrapper>
  );
}

export default Loading;
