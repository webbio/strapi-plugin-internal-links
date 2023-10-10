import get from 'lodash/get';
import trim from 'lodash/trim';

const getDomain = async (uid: string, entity?: Record<string, any>) => {
	const pluginConfig = strapi.service('plugin::internal-links.config').getGlobalConfig();

	if (pluginConfig?.pageBuilder?.enabled && entity?.link?.targetContentTypeId) {
		const targetPage: any = await strapi.entityService.findOne(
			entity?.link?.targetContentTypeUid,
			entity?.link?.targetContentTypeId,
			{
				populate: {
					platform: true
				}
			} as Record<string, any>
		);

		return targetPage?.platform?.domain;
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

const constructURL = async (uid: string, entity: Record<string, any>) => {
	const domain = await getDomain(uid, entity);
	console.log('constructURL', domain);
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
