import { batch, useSelector, useDispatch, shallowEqual } from 'react-redux';

async function fetchData({ name, address }, dispatch) {
  const response = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, address }),
  });
  const { payload, timestamp } = await response.json();
  if (payload === 'loading') {
    dispatch({
      type: 'SET_DATA',
      payload: { address, data: payload },
    });
    return setTimeout(() => fetchData({ name, address }, dispatch), 10000);
  }

  batch(() => {
    dispatch({ type: 'ADD_SELECTED', payload: { name, address } });
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_DATA', payload: { address, data: payload } });
    dispatch({ type: 'SET_LAST_UPDATE', payload: timestamp });
  });
}

export default function useSearchHandler() {
  const { selected, data } = useSelector(
    ({ selected, data }) => ({
      selected,
      data,
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  return async ({ name, address }) => {
    address = address.toLowerCase();
    dispatch({ type: 'SET_QUERY', payload: '' });

    if (selected.find((token) => token.address === address)) return;
    if (data[address] === 'loading') return;

    dispatch({ type: 'SET_LOADING', payload: true });
    fetchData({ name, address }, dispatch);
  };
}
