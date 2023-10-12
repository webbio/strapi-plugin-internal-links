import { groupBy, update } from 'lodash';
import { Common } from '@strapi/strapi';

import { getCustomFields, getPopulatedEntity, sanitizeEntity } from '../utils/strapi';
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
	targetContentTypeId: string
): Promise<InternalLink[]> => {
	return strapi.db.query('plugin::internal-links.internal-link').findMany({
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

const findManyInternalLinksByUid = async (targetContentTypeUid: Common.UID.ContentType): Promise<InternalLink[]> => {
	return strapi.db.query('plugin::internal-links.internal-link').findMany({
		where: {
			$and: [
				{
					sourceContentTypeUid: {
						$eq: targetContentTypeUid
					}
				}
			]
		}
	});
};

const findManyInternalLinksBySource = async (sourceContentTypeUid: string, sourceContentTypeId: string) => {
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

const deleteManyInternalLinksBySource = async (sourceContentTypeUid: string, sourceContentTypeId: string) => {
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
	internalLinks: InternalLink[]
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

const getInternalLinksFromCustomFields = async (
	sanitizedEntity: any,
	uid: Common.UID.ContentType,
	id: string
): Promise<InternalLink[]> => {
	// Get all internal link custom fields
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

const updateManyInternalLinksByTarget = async (
	targetContentTypeUid: string,
	targetContentTypeId: string,
	sanitizedEntity: any
) => {
	const updatedUrl = await strapi
		.service('plugin::internal-links.url')
		.constructURL(targetContentTypeUid, sanitizedEntity);
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

const updateSourceEntities = async (uid: Common.UID.ContentType, id: string, sanitizedEntity: any) => {
	// Update internal links for normal internal links
	const internalLinksFromNormal = await getInternalLinksFromCustomFields(sanitizedEntity, uid, id);

	// Delete links
	await deleteManyInternalLinksBySource(uid, id);

	// Insert links
	const createdInternalLinksFromNormal = await createManyInternalLinks(uid, id, internalLinksFromNormal);

	// Update entity
	const updatedEntity = mapInternalLinksToEntity(sanitizedEntity, createdInternalLinksFromNormal);

	try {
		await strapi.entityService.update(uid, id as any, {
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
				const uid = internalLinks[0]?.sourceContentTypeUid as Common.UID.ContentType;
				const id = internalLinks[0]?.sourceContentTypeId as string;
				const entity: any = await getPopulatedEntity(uid, id);
				const sanitizedEntity = await sanitizeEntity(entity, uid);
				const updatedEntity = mapInternalLinksToEntity(sanitizedEntity, internalLinks);

				await strapi.entityService.update(uid, Number(id), {
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
	deleteManyInternalLinksBySource,
	updateAllLinkedDomains
};
