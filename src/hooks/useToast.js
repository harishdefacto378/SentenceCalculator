import { useState, useCallback } from 'react';

export function useToast() {
  const [toastState, setToastState] = useState({ message: '', visible: false });

  const showToast = useCallback((msg) => {
    setToastState({ message: msg, visible: true });
    setTimeout(() => setToastState(s => ({ ...s, visible: false })), 1400);
  }, []);

  return { toastState, showToast };
}
