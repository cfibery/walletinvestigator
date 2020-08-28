import { useLiveVisitors } from '../hooks';

function VisitorsCounter() {
  const visitors = useLiveVisitors();
  return `${visitors} visitor${visitors === 1 ? '' : 's'}`;
}

export default VisitorsCounter;
