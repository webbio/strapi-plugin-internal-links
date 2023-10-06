const find = async () => {
	const config = await strapi.service('plugin::internal-links.config').getGlobalConfig();

	return config;
};

export default { find };
