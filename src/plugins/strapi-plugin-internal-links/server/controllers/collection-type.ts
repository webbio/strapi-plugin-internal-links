import { object, string } from 'yup';

const findParamsSchema = object({
	uid: string().required()
});

const findInternalLinkSchema = object({
	params: findParamsSchema
});

const find = async (ctx) => {
	console.log('HI');
	await validateContext(ctx, findInternalLinkSchema);
	const localesArray = await strapi.plugins.i18n.services.locales.find();
	const entityConfig = strapi.service('plugin::internal-links.config').getContentTypeConfig(ctx.params.uid);
	const titleField = entityConfig?.title ?? 'title';

	const locales: string[] = localesArray.map((locale: Record<string, any>) => locale.code);
	return await strapi.entityService.findMany(ctx.params.uid, {
		locale: locales,
		sort: [{ locale: 'desc' }, { publishedAt: 'desc' }, { [titleField]: 'asc' }]
	} as Record<string, any>);
};

const validateContext = async (ctx, schema) => {
	try {
		await schema.validate({
			params: ctx.params
		});
	} catch (error) {
		return error;
	}
};

export default { find };
