import { sanitize } from '@strapi/utils';

export const getDeepPopulate = (uid: string, populate?: any, depth = 0) => {
	if (populate) {
		return populate;
	}

	if (depth > 2) {
		return {};
	}

	const { attributes } = strapi.getModel(uid);

	return Object.keys(attributes).reduce((populateAcc, attributeName) => {
		const attribute = attributes[attributeName];

		if (attribute.type === 'relation') {
			return populateAcc;
		}

		if (attribute.type === 'component') {
			populateAcc[attributeName] = {
				populate: getDeepPopulate(attribute.component, null, depth + 1)
			};
		}

		if (attribute.type === 'media') {
			populateAcc[attributeName] = true;
		}

		if (attribute.type === 'dynamiczone') {
			populateAcc[attributeName] = {
				populate: (attribute.components || []).reduce((acc, componentUID) => {
					return Object.assign(acc, getDeepPopulate(componentUID, null, depth + 1));
				}, {})
			};
		}

		return populateAcc;
	}, {});
};

export const sanitizeEntity = async (entity: any, uid: string) => {
	return sanitize.contentAPI.output(entity, strapi.getModel(uid));
};

export const getPopulatedEntity = async (uid, id) => {
	const populate = getDeepPopulate(uid);

	return strapi.entityService.findOne(uid, id, {
		populate
	});
};

export const getCustomFields = (
	entity: any,
	uid: string,
	customFieldName: string,
	previousInternalLinks = [],
	previousKey = null
) => {
	const model = strapi.getModel(uid);
	const interalLinks = previousInternalLinks;

	if (entity == null) {
		return interalLinks;
	}

	Object?.entries(entity)?.forEach(([key, value]: any) => {
		const metadata = model?.attributes?.[key];

		const isInternalLinkField = metadata?.customField === customFieldName;

		if (isInternalLinkField) {
			const fullKey = previousKey ? `${previousKey}.${key}` : key;
			interalLinks.push({
				key: fullKey,
				value
			});
		}

		if (metadata?.type === 'component' && metadata?.repeatable === false) {
			const componentUid = metadata.component;
			getCustomFields(value, componentUid, customFieldName, interalLinks, previousKey ? `${previousKey}.${key}` : key);
		}

		if (metadata?.type === 'component' && metadata?.repeatable === true) {
			const componentUid = metadata.component;
			value.forEach((componentValue, idx) => {
				getCustomFields(
					componentValue,
					componentUid,
					customFieldName,
					interalLinks,
					previousKey ? `${previousKey}.${idx}.${key}` : `${key}.${idx}`
				);
			});
		}

		if (metadata?.type === 'dynamiczone') {
			value.forEach((dynamicZoneValue, idx) => {
				const componentUid = dynamicZoneValue.__component;
				getCustomFields(
					dynamicZoneValue,
					componentUid,
					customFieldName,
					interalLinks,
					previousKey ? `${previousKey}.${idx}.${key}` : `${key}.${idx}`
				);
			});
		}
	});

	return interalLinks;
};
