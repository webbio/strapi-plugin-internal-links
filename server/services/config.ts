import isEmpty from 'lodash/isEmpty';

const getGlobalConfig = () => {
	const config = strapi.config?.get('plugin.internal-links');
	return isEmpty(config) ? null : config;
};
const getContentTypeConfig = (uid: string) => {
	const config = strapi.contentType(uid).pluginOptions?.['internal-links'];
	return isEmpty(config) ? null : config;
};

export default {
	getGlobalConfig,
	getContentTypeConfig
};
