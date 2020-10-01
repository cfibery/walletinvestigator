import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import Input from './Input';
import Button from './Button';

const Wrapper = styled.div``;

const InputWrapper = styled.div`
  margin-bottom: 10px;
  h4 {
    margin: 0;
  }
`;

const Form = styled.form`
  input {
    margin-bottom: 10px;
  }
  button {
    width: 100%;
  }
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 10px;
  align-items: center;
`;

const AddressWrapper = styled.div`
  a {
    text-decoration: none;
    font-size: 0.8rem;
    color: #607d8b;
    &:hover {
      color: #ff9800;
    }
  }
`;

const StyledInput = styled(Input)`
  color: black;
`;

async function request(url) {
  const response = await fetch(url);
  return await response.json();
}

function getRandomName() {
  return `Random List ${Math.floor(Math.random() * 1000000)}`;
}

function IgnoreList() {
  const { ignoreList } = useSelector(({ ignoreList }) => ({ ignoreList }));
  const [listName, setListName] = useState(ignoreList.name || getRandomName());
  const [addressInput, setAddressInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const dispatch = useDispatch();

  const setIgnoreList = async (url) => {
    const { success, payload } = await request(url);
    if (!success) return false;
    dispatch({ type: 'SET_IGNORE_LIST', payload });
    return true;
  };

  const handleLoadIgnoreList = () => {
    if (!listName) return;
    setIgnoreList(`/load-ignore-list?listName=${listName}`);
  };
  const handleAddIgnoreAddress = (e) => {
    e.preventDefault();
    if (!listName || !addressInput || !labelInput) return;
    setIgnoreList(
      `/add-ignore-address?listName=${listName}&label=${labelInput}&address=${addressInput}`
    );
    setLabelInput('');
    setAddressInput('');
  };
  const handleRemoveIgnoreAddress = (address) => {
    if (!listName || !address) return;
    setIgnoreList(
      `/remove-ignore-address?listName=${listName}&address=${address}`
    );
  };

  return (
    <Wrapper>
      <InputWrapper>
        <h4>List name</h4>
        <GridRow>
          <StyledInput value={listName} onChange={setListName} />
          <Button onClick={handleLoadIgnoreList}>Load</Button>
        </GridRow>
      </InputWrapper>
      <InputWrapper>
        <h4>Address to ignore</h4>
        <Form onSubmit={handleAddIgnoreAddress}>
          <StyledInput
            value={labelInput}
            onChange={setLabelInput}
            placeholder={`Label (e.g. "Burn address")"`}
            required
          />
          <StyledInput
            value={addressInput}
            onChange={setAddressInput}
            placeholder={`Address (e.g. "0x0000000000000000000000000000000000000000")"`}
            required
          />
          <Button disabled={!ignoreList.name}>
            {ignoreList.name ? 'Add' : 'Load first'}
          </Button>
        </Form>
      </InputWrapper>
      {ignoreList.addresses?.length === 0 && <div>List is empty</div>}
      {ignoreList.addresses?.map(({ label, address }) => (
        <GridRow key={`ignored-${label}-${address}`}>
          <AddressWrapper>
            <div>{label}</div>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://etherscan.io/address/${address}`}
            >
              {address}
            </a>
          </AddressWrapper>
          <Button onClick={() => handleRemoveIgnoreAddress(address)}>X</Button>
        </GridRow>
      ))}
    </Wrapper>
  );
}

export default IgnoreList;
