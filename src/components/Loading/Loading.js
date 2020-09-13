import React from 'react';
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

function Loading() {
  return (
    <Wrapper>
      <LoadingSvg />
    </Wrapper>
  );
}

export default Loading;
