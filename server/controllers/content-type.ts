const find = () => {
	const filter = Object.values(strapi.contentTypes).filter(
		(contentType: any) =>
			contentType.uid?.startsWith('api::') && contentType?.pluginOptions?.['internal-links']?.enabled !== false
	);
	return filter?.map((contentType: any) => {
		const domain = strapi.service('plugin::internal-links.url').getDomain(contentType?.uid);
		const titleField = contentType?.pluginOptions?.['internal-links']?.title || 'title';
		const slugField = contentType?.pluginOptions?.['internal-links']?.slug || 'fullPath';
		const basePathField = contentType?.pluginOptions?.['internal-links']?.basePath || 'basePath';

		return {
			uid: contentType.uid,
			kind: contentType.kind,
			displayName: contentType.info.displayName,
			titleField: titleField,
			slugField: slugField,
			basePath: contentType.attributes[basePathField]?.default,
			domain
		};
	});
};

export default { find };
