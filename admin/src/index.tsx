import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './plugin-id';
import Initializer from './components/initializer';
import PluginIcon from './components/plugin-icon';

const name = pluginPkg.strapi.name;

export default {
	register(app) {
		app.addMenuLink({
			to: `/plugins/${pluginId}`,
			icon: PluginIcon,
			intlLabel: {
				id: `${pluginId}.plugin.name`,
				defaultMessage: name
			},
			Component: async () => {
				const component = await import(/* webpackChunkName: "[request]" */ './pages/app');

				return component;
			},
			permissions: [
				// Uncomment to set the permissions of the plugin here
				// {
				//   action: '', // the action name should be plugin::plugin-name.actionType
				//   subject: null,
				// },
			]
		});
		const plugin = {
			id: pluginId,
			initializer: Initializer,
			isReady: false,
			name
		};

		app.registerPlugin(plugin);
	},

	bootstrap(app) {},
	async registerTrads(app) {
		const { locales } = app;

		const importedTrads = await Promise.all(
			locales.map((locale: string) => {
				return import(`./translations/${locale}.json`)
					.then(({ default: data }) => {
						return {
							data: prefixPluginTranslations(data, pluginId),
							locale
						};
					})
					.catch(() => {
						return {
							data: {},
							locale
						};
					});
			})
		);

		return Promise.resolve(importedTrads);
	}
};
