import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketIOClient from 'socket.io-client';

export default function useLiveVisitors() {
  const [payload, setPayload] = useState(0);
  const dispatch = useDispatch();
  useEffect(() => {
    const socket = socketIOClient(window.location.origin);
    socket.on('visitors', (data) => setPayload(data));
  }, [dispatch]);
  return payload;
}
