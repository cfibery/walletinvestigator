import React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  width: 100%;
  padding: 5px 0;
  border: none;
  background: transparent;
  border-bottom: 2px solid #5dc1f8;
  font-size: 1rem;
  color: ${({ theme }) => theme.color};
  &:focus {
    border-bottom: 2px solid #0e84f1;
    outline: none;
  }
  &:focus + div {
    display: block;
  }
  &[disabled] {
    border-color: grey;
    cursor: wait;
  }
`;

function Input({ onChange, value, ...rest }) {
  return (
    <StyledInput
      onChange={(e) => onChange(e.target.value)}
      value={value}
      {...rest}
    />
  );
}

export default Input;
