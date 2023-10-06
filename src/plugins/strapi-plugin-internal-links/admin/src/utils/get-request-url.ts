import pluginId from '../plugin-id';

const getRequestUrl = (path: string) => {
	if (path.startsWith('/')) {
		return `/${pluginId}${path}`;
	}

	return `/${pluginId}/${path}`;
};

export default getRequestUrl;
