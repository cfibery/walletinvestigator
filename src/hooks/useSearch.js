import { useState, useEffect } from 'react';

async function searchCoinGecko(address) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
    );
    const data = await response.json();
    return [
      {
        img: data.image.small,
        name: data.name,
        symbol: data.symbol,
        address,
      },
    ];
  } catch (err) {
    console.log(`${address} not found on CoinGecko`);
    return null;
  }
}

async function searchEthplorer(address) {
  try {
    const response = await fetch(
      `https://api.ethplorer.io/getTokenInfo/${address}?apiKey=freekey`
    );
    const data = await response.json();
    return [
      {
        img: 'http://etherscan.io/images/main/empty-token.png',
        name: data.name,
        symbol: data.symbol,
        address,
      },
    ];
  } catch (err) {
    console.log(`${address} not found on Ethplorer`);
    return null;
  }
}

function getResults(data, query) {
  return data
    .filter(
      (token) =>
        token.name.toLowerCase().startsWith(query.toLowerCase()) ||
        token.symbol.toLowerCase().startsWith(query.toLowerCase())
    )
    .slice(0, 20);
}

export default function useSearch(query) {
  const [payload, setPayload] = useState(null);
  const [data, setData] = useState(null);
  useEffect(() => {
    async function fetchTokens() {
      const response = await fetch('/load-tokens');
      const { payload } = await response.json();
      setData(payload);
    }
    fetchTokens();
  }, []);
  useEffect(() => {
    async function search() {
      if (!query) return null;

      if (query.startsWith('0x') && query.length === 42) {
        let payload = await searchCoinGecko(query);
        if (!payload) payload = await searchEthplorer(query);
        if (!payload) return alert('Contract not found');
        return setPayload(payload);
      }
      setPayload(getResults(data, query));
    }
    search();
  }, [query, data]);

  return payload;
}
