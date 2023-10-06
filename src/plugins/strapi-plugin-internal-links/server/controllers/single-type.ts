import { object, string } from 'yup';

const findParamsSchema = object({
	uid: string().required()
});

const findInternalLinkSchema = object({
	params: findParamsSchema
});

const find = async (ctx) => {
	await validateContext(ctx, findInternalLinkSchema);

	const { query = {} } = ctx.request;
	const localesArray = await strapi.plugins.i18n.services.locales.find();
	const locales = localesArray.map((locale) => locale.code);
	const entityManager = strapi.plugin('content-manager').service('entity-manager');

	let data: any[] = [];

	for (let locale of locales) {
		query.locale = locale;
		const response = await entityManager.find(query, ctx.params.uid);
		if (response) data.push(response);
	}

	return data;
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
