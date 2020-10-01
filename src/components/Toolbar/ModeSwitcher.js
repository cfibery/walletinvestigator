import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { faSearchDollar, faRunning } from '@fortawesome/free-solid-svg-icons';
import Switch from '../Switch';

const Wrapper = styled.div`
  display: grid;
  align-items: flex-start;
  & > h4 {
    margin: 0;
  }
`;

const StyledSwitch = styled(Switch)`
  .fa-search-dollar {
    transform: translate(40%, 5%);
  }
  .fa-running {
    transform: translate(60%, 5%);
  }
`;

function ModeSwitcher() {
  const { mode } = useSelector(({ mode }) => ({ mode }));
  const dispatch = useDispatch();
  const handleChange = () => {
    dispatch({
      type: 'SET_MODE',
      payload: mode === 'follow' ? 'inquire' : 'follow',
    });
  };
  return (
    <Wrapper>
      <h4>Mode</h4>
      <StyledSwitch
        checked={mode === 'inquire'}
        onChange={handleChange}
        uncheckedIcon={faRunning}
        checkedIcon={faSearchDollar}
      />
    </Wrapper>
  );
}

export default ModeSwitcher;
