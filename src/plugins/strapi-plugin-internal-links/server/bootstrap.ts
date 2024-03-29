import { Common, Strapi } from '@strapi/strapi';
import { getPopulatedEntity, sanitizeEntity } from './utils/strapi';

export default async ({ strapi }: { strapi: Strapi }) => {
	const { pageBuilder } = await strapi.service('plugin::internal-links.config').getGlobalConfig();
	const contentTypeUids = Object.values(strapi.contentTypes)
		.filter((contentType: any) => {
			if (contentType?.pluginOptions?.['internal-links']?.enabled === false) {
				return false;
			}

			return pageBuilder?.enabled
				? contentType.uid === pageBuilder?.pageUid || contentType.uid === pageBuilder?.platformUid
				: contentType.uid?.startsWith('api::');
		})
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
			const hasSlugChanged = await strapi.service('plugin::internal-links.internal-link')?.hasSlugChanged(event);

			event.state.preventInternalLinksUpdate = !hasSlugChanged;
			event.state.exit = event.params.data?.lifecycleState?.exit || false;
		},
		async afterUpdate(event) {
			// @ts-ignore
			if (event?.state?.exit) {
				return;
			}

			// This is added to prevent revalidation of internal links when the path isn't changed. The updatedPath state comes from the slug plugin
			const state = event.state;

			const uid = event.model.uid as Common.UID.ContentType;

			// @ts-ignore
			const id = event.result.id;
			const entity: any = await getPopulatedEntity(uid, id);
			const sanitizedEntity: Record<string, any> = (await sanitizeEntity(entity, uid)) as any;

			await strapi
				.service('plugin::internal-links.internal-link')
				.updateSourceEntities(uid, id, sanitizedEntity, state);
			await strapi
				.service('plugin::internal-links.internal-link')
				.updateInternalLinksFromTargetContentType(uid, id, sanitizedEntity, state);
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
