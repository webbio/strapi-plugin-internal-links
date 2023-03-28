import get from 'lodash/get';

const getDomain = (uid: string) => {
	const pluginConfig = strapi.service('plugin::internal-links.config').getGlobalConfig();

	const environment = pluginConfig?.environment || 'production';

	if (!pluginConfig?.domains) return '';

	const subsites = pluginConfig.domains?.subsites && Object.keys(pluginConfig.domains?.subsites);
	const subsite = subsites?.find((subsite) => uid.includes(subsite)) || null;

	if (subsite) {
		return pluginConfig.domains.subsites?.[subsite]?.[environment];
	}

	return pluginConfig.domains.default[environment];
};

const constructURL = (uid: string, entity: any) => {
	const domain = getDomain(uid);
	const slug = getSlug(uid, entity);
	return `${domain}/${slug}`;
};

const getSlug = (uid: string, entity: any) => {
	const globalConfig = strapi.service('plugin::internal-links.config').getGlobalConfig();
	const entityConfig = strapi.service('plugin::internal-links.config').getContentTypeConfig(uid);
    const slugField = entityConfig?.slug ?? 'fullPath';
	const slug = get(entity, slugField, null);
	return slug ?? globalConfig?.notFoundSlug ?? '404';
};

export default {
	getDomain,
	constructURL,
	getSlug
};
