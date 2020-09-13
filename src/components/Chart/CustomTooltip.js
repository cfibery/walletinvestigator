import React from 'react';
import styled from 'styled-components';
import HoldingInfo from './HoldingInfo';

const TooltipWrapper = styled.div`
  background: #fff;
  color: black;
  padding: 10px;
  border: 1px solid #e4e4e4;
`;

function CustomTooltip({ active, payload }) {
  if (active) {
    return (
      <TooltipWrapper>
        <HoldingInfo {...payload[0].payload} />
      </TooltipWrapper>
    );
  }

  return null;
}

export default CustomTooltip;
