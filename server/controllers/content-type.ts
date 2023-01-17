const find = () =>
	Object.values(strapi.contentTypes)
		.filter(
			(contentType: any) =>
				contentType.uid?.startsWith('api::') && contentType?.pluginOptions?.['internal-link']?.enabled !== false
		)
		.map((contentType: any) => {
			const domain = strapi.service('plugin::internal-link.url').getDomain(contentType?.uid);
			const titleField = contentType?.pluginOptions?.['internal-link']?.title || 'title';
			const slugField = contentType?.pluginOptions?.['internal-link']?.slug || 'fullPath';
			const basePathField = contentType?.pluginOptions?.['internal-link']?.basePath || 'basePath';

			return {
				uid: contentType.uid,
				kind: contentType.kind,
				displayName: contentType.info.displayName,
				titleField: titleField || null,
				slugField: slugField || null,
				basePath: contentType.attributes[basePathField]?.default,
				domain
			};
		});

export default { find };
