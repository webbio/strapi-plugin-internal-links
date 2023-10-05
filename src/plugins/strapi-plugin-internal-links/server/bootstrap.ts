import { Common, Strapi } from '@strapi/strapi';
import { getPopulatedEntity, sanitizeEntity } from './utils/strapi';

export default async ({ strapi }: { strapi: Strapi }) => {
	const contentTypeUids = Object.values(strapi.contentTypes)
		.filter((contentType: any) => contentType?.uid?.startsWith('api::'))
		.map((contentType: any) => contentType.uid);

	// Lifecycles for all entitities
	strapi.db?.lifecycles.subscribe({
		// @ts-ignore
		models: contentTypeUids,
		async afterCreate(event) {
			const uid = event.model.uid as Common.UID.ContentType;
			// @ts-ignore
			const id = event.result.id;
			const entity: any = await getPopulatedEntity(uid, id);
			const sanitizedEntity = await sanitizeEntity(entity, uid);

			await strapi.service('plugin::internal-links.internal-link').updateSourceEntities(uid, id, sanitizedEntity);
		},
		async beforeUpdate(event) {
			// @ts-ignore
			event.state.exit = event.params.data?.lifecycleState?.exit || false;
		},
		async afterUpdate(event) {
			// @ts-ignore
			if (event?.state?.exit) {
				return;
			}

			const uid = event.model.uid as Common.UID.ContentType;
			// @ts-ignore
			const id = event.result.id;
			const entity: any = await getPopulatedEntity(uid, id);
			const sanitizedEntity = await sanitizeEntity(entity, uid);

			await strapi.service('plugin::internal-links.internal-link').updateSourceEntities(uid, id, sanitizedEntity);
			await strapi
				.service('plugin::internal-links.internal-link')
				.updateInternalLinksFromTargetContentType(uid, id, sanitizedEntity);
		},
		async beforeDelete(event) {
			// TODO
		},
		async beforeDeleteMany(event) {
			// TODO
		},
		async afterDelete(event) {
			const uid = event.model.uid;
			// @ts-ignore
			const id = event.result.id;

			await strapi.service('plugin::internal-links.internal-link').deleteManyInternalLinksBySource(uid, id, true);
			await strapi.service('plugin::internal-links.internal-link').deleteManyInternalLinksBySource(uid, id, false);
		},
		async afterDeleteMany(event) {
			// TODO
		}
	});
};
