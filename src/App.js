import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components';
import {
  Search,
  Chart,
  Loading,
  ThemeButton,
  VisitorsCounter,
} from './components';
import './App.css';

const Wrapper = styled.div`
  padding: 10px;
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  display: grid;
  grid-template-rows: auto 1fr auto;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.8rem;
`;

const DiscordLink = styled.a`
  color: #7288db;
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.color};
  }
`;

function App() {
  const { data, loading, theme } = useSelector(
    ({ data, loading, theme }) => ({
      data,
      loading,
      theme,
    }),
    shallowEqual
  );
  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <Search />
        {loading ? (
          <Loading />
        ) : (
          (Object.keys(data).length > 0 && <Chart data={data} />) || <div />
        )}
        <Footer>
          <VisitorsCounter />
          <DiscordLink href="https://discord.gg/pHcSxs3" target="_blank">
            Discord
          </DiscordLink>
          <ThemeButton />
        </Footer>
      </Wrapper>
    </ThemeProvider>
  );
}

export default App;
