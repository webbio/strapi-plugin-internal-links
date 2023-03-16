import { load } from 'cheerio';
import { deserializeLink, serializeLink } from '../utils/serialize';
import { getCustomFields, getPopulatedEntity, sanitizeEntity } from '../utils/strapi';
import { groupBy, get, update, merge } from 'lodash';
import { InternalLink } from '../interfaces/link';

const getInternalLinksFromHtml = (html: string) => {
	if (!html) {
		return [];
	}
	const wysiwygFieldValue = html;
	const $ = load(wysiwygFieldValue, null, false);

	// Get all links that have the data-internal-link attribute
	const serializedLinks = $('[data-internal-link]')
		.map((_idx, element) => {
			return $(element).data('internal-link');
		})
		.toArray();

	// Deserialize links
	const internalLinks: InternalLink[] = serializedLinks.map((link: string) => deserializeLink(link));

	// Filter external links
	const filteredLinks = internalLinks.filter((link) => link.type === 'internal');
	return filteredLinks;
};

const mapInternalLinks = (sourceContentTypeUid: string, sourceContentTypeId: string, internalLinks: InternalLink[]) => {
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
	targetContentTypeUid: string,
	targetContentTypeId: string,
	wysiwyg: boolean
): Promise<InternalLink[]> => {
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

const updateInternalLinksInHtml = (html: string, internalLinks: InternalLink[]) => {
	const wysiwygFieldValue = html;
	const $ = load(wysiwygFieldValue, null, false);

	$('[data-internal-link]')?.each((_idx, element): any => {
		let internalLinkIdx = 0;
		const currentElement = $(element);
		const currentInternalLinkData = currentElement.data('internal-link') as string;
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

const getInternalLinksFromCustomFields = async (sanitizedEntity: any, uid: string, id: string) => {
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
				lifecycleState: {
					exit: true
				}
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
						lifecycleState: {
							exit: true
						}
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
						lifecycleState: {
							exit: true
						}
					}
				});
			}
		)
	);
};

export default {
	updateInternalLinksFromTargetContentType,
	updateSourceEntities,
	deleteManyInternalLinksBySource
};
