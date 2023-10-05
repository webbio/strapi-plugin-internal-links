export default ({ env }) => ({
	host: env('HOST', '0.0.0.0'),
	port: env.int('PORT', 1337),
	app: {
		keys: env.array('APP_KEYS', ['key1', 'key2'])
	},
	url: env('STRAPI_URL', 'http://localhost:1337'),
	webhooks: {
		populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false)
	}
});
