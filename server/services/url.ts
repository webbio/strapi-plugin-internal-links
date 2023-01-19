const getDomain = (uid) => {
	const pluginConfig = strapi.plugin('internal-links').service('config').getGlobalConfig();

	const environment = pluginConfig.environment || 'production';

	if (!pluginConfig?.domains) return '';

	const subsites = Object.keys(pluginConfig.domains.subsites);
	const subsite = subsites.find((subsite) => uid.includes(subsite)) || null;

	if (subsite) {
		return pluginConfig.domains.subsites?.[subsite]?.[environment];
	}

	return pluginConfig.domains.default[environment];
};

const getSlug = (uid, entity) => {
	const globalConfig = strapi.service('plugin::internal-links.config').getGlobalConfig();
	const entityConfig = strapi.service('plugin::internal-links.config').getContentTypeConfig(uid);
	const slugField = entityConfig?.slug ?? null;
	const slug = entity?.[slugField] ?? null;
	return slug ?? globalConfig?.notFoundSlug ?? '404';
};

const constructURL = (uid, entity) => {
	const domain = getDomain(uid);
	const slug = getSlug(uid, entity);
	return `${domain}/${slug}`;
};

export default { getDomain, getSlug, constructURL };
