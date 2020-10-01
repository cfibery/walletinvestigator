import styled from 'styled-components';

const Button = styled.button`
  padding: 10px;
  border: 0;
  outline: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: ${({ active }) => (active ? '#ff9800' : 'black')};
  &:hover,
  &:focus {
    color: #ff9800;
  }
  &[disabled] {
    color: grey;
    cursor: not-allowed;
  }
`;

export default Button;
