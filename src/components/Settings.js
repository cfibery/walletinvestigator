import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import Switch from './Switch';
import Modal from './Modal';
import IgnoreList from './IgnoreList';
import Button from './Button';

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 10px;
`;

const IconButton = styled.button`
  background: none;
  color: #9e9e9e;
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

const StyledSwitch = styled(Switch)`
  margin: 0 auto;
  .fa-moon {
    transform: translate(45%, 5%);
  }
  .fa-sun {
    transform: translate(35%, 5%);
  }
`;

function Settings() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('default');
  const { theme } = useSelector(({ theme }) => ({ theme }));
  const dispatch = useDispatch();
  const handleUpdateTheme = () =>
    dispatch({
      type: 'SET_THEME',
      payload: theme.name === 'light' ? 'dark' : 'light',
    });

  const handleClose = () => {
    setOpen(false);
    setMode('default');
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faCog} />
      </IconButton>
      <Modal open={open} onClose={handleClose}>
        {mode === 'default' && (
          <GridRow>
            <div>Theme</div>
            <StyledSwitch
              checked={theme.name === 'dark'}
              onChange={handleUpdateTheme}
              uncheckedIcon={faSun}
              checkedIcon={faMoon}
            />
            <div>Ignore list</div>
            <Button
              onClick={() =>
                setMode(mode === 'ignoreList' ? 'default' : 'ignoreList')
              }
            >
              Open
            </Button>
          </GridRow>
        )}
        {mode === 'ignoreList' && <IgnoreList />}
      </Modal>
    </>
  );
}

export default Settings;
