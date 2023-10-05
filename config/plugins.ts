export default ({ env }) => {
	return {
		'internal-links': {
			enabled: true,
			resolve: './src/plugins/strapi-plugin-internal-links',
			config: {
				environment: 'test',
				domains: {
					default: {
						test: 'https://webbio.nl',
						production: 'https://webbio.nl'
					}
				}
			}
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
