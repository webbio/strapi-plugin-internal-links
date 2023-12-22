import { useRef, useEffect } from 'react';

// Hook
export const usePrevious = <T>(value: T): T | null => {
	const ref: React.MutableRefObject<T | null> = useRef(null);

	useEffect(() => {
		ref.current = value;
	}, [value]);

	return ref.current;
};
