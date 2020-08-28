import { batch, useSelector, useDispatch } from 'react-redux';

async function fetchData({ name, address }) {
  const response = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, address }),
  });
  return await response.json();
}

export default function useSearchHandler() {
  const { selected } = useSelector(({ selected }) => ({ selected }));
  const dispatch = useDispatch();
  return async ({ name, address }) => {
    batch(() => {
      dispatch({ type: 'SET_QUERY', payload: '' });
      if (selected.find((token) => token.address === address)) return;
      dispatch({ type: 'ADD_SELECTED', payload: { name, address } });
      dispatch({ type: 'SET_LOADING', payload: true });
    });
    const { data, success, timestamp, error } = await fetchData({
      name,
      address,
    });
    if (!success) return alert(error);
    batch(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_DATA', payload: { address, data } });
      dispatch({ type: 'SET_LAST_UPDATE', payload: timestamp });
    });
  };
}
