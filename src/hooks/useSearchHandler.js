import { batch, useSelector, useDispatch } from 'react-redux';

async function fetchData({ name, symbol, address }, dispatch) {
  const response = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, symbol, address }),
  });
  const { payload, queuePosition, timestamp, success } = await response.json();
  if (!success) {
    dispatch({ type: 'SET_LOADING', payload: false });
    alert('An error occured, probably due to API limits. Please try again.');
    return;
  }
  if (payload === 'loading') {
    dispatch({ type: 'SET_QUEUE_POSITION', payload: queuePosition });
    return setTimeout(
      () => fetchData({ name, symbol, address }, dispatch),
      10000
    );
  }

  batch(() => {
    dispatch({ type: 'ADD_SELECTED', payload: { name, symbol, address } });
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_QUEUE_POSITION', payload: 0 });
    dispatch({ type: 'SET_DATA', payload: { address, data: payload } });
    dispatch({ type: 'SET_LAST_UPDATE', payload: timestamp });
  });
}

export default function useSearchHandler() {
  const { selected } = useSelector(({ selected }) => ({ selected }));
  const dispatch = useDispatch();
  return async ({ name, symbol, address }) => {
    address = address.toLowerCase();
    dispatch({ type: 'SET_QUERY', payload: '' });

    if (selected.find((token) => token.address === address)) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    fetchData({ name, symbol, address }, dispatch);
  };
}
