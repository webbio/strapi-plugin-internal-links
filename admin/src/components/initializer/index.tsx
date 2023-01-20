/**
 *
 * Initializer
 *
 */

import { useEffect, useRef } from 'react';

import pluginId from '../../plugin-id';

type InitializerProps = {
	setPlugin: (id: string) => void;
};

const Initializer = ({ setPlugin }: InitializerProps): null => {
	const ref = useRef(setPlugin);

	useEffect(() => {
		ref.current(pluginId);
	}, []);

	return null;
};

export default Initializer;
