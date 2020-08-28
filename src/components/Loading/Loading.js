import React from 'react';
import styled from 'styled-components';
import LoadingSvg from './LoadingSvg';

const Wrapper = styled.div`
  text-align: center;
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
