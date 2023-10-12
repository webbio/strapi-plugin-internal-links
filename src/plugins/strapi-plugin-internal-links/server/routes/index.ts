export default {
	admin: {
		type: 'admin',
		routes: [
			{
				method: 'GET',
				path: '/config',
				handler: 'config.find',
				config: {
					policies: []
				}
			},
			{
				method: 'GET',
				path: '/content-types',
				handler: 'content-type.find',
				config: {
					policies: []
				}
			},
			{
				method: 'GET',
				path: '/single-type/:uid',
				handler: 'single-type.find',
				config: {
					policies: []
				}
			},
			{
				method: 'GET',
				path: '/collection-type/:uid',
				handler: 'collection-type.find',
				config: {
					policies: []
				}
			},
			{
				method: 'GET',
				path: '/',
				handler: 'internal-link.find',
				config: {
					policies: []
				}
			},
			{
				method: 'POST',
				path: '/',
				handler: 'internal-link.create',
				config: {
					policies: []
				}
			},
			{
				method: 'GET',
				path: '/:id',
				handler: 'internal-link.findOne',
				config: {
					policies: []
				}
			},
			{
				method: 'PUT',
				path: '/:id',
				handler: 'internal-link.update',
				config: {
					policies: []
				}
			},
			{
				method: 'DELETE',
				path: '/:id',
				handler: 'internal-link.remove',
				config: {
					policies: []
				}
			}
		]
	}
};
