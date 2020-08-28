import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
`;

const ExternalLink = styled.a`
  color: #2196f3;
  padding: 10px;
  &:hover {
    color: #ff9800;
  }
`;

const Option = styled.button`
  display: block;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  position: relative;
  transition: color 0.2s ease-in-out;
  color: ${({ theme }) => theme.color};

  &:hover {
    color: #fff;
    &::after {
      transform: scaleX(2);
      opacity: 1;
    }
  }
  &:focus {
    outline: none;
  }
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #0e84f1, transparent, transparent);
    z-index: -1;
    transform-origin: left;
    transform: scaleX(0);
    opacity: 0;
    transition: all 0.4s ease-out;
  }
`;

const Name = styled.span`
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  & > img {
    margin-right: 10px;
    background: #fff;
    box-shadow: 0 0 6px 0px #fff;
    border-radius: 50%;
  }
  & > span {
    font-weight: bold;
  }
`;

export default function SearchOption({
  img,
  name,
  ticker,
  address,
  handleClick,
}) {
  return (
    <Wrapper>
      <Option onClick={() => handleClick({ ticker, address, name })}>
        <Name>
          {img && (
            <img
              src={`http://etherscan.io/token/images/${img}`}
              alt="token logo"
            />
          )}
          <span>{name}</span>
        </Name>
        <span>{address}</span>
      </Option>
      <ExternalLink
        href={`https://etherscan.io/token/${address}`}
        target="_blank"
      >
        <FontAwesomeIcon icon={faExternalLinkAlt} />
      </ExternalLink>
    </Wrapper>
  );
}
