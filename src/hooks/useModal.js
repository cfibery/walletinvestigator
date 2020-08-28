import { useState } from 'react';

function useModal() {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (open) {
      document.body.classList.remove('modal-open');
      setOpen(false);
    } else {
      document.body.classList.add('modal-open');
      setOpen(true);
    }
  };

  return { open, toggle };
}

export default useModal;
