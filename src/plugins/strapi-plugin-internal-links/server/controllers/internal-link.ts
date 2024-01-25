import { object, string, number, ValidationError } from 'yup';

const updateInternalLinkSchema = object({
	params: object({
		id: number().required()
	}),
	body: object({
		sourceContentTypeUid: string(),
		sourceContentTypeId: number(),
		sourceFieldName: string(),
		targetContentTypeUid: string(),
		targetContentTypeId: number(),
		url: string(),
		text: string(),
		type: string(),
		urlAddition: string()
	})
});

const createInternalLinkSchema = object({
	body: object({
		sourceContentTypeUid: string(),
		sourceContentTypeId: number(),
		sourceFieldName: string(),
		targetContentTypeUid: string(),
		targetContentTypeId: number(),
		url: string(),
		text: string(),
		type: string(),
		urlAddition: string()
	})
});

const deleteInternalLinkSchema = object({
	params: object({
		id: number().required()
	})
});

const find = async (ctx) => {
	return strapi.service('plugin::internal-links.internal-link').find({});
};

const create = async (ctx) => {
	try {
		await validateContext(ctx, createInternalLinkSchema);
		return strapi.service('plugin::internal-links.internal-link').create(ctx.request.body);
	} catch (error) {
		handleError(ctx, error);
	}
};

const findOne = async (ctx) => {
	return strapi.service('plugin::internal-links.internal-link').findOne(ctx.params.id, {});
};

const update = async (ctx) => {
	try {
		await validateContext(ctx, updateInternalLinkSchema);
		return strapi.service('plugin::internal-links.internal-link').update(ctx.params.id, ctx.request.body);
	} catch (error) {
		handleError(ctx, error);
	}
};

const remove = async (ctx) => {
	try {
		await validateContext(ctx, deleteInternalLinkSchema);
		return strapi.service('plugin::internal-links.internal-link').remove(ctx.params.id);
	} catch (error) {
		handleError(ctx, error);
	}
};

const handleError = (ctx, error) => {
	ctx.response.status = 500;

	if (error instanceof ValidationError) {
		ctx.response.status = 400;
	}

	return error;
};

const validateContext = async (ctx, schema) => {
	try {
		await schema.validate({
			body: ctx.request.body,
			params: ctx.params
		});
	} catch (error) {
		return error;
	}
};

export default {
	find,
	findOne,
	create,
	update,
	remove
};
