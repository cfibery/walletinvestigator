import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import LoadingSvg from './LoadingSvg';

const Wrapper = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  & > img {
    width: 200px;
  }
`;

const WaitMessage = styled.div`
  font-size: 0.8rem;
`;

function getWaitEmoji(waitTime) {
  if (waitTime < 6) return '😞';
  if (waitTime < 12) return '😩';
  if (waitTime < 24) return '😵';
  return '💀';
}

function Loading() {
  const { queuePosition } = useSelector(({ queuePosition }) => ({
    queuePosition,
  }));
  const estimatedWait = (queuePosition + 1) * 2.5;
  return (
    <Wrapper>
      <div>
        <LoadingSvg />
        {queuePosition > 0 && (
          <>
            <div>Position in queue: {queuePosition}</div>
            <WaitMessage>Estimated wait time:</WaitMessage>
            <WaitMessage>
              {estimatedWait.toFixed(1)} minutes {getWaitEmoji(estimatedWait)}
            </WaitMessage>
          </>
        )}
      </div>
    </Wrapper>
  );
}

export default Loading;
