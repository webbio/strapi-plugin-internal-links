import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
	strapi.customFields.register({
		name: 'internal-link',
		plugin: 'internal-link',
		type: 'json'
	});
	strapi.customFields.register({
		name: 'CKEditor',
		plugin: 'internal-link',
		type: 'richtext'
	});
};
