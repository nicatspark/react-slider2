import { useEffect, useState } from 'react';

function usePreventScroll() {
  const [scrollDisabled, setScrollDisabled] = useState(true);

  const addListener = (scrollStatus) => {
    if (typeof scrollStatus === 'undefined') return;
    if (scrollStatus)
      window.addEventListener('wheel', (e) => e.preventDefault(), {
        passive: false,
      });
    else
      window.removeEventListener('wheel', (e) => e.preventDefault(), {
        passive: false,
      });
  };

  useEffect(() => {
    addListener(scrollDisabled);
    return () => addListener(false);
  }, [scrollDisabled]);

  return [scrollDisabled, setScrollDisabled];
}

export default usePreventScroll;
