import { useState, useEffect } from 'react';

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
    async function fetchResults() {
      if (!query) return null;

      if (query.startsWith('0x') && query.length === 42) {
        const response = await fetch(`/search-contract?address=${query}`);
        const { payload, success } = await response.json();
        if (!success) return alert(payload);
        return setPayload(payload);
      } else if (!data) {
        const response = await fetch(`/search?term=${query}`);
        const { payload } = await response.json();
        setData(payload);
        return setPayload(getResults(payload, query));
      }
      setPayload(getResults(data, query));
    }
    fetchResults();
  }, [query, data]);

  return payload;
}
