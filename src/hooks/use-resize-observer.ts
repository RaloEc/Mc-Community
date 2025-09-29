import { useEffect, useState, RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

function useResizeObserver<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  defaultSize: Size = { width: 0, height: 0 }
): Size {
  const [size, setSize] = useState<Size>(defaultSize);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setSize({ width, height });
        }
      });

      resizeObserver.observe(element);

      return () => {
        resizeObserver.unobserve(element);
        resizeObserver.disconnect();
      };
    }
    return undefined;
  }, [ref]);

  return size;
}

export default useResizeObserver;
