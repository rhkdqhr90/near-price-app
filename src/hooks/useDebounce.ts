import { useState, useEffect } from 'react';

/**
 * 값이 변경된 후 delay ms 동안 업데이트가 없으면 debouncedValue를 반환한다.
 * API 과호출 방지용 (기본 300ms).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
