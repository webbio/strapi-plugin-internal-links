import isEmpty from 'lodash';

const getGlobalConfig = () => {
	const config = strapi.config?.get('plugin.internal-link');
	return isEmpty(config) ? null : config;
};

const getContentTypeConfig = (uid) => {
	const config = strapi.contentType(uid).pluginOptions?.['internal-links'];
	return isEmpty(config) ? null : config;
};

export default {
	getGlobalConfig,
	getContentTypeConfig
};
