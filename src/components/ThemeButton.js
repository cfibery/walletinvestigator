import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const Button = styled.button`
  background: none;
  color: ${({ theme }) => theme.color};
  border: 0;
  outline: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  &:hover,
  &:focus {
    color: #ff9800;
  }
`;

function ThemeButton() {
  const { theme } = useSelector(({ theme }) => ({ theme }));
  const dispatch = useDispatch();
  const handleUpdateTheme = (val) =>
    dispatch({ type: 'SET_THEME', payload: val });

  return (
    <Button
      onClick={() =>
        handleUpdateTheme(theme.name === 'light' ? 'dark' : 'light')
      }
    >
      <FontAwesomeIcon icon={theme.name === 'light' ? faMoon : faSun} />
    </Button>
  );
}

export default ThemeButton;
