import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Switch from 'react-switch';

const StyledSwitch = styled(Switch)`
  .svg-inline--fa {
    color: #fff;
  }
`;

function CustomSwitch({
  checked,
  onChange,
  checkedIcon,
  uncheckedIcon,
  className,
}) {
  return (
    <StyledSwitch
      checked={checked}
      onChange={onChange}
      offColor="#ff9800"
      onColor="#8883d9"
      offHandleColor="#fff"
      onHandleColor="#fff"
      height={25}
      width={50}
      uncheckedIcon={<FontAwesomeIcon icon={uncheckedIcon} />}
      checkedIcon={<FontAwesomeIcon icon={checkedIcon} />}
      className={className}
    />
  );
}

export default CustomSwitch;
