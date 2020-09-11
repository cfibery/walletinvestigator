import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import Switch from 'react-switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearchDollar, faRunning } from '@fortawesome/free-solid-svg-icons';

const Wrapper = styled.div`
  display: grid;
  & > h4 {
    margin: 0;
  }
`;

const StyledSwitch = styled(Switch)`
  .svg-inline--fa {
    transform: translateX(50%);
  }
  .fa-question {
    color: #fff;
  }
  .fa-running {
    color: #fff;
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
        offColor="#ff9800"
        onColor="#8883d9"
        offHandleColor="#fff"
        onHandleColor="#fff"
        height={25}
        width={50}
        uncheckedIcon={<FontAwesomeIcon icon={faRunning} />}
        checkedIcon={<FontAwesomeIcon icon={faSearchDollar} />}
      />
    </Wrapper>
  );
}

export default ModeSwitcher;
