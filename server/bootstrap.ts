// @ts-nocheck
import { Strapi } from '@strapi/strapi';
import { update, groupBy, get, merge } from 'lodash';
import { sanitize } from '@strapi/utils';
import cheerio from 'cheerio';

const sanitizeEntity = async (entity: any, uid: string) => {
	return sanitize.contentAPI.output(entity, strapi.getModel(uid));
};

const getDeepPopulate = (uid: string, populate?: any, depth = 0) => {
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

const getPopulatedEntity = async (uid, id) => {
	const populate = getDeepPopulate(uid);

	return strapi.entityService.findOne(uid, id, {
		populate
	});
};

const getCustomFields = (
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

const serializeLink = (value) => {
	const stringified = JSON.stringify(value);
	const base64 = Buffer.from(stringified).toString('base64');
	return base64;
};

const deserializeLink = (value) => {
	const stringified = Buffer.from(value, 'base64').toString();
	const parsed = JSON.parse(stringified);
	return parsed;
};

const getInternalLinksFromHtml = (html) => {
	if (!html) {
		return [];
	}
	const wysiwygFieldValue = html;
	const $ = cheerio.load(wysiwygFieldValue, null, false);

	// Get all links that have the data-internal-link attribute
	const serializedLinks = $('[data-internal-link]')
		.map((_idx, element) => {
			return $(element).data('internal-link');
		})
		.toArray();

	// Deserialize links
	const internalLinks = serializedLinks.map((link) => deserializeLink(link));

	// Filter external links
	const filteredLinks = internalLinks.filter((link) => link.type === 'internal');
	return filteredLinks;
};

const updateInternalLinksInHtml = (html, internalLinks) => {
	const wysiwygFieldValue = html;
	const $ = cheerio.load(wysiwygFieldValue, null, false);

	$('[data-internal-link]')?.each((_idx, element): any => {
		let internalLinkIdx = 0;
		const currentElement = $(element);
		const currentInternalLinkData = currentElement.data('internal-link');
		const deserializedInternalLinkData = deserializeLink(currentInternalLinkData);

		if (deserializedInternalLinkData.type === 'external') {
			return currentElement;
		}

		const currentInternalLink = internalLinks[internalLinkIdx];
		const updatedSerializedLink = serializeLink(currentInternalLink);
		const updatedLink = $(element)
			.attr('data-internal-link', updatedSerializedLink)
			.attr('href', currentInternalLink.url);

		internalLinkIdx = internalLinkIdx + 1;

		return updatedLink;
	});

	return $.html();
};

const mapInternalLinks = (sourceContentTypeUid, sourceContentTypeId, internalLinks) => {
	return internalLinks.map((internalLink) => ({
		id: null,
		sourceContentTypeUid,
		sourceContentTypeId,
		sourceFieldName: internalLink?.sourceFieldName ?? null,
		targetContentTypeUid: internalLink?.targetContentTypeUid ?? null,
		targetContentTypeId: internalLink?.targetContentTypeId ?? null,
		url: internalLink?.url ?? null,
		text: internalLink?.text ?? null,
		type: internalLink?.type ?? null
	}));
};

const findManyInternalLinksByTarget = async (targetContentTypeUid, targetContentTypeId, wysiwyg) => {
	const internalLinkContentType = wysiwyg
		? 'plugin::internal-links.internal-link-wysiwyg'
		: 'plugin::internal-links.internal-link';
	return strapi.db.query(internalLinkContentType).findMany({
		where: {
			$and: [
				{
					targetContentTypeUid: {
						$eq: targetContentTypeUid
					}
				},
				{
					targetContentTypeId: {
						$eq: targetContentTypeId
					}
				}
			]
		}
	});
};

const findManyInternalLinksBySource = async (sourceContentTypeUid, sourceContentTypeId, wysiwyg) => {
	const internalLinkContentType = wysiwyg
		? 'plugin::internal-links.internal-link-wysiwyg'
		: 'plugin::internal-links.internal-link';
	return strapi.db.query(internalLinkContentType).findMany({
		where: {
			$and: [
				{
					sourceContentTypeUid: {
						$eq: sourceContentTypeUid
					}
				},
				{
					sourceContentTypeId: {
						$eq: sourceContentTypeId
					}
				}
			]
		}
	});
};

const deleteManyInternalLinksBySource = async (sourceContentTypeUid, sourceContentTypeId, wysiwyg) => {
	const internalLinkContentType = wysiwyg
		? 'plugin::internal-links.internal-link-wysiwyg'
		: 'plugin::internal-links.internal-link';

	await strapi.db.query(internalLinkContentType).deleteMany({
		where: {
			$and: [
				{
					sourceContentTypeUid: {
						$eq: sourceContentTypeUid
					}
				},
				{
					sourceContentTypeId: {
						$eq: sourceContentTypeId
					}
				}
			]
		}
	});
};

const createManyInternalLinks = async (sourceContentTypeUid, sourceContentTypeId, internalLinks, wysiwyg) => {
	if (internalLinks.length === 0) {
		return [];
	}

	const internalLinkContentType = wysiwyg
		? 'plugin::internal-links.internal-link-wysiwyg'
		: 'plugin::internal-links.internal-link';
	await strapi.db.query(internalLinkContentType).createMany({
		data: internalLinks
	});
	return findManyInternalLinksBySource(sourceContentTypeUid, sourceContentTypeId, wysiwyg);
};

const mapInternalLinksWysiwygToEntity = (sanitizedEntity, internalLinks) => {
	const insertedInternalLinksGroupedByFieldName = groupBy(internalLinks, (iteratee) => iteratee.sourceFieldName);

	const updatedEntity = Object.entries(insertedInternalLinksGroupedByFieldName)?.reduce(
		(previous, [fieldName, internalLinks]) => {
			const originalHtml = get(previous, fieldName);
			const updatedHtml = updateInternalLinksInHtml(originalHtml, internalLinks);
			return update(previous, fieldName, () => updatedHtml);
		},
		sanitizedEntity
	);

	return updatedEntity;
};

const mapInternalLinksToEntity = (sanitizedEntity, internalLinks) => {
	return internalLinks.reduce((previous, current) => {
		return update(previous, current.sourceFieldName, () => current);
	}, sanitizedEntity);
};

const getInternalLinksFromWysiwygFields = async (sanitizedEntity, uid, id) => {
	// Get all wysiwyg fields
	const wysiwygFields = getCustomFields(sanitizedEntity, uid, 'plugin::internal-links.CKEditor');

	// Get all internal links from wysiwyg fields
	const internalLinks = wysiwygFields.flatMap((field) => getInternalLinksFromHtml(field.value));

	if (internalLinks.length === 0) {
		return [];
	}

	// Sanitize
	const mappedInternalLinks = mapInternalLinks(uid, id, internalLinks);
	return mappedInternalLinks;
};

const getInternalLinksFromCustomFields = async (sanitizedEntity, uid, id) => {
	// Get all internal lkink custom fields
	const internalLinkFields = getCustomFields(sanitizedEntity, uid, 'plugin::internal-links.internal-link');

	const internalLinks = internalLinkFields
		.filter((field) => field?.value?.type === 'internal')
		.map((field) => field.value);

	// Return an empty array if no fields have been found
	if (internalLinks.length === 0) {
		return [];
	}

	// Insert internal links
	const mappedInternalLinks = mapInternalLinks(uid, id, internalLinks);

	return mappedInternalLinks;
};

const updateManyInternalLinksByTarget = async (targetContentTypeUid, targetContentTypeId, sanitizedEntity, wysiwyg) => {
	const internalLinkContentType = wysiwyg
		? 'plugin::internal-links.internal-link-wysiwyg'
		: 'plugin::internal-links.internal-link';
	const updatedUrl = strapi.service('plugin::internal-links.url').constructURL(targetContentTypeUid, sanitizedEntity);
	await strapi.db.query(internalLinkContentType).updateMany({
		where: {
			$and: [
				{
					targetContentTypeUid: {
						$eq: targetContentTypeUid
					}
				},
				{
					targetContentTypeId: {
						$eq: targetContentTypeId
					}
				}
			]
		},
		data: {
			url: updatedUrl
		}
	});
};

const updateSourceEntities = async (uid, id, sanitizedEntity) => {
	// Update internal links for wysiwyg internal links
	const internalLinksFromWysiwyg = await getInternalLinksFromWysiwygFields(sanitizedEntity, uid, id);

	// Delete links
	await deleteManyInternalLinksBySource(uid, id, true);
	// Insert links
	const createdInternalLinksFromWysiwyg = await createManyInternalLinks(uid, id, internalLinksFromWysiwyg, true);
	// Update entity
	const updatedEntityWysiwyg = mapInternalLinksWysiwygToEntity(sanitizedEntity, createdInternalLinksFromWysiwyg);

	// Update internal links for normal internal links
	const internalLinksFromNormal = await getInternalLinksFromCustomFields(sanitizedEntity, uid, id);

	// Delete links
	await deleteManyInternalLinksBySource(uid, id, false);
	// Insert links
	const createdInternalLinksFromNormal = await createManyInternalLinks(uid, id, internalLinksFromNormal, false);

	// Update entity
	const updatedEntityNormal = mapInternalLinksToEntity(sanitizedEntity, createdInternalLinksFromNormal);

	const updatedEntity = merge(updatedEntityWysiwyg, updatedEntityNormal);

	try {
		await strapi.entityService.update(uid, id, {
			data: {
				...updatedEntity,
                disableLifecycleHooks: true,
			}
		});
	} catch (error) {
		console.error(error);
	}
};

const updateInternalLinksFromTargetContentType = async (targetContentTypeUid, targetContentTypeId, sanitizedEntity) => {
	// Update links with new URL
	await updateManyInternalLinksByTarget(targetContentTypeUid, targetContentTypeId, sanitizedEntity, true);
	await updateManyInternalLinksByTarget(targetContentTypeUid, targetContentTypeId, sanitizedEntity, false);

	// Get source entitites by target
	const internalLinksWysiwyg = await findManyInternalLinksByTarget(targetContentTypeUid, targetContentTypeId, true);
	const internalLinksCustom = await findManyInternalLinksByTarget(targetContentTypeUid, targetContentTypeId, false);

	// Update Source pages
	const internalLinksWysiwygGroupedBySource = groupBy(
		internalLinksWysiwyg,
		(iteratee) => `${iteratee.sourceContentTypeUid}-${iteratee.sourceContentTypeId}`
	);
	const internalLinksCustomGroupedBySource = groupBy(
		internalLinksCustom,
		(iteratee) => `${iteratee.sourceContentTypeUid}-${iteratee.sourceContentTypeId}`
	);

	// Update Wysiwyg fields
	await Promise.all(
		Object.entries(internalLinksWysiwygGroupedBySource).map(
			// eslint-disable-next-line no-unused-vars
			async ([_key, internalLinks]) => {
				const uid = internalLinks[0]?.sourceContentTypeUid;
				const id = internalLinks[0]?.sourceContentTypeId;
				const entity = await getPopulatedEntity(uid, id);
				const sanitizedEntity = await sanitizeEntity(entity, uid);
				const updatedEntity = mapInternalLinksWysiwygToEntity(sanitizedEntity, internalLinks);
				await strapi.entityService.update(uid, id, {
					data: {
						...updatedEntity,
                        disableLifecycleHooks: true,
					}
				});
			}
		)
	);
	// Update normal custom fields links
	await Promise.all(
		Object.entries(internalLinksCustomGroupedBySource).map(
			// eslint-disable-next-line no-unused-vars
			async ([_key, internalLinks]) => {
				const uid = internalLinks[0]?.sourceContentTypeUid;
				const id = internalLinks[0]?.sourceContentTypeId;
				const entity = await getPopulatedEntity(uid, id);
				const sanitizedEntity = await sanitizeEntity(entity, uid);
				const updatedEntity = mapInternalLinksToEntity(sanitizedEntity, internalLinks);
				await strapi.entityService.update(uid, id, {
					data: {
						...updatedEntity,
                        disableLifecycleHooks: true,
					}
				});
			}
		)
	);
};

export default async ({ strapi }: { strapi: Strapi }) => {
	const contentTypeUids = Object.values(strapi.contentTypes)
		.filter((contentType: any) => contentType?.uid?.startsWith('api::'))
		.map((contentType: any) => contentType.uid);

	// Lifecycles for all entitities
	strapi.db.lifecycles.subscribe({
		models: contentTypeUids,
		async afterCreate(event) {
			const uid = event.model.uid;
			const id = event.result.id;
			const entity = await getPopulatedEntity(uid, id);
			const sanitizedEntity = await sanitizeEntity(entity, uid);

			await updateSourceEntities(uid, id, sanitizedEntity);
		},
		async beforeUpdate(event) {
			event.state.exit = event.params.data?.lifecycleState?.exit || false;
		},
		async afterUpdate(event) {
            if (event?.state?.disableLifecycleHooks) {
				return;
			}

			const uid = event.model.uid;
			const id = event.result.id;
			const entity = await getPopulatedEntity(uid, id);
			const sanitizedEntity = await sanitizeEntity(entity, uid);

			await updateSourceEntities(uid, id, sanitizedEntity);
			await updateInternalLinksFromTargetContentType(uid, id, sanitizedEntity);
		},
		async beforeDelete(event) {
			// TODO
		},
		async beforeDeleteMany(event) {
			// TODO
		},
		async afterDelete(event) {
			const uid = event.model.uid;
			const id = event.result.id;

			await deleteManyInternalLinksBySource(uid, id, true);
			await deleteManyInternalLinksBySource(uid, id, false);
		},
		async afterDeleteMany(event) {
			// TODO
		}
	});
};
