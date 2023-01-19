import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
	strapi.customFields.register({
		name: 'internal-link',
		plugin: 'internal-links',
		type: 'json'
	});
};
