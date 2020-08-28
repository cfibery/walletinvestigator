import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import themes from '../themes';

const Button = styled.button`
  background: ${({ theme }) => themes[theme].background};
  color: ${({ theme }) => themes[theme].color};
  border: 0;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0px 0px 6px 0px
    ${({ theme }) =>
      theme === 'light'
        ? themes['dark'].background
        : themes['light'].background};
  transition: box-shadow 0.2s ease-in-out;
  &:hover,
  &:focus {
    outline: none;
    box-shadow: 0px 0px 6px 0px ${({ theme }) => themes[theme].background};
  }
`;

function ThemeButton() {
  const { theme } = useSelector(({ theme }) => ({ theme }));
  const dispatch = useDispatch();
  const handleUpdateTheme = (val) =>
    dispatch({ type: 'SET_THEME', payload: val });

  return (
    <Button
      theme={theme.name === 'light' ? 'dark' : 'light'}
      onClick={() =>
        handleUpdateTheme(theme.name === 'light' ? 'dark' : 'light')
      }
    >
      <FontAwesomeIcon icon={theme.name === 'light' ? faMoon : faSun} />
    </Button>
  );
}

export default ThemeButton;
