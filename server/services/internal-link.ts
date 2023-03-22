import { groupBy, update } from 'lodash';
import { getCustomFields, getPopulatedEntity, sanitizeEntity } from '../utils/strapi';
import { InternalLink } from '../interfaces/link';

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
	targetContentTypeId: string
	): Promise<InternalLink[]> => {
	return strapi.db.query("plugin::internal-links.internal-link").findMany({
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
) => {
	return strapi.db.query('plugin::internal-links.internal-link').findMany({
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
) => {
	await strapi.db.query('plugin::internal-links.internal-link').deleteMany({
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
) => {
	if (internalLinks.length === 0) {
		return [];
	}

	await strapi.db.query('plugin::internal-links.internal-link').createMany({
		data: internalLinks
	});
	return findManyInternalLinksBySource(sourceContentTypeUid, sourceContentTypeId);
};

const mapInternalLinksToEntity = (sanitizedEntity, internalLinks) => {
	return internalLinks.reduce((previous, current) => {
		return update(previous, current.sourceFieldName, () => current);
	}, sanitizedEntity);
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

const updateManyInternalLinksByTarget = async (targetContentTypeUid: string, targetContentTypeId: string, sanitizedEntity: any) => {
	const updatedUrl = strapi.service('plugin::internal-links.url').constructURL(targetContentTypeUid, sanitizedEntity);
	await strapi.db.query('plugin::internal-links.internal-link').updateMany({
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

const updateSourceEntities = async (uid: string, id: string, sanitizedEntity: any) => {
	// Update internal links for normal internal links
	const internalLinksFromNormal = await getInternalLinksFromCustomFields(sanitizedEntity, uid, id);

	// Delete links
	await deleteManyInternalLinksBySource(uid, id);

	// Insert links
	const createdInternalLinksFromNormal = await createManyInternalLinks(uid, id, internalLinksFromNormal);

	// Update entity
	const updatedEntity = mapInternalLinksToEntity(sanitizedEntity, createdInternalLinksFromNormal);

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

const updateInternalLinksFromTargetContentType = async (targetContentTypeUid: string, targetContentTypeId: string, sanitizedEntity: any) => {
	// Update links with new URL
	await updateManyInternalLinksByTarget(targetContentTypeUid, targetContentTypeId, sanitizedEntity);

	// Get source entitites by target
	const internalLinks = await findManyInternalLinksByTarget(targetContentTypeUid, targetContentTypeId);

	const internalLinksCustomGroupedBySource = groupBy(
		internalLinks,
		(iteratee) => `${iteratee.sourceContentTypeUid}-${iteratee.sourceContentTypeId}`
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
