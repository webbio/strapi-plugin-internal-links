import get from 'lodash/get';
import trim from 'lodash/trim';

const getDomain = (uid: string, entity?: Record<string, any>) => {
	const pluginConfig = strapi.service('plugin::internal-links.config').getGlobalConfig();

	if (pluginConfig?.pageBuilder?.enabled && entity?.page?.platform?.domain) {
		return entity.page.platform.domain;
	}

	const environment = pluginConfig?.environment || 'production';

	if (!pluginConfig?.domains) return '';

	const subsites = pluginConfig.domains?.subsites && Object.keys(pluginConfig.domains?.subsites);
	const subsite = subsites?.find((subsite) => uid.includes(subsite)) || null;

	if (subsite) {
		return pluginConfig.domains.subsites?.[subsite]?.[environment];
	}

	return pluginConfig.domains.default[environment];
};

const constructURL = (uid: string, entity: Record<string, any>) => {
	const domain = getDomain(uid, entity);
	const slug = getSlug(uid, entity);

	return trim(`${domain}/${slug}`, '/');
};

const getSlug = (uid: string, entity: Record<string, any>) => {
	const globalConfig = strapi.service('plugin::internal-links.config').getGlobalConfig();
	const entityConfig = strapi.service('plugin::internal-links.config').getContentTypeConfig(uid);
	const slugField = entityConfig?.slug ?? 'fullPath';
	const slug = get(entity, slugField, null);

	return trim(slug, '/') ?? globalConfig?.notFoundSlug ?? '404';
};

export default {
	getDomain,
	constructURL,
	getSlug
};
