export default ({ env }) => {
	return {
		'internal-links': {
			enabled: true,
			resolve: './src/plugins/strapi-plugin-internal-links',
			config: {
				environment: 'test',
				useSinglePageType: 'api::page.page',
				defaultNoTitle: true,
				enableUrlAddition: true,
				pageBuilder: {
					enabled: true
				},
				pageSearchOptions: {
					subTitlePath: 'path',
					searchableFields: ['title', 'path']
				},
				domains: {
					default: {
						test: 'https://webbio.nl',
						production: 'https://webbio.nl'
					}
				},
				externalApi: {
					apiUrl: env('EXTERNAL_API_URL'),
					questionaireUrl: env('STRAPI_ADVIESBOOM_WIDGET_EXTERNAL_QUESTIONAIRE_API_URL')
				}
			}
		},
		tiptap: {
			enabled: true
		},
		graphql: {
			enabled: true,
			config: {
				endpoint: '/graphql',
				playgroundAlways: env.bool('ENABLE_GRAPHQL_PLAYGROUND', false),
				depthLimit: 20,
				apolloServer: {
					introspection: env.bool('ENABLE_GRAPHQL_PLAYGROUND', false),
					debug: env.bool('ENABLE_GRAPHQL_PLAYGROUND', false),
					tracing: env.bool('ENABLE_GRAPHQL_PLAYGROUND', false)
				}
			}
		}
	};
};
