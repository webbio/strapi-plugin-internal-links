import { object, string } from 'yup';

const findParamsSchema = object({
	uid: string().required()
});

const findInternalLinkSchema = object({
	params: findParamsSchema
});

const find = async (ctx) => {
	await validateContext(ctx, findInternalLinkSchema);
	const localesArray = await strapi.plugins.i18n.services.locales.find();
	const entityConfig = strapi.service('plugin::internal-link.config').getContentTypeConfig(ctx.params.uid);
	const titleField = entityConfig?.title ?? 'title';

	const locales = localesArray.map((locale) => locale.code);
	return await strapi.entityService.findMany(ctx.params.uid, {
		locale: locales,
		sort: [{ locale: 'desc' }, { publishedAt: 'desc' }, { [titleField]: 'asc' }]
	});
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
