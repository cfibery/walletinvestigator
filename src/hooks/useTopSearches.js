import { useState, useEffect } from 'react';

export default function useTopSearches() {
  const [payload, setPayload] = useState(null);
  useEffect(() => {
    async function fetchTopSearches() {
      const response = await fetch(`/top-searches`);
      const { payload } = await response.json();
      setPayload(payload);
    }
    fetchTopSearches();
  }, []);

  return payload;
}
