import { useState, useEffect } from 'react';

const cache = {};

export default function useSearch(query) {
  const [payload, setPayload] = useState(null);
  useEffect(() => {
    async function fetchResults() {
      if (!query) return null;
      if (cache[query]) return setPayload(cache[query]);

      const response = await fetch(`/search?term=${query}`);
      const { payload, success } = await response.json();
      if (!success) return alert(payload);
      cache[query] = payload;
      setPayload(payload);
    }
    fetchResults();
  }, [query]);

  return payload;
}
