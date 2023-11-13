import { groupBy, update, get, merge } from 'lodash';
import { Common } from '@strapi/strapi';
import { Event } from '@strapi/database/lib/lifecycles';
import cheerio from 'cheerio';

import { deserializeLink, getCustomFields, getPopulatedEntity, sanitizeEntity, serializeLink } from '../utils/strapi';
import { InternalLink } from '../interfaces/link';
import { DEFAULT_PAGEBUILDER_COLLECTION } from '../utils/constants';

const mapInternalLinks = (
	sourceContentTypeUid: Common.UID.ContentType,
	sourceContentTypeId: string,
	internalLinks: InternalLink[]
): InternalLink[] => {
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

const findManyInternalLinksByTarget = async (
	targetContentTypeUid: Common.UID.ContentType,
	targetContentTypeId: string,
	wysiwyg: boolean
) => {
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

const findManyInternalLinksBySource = async (
	sourceContentTypeUid: string,
	sourceContentTypeId: string,
	wysiwyg: boolean
) => {
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

const deleteManyInternalLinksBySource = async (
	sourceContentTypeUid: string,
	sourceContentTypeId: string,
	wysiwyg: boolean
) => {
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

const createManyInternalLinks = async (
	sourceContentTypeUid: string,
	sourceContentTypeId: string,
	internalLinks: InternalLink[],
	wysiwyg: boolean
) => {
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

const getInternalLinksFromWysiwygFields = async (sanitizedEntity, uid, id) => {
	// Get all wysiwyg fields
	const wysiwygFields = getCustomFields(sanitizedEntity, uid, 'plugin::tiptap.tiptap');

	// Get all internal links from wysiwyg fields
	const internalLinks = wysiwygFields.flatMap((field) => getInternalLinksFromHtml(field));

	if (internalLinks.length === 0) {
		return [];
	}

	// Sanitize
	const mappedInternalLinks = mapInternalLinks(uid, id, internalLinks);
	return mappedInternalLinks;
};

const mapInternalLinksToEntity = (sanitizedEntity, internalLinks) => {
	return internalLinks.reduce((previous, current) => {
		return update(previous, current.sourceFieldName, () => current);
	}, sanitizedEntity);
};

const getInternalLinksFromCustomFields = async (
	sanitizedEntity: any,
	uid: Common.UID.ContentType,
	id: string
): Promise<InternalLink[]> => {
	// Get all internal lkink custom fields
	const internalLinkFields = getCustomFields(sanitizedEntity, uid, 'plugin::internal-links.internal-link');

	const internalLinks = internalLinkFields
		.filter((field) => field?.value?.type === 'internal')
		.map((field) => ({ ...field.value, sourceFieldName: field.key }));

	// Return an empty array if no fields have been found
	if (internalLinks.length === 0) {
		return [];
	}

	// Insert internal links
	const mappedInternalLinks = mapInternalLinks(uid, id, internalLinks);

	return mappedInternalLinks;
};

const updateManyInternalLinksByTarget = async (
	targetContentTypeUid: string,
	targetContentTypeId: string,
	sanitizedEntity: any,
	wysiwyg: boolean
) => {
	const internalLinkContentType = wysiwyg
		? 'plugin::internal-links.internal-link-wysiwyg'
		: 'plugin::internal-links.internal-link';

	const updatedUrl = await strapi
		.service('plugin::internal-links.url')
		.constructURL(targetContentTypeUid, sanitizedEntity);

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

const updateAllLinkedDomains = async (platformId: number, locale: string) => {
	const pages: Record<string, any>[] =
		((await strapi.entityService.findMany(DEFAULT_PAGEBUILDER_COLLECTION, {
			filters: {
				platform: {
					id: platformId
				}
			},
			locale,
			populate: {
				platform: true
			}
		})) as any) || [];

	pages.forEach(async (page) => {
		await strapi
			.service('plugin::internal-links.internal-link')
			.updateSourceEntities(DEFAULT_PAGEBUILDER_COLLECTION, page.id, page),
			await strapi
				.service('plugin::internal-links.internal-link')
				.updateInternalLinksFromTargetContentType(DEFAULT_PAGEBUILDER_COLLECTION, page.id, page);
	});
};

const updateSourceEntities = async (uid: Common.UID.ContentType, id: any, sanitizedEntity: any) => {
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
				lifecycleState: {
					exit: true
				}
			}
		});
	} catch (error) {
		console.error(error);
	}
};

const updateInternalLinksFromTargetContentType = async (
	targetContentTypeUid: Common.UID.ContentType,
	targetContentTypeId: string,
	sanitizedEntity: any
) => {
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
				try {
					const uid = internalLinks[0]?.sourceContentTypeUid;
					const id = internalLinks[0]?.sourceContentTypeId;
					const entity: any = await getPopulatedEntity(uid, id);
					const sanitizedEntity = await sanitizeEntity(entity, uid);
					const updatedEntity = mapInternalLinksWysiwygToEntity(sanitizedEntity, internalLinks);
					await strapi.entityService.update(uid, id, {
						data: {
							...updatedEntity,
							lifecycleState: {
								exit: true
							}
						}
					});
				} catch (error) {
					console.log('error', error);
				}
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
				const entity: any = await getPopulatedEntity(uid, id);
				const sanitizedEntity = await sanitizeEntity(entity, uid);
				const updatedEntity = mapInternalLinksToEntity(sanitizedEntity, internalLinks);
				await strapi.entityService.update(uid, id, {
					data: {
						...updatedEntity,
						lifecycleState: {
							exit: true
						}
					}
				});
			}
		)
	);
};

const getInternalLinksFromHtml = ({ key, value }) => {
	if (!value) {
		return [];
	}
	const wysiwygFieldValue = value;
	const $ = cheerio.load(wysiwygFieldValue, null, false);

	// Get all links that have the data-internal-link attribute
	const serializedLinks = $('[data-internal-link]')
		.map((_idx, element) => {
			return $(element).data('internal-link');
		})
		.toArray();

	// Deserialize links
	const internalLinks = serializedLinks.map((link) => {
		const deserializedLink = deserializeLink(link);
		return {
			...deserializedLink,
			sourceFieldName: key
		};
	});

	// Filter external links
	const filteredLinks = internalLinks.filter((link) => link.type === 'internal');

	return filteredLinks;
};

const updateInternalLinksInHtml = (html, internalLinks) => {
	const wysiwygFieldValue = html;
	const $ = cheerio.load(wysiwygFieldValue, null, false);
	let internalLinkIdx = 0;

	// @ts-ignore
	$('[data-internal-link]').each((_idx: any, element: any) => {
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

const hasSlugChanged = async (event: Event) => {
	const uid = event.model.uid as Common.UID.ContentType;
	const id = event.params.data?.id;

	if (id == null) {
		return false;
	}

	const contentTypeConfig = strapi.service('plugin::internal-links.config').getContentTypeConfig(uid);
	const slugField = contentTypeConfig?.slugField ?? 'path';

	const oldEntity = await strapi.entityService?.findOne(uid, id, {
		fields: [slugField]
	});
	const oldSlug = oldEntity?.path;
	const newSlug = event.params.data?.[slugField];

	if (newSlug == null) {
		return false;
	}

	return oldSlug !== newSlug;
};

export default {
	updateInternalLinksFromTargetContentType,
	updateSourceEntities,
	deleteManyInternalLinksBySource,
	updateAllLinkedDomains,
	hasSlugChanged
};
