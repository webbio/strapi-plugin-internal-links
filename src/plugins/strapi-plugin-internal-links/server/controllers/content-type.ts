const find = async () => {
	const { pageBuilder } = await strapi.service('plugin::internal-links.config').getGlobalConfig();
	const pageBuilderPathField = pageBuilder?.pathField;

	const filter = Object.values(strapi.contentTypes).filter((contentType: any) => {
		if (contentType?.pluginOptions?.['internal-links']?.enabled === false) {
			return false;
		}

		return pageBuilder?.enabled ? contentType.uid === pageBuilder?.pageUid : contentType.uid?.startsWith('api::');
	});

	return filter?.map((contentType: any) => {
		const domain = strapi.service('plugin::internal-links.url').getDomain(contentType?.uid);
		const titleField = contentType?.pluginOptions?.['internal-links']?.title || 'title';
		const slugField = pageBuilderPathField || contentType?.pluginOptions?.['internal-links']?.slug || 'fullPath';
		const basePathField = contentType?.pluginOptions?.['internal-links']?.basePath || 'basePath';

		return {
			uid: contentType.uid,
			kind: contentType.kind,
			displayName: contentType.info.displayName,
			titleField: titleField,
			slugField: slugField,
			basePath: contentType.attributes?.[basePathField]?.default,
			domain
		};
	});
};

export default { find };
