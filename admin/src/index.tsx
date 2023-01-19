import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './plugin-id';
import Initializer from './components/initializer';
import PluginIcon from './components/plugin-icon';
import getTrad from './utils/get-trad';
import LinkIcon from './components/internal-link/internal-link-icon';

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
		app.customFields.register({
			name: 'internal-link',
			pluginId: 'internal-links',
			type: 'json',
			default: {
				sourceContentTypeUid: null,
				sourceContentTypeId: null,
				sourceFieldName: null,
				targetContentTypeUid: null,
				targetContentTypeId: null
			},
			intlLabel: {
				id: getTrad('internal-link.label'),
				defaultMessage: 'Internal Link'
			},
			intlDescription: {
				id: getTrad('internal-link.description'),
				defaultMessage: 'Description'
			},
			icon: LinkIcon,
			components: {
				Input: async () =>
					import(/* webpackChunkName: "internal-link-component" */ './components/internal-link/internal-link-input')
			},
			options: {
				base: [
					{
						sectionTitle: {
							// Add a "Format" settings section
							id: 'color-picker.color.section.format',
							defaultMessage: 'Settings'
						},
						items: [
							{
								intlLabel: {
									id: getTrad('internal-link.options.base.title'),
									defaultMessage: 'Title'
								},
								name: 'options.title',
								description: {
									id: getTrad('internal-link.options.base.title.description'),
									defaultMessage: 'Select the title field'
								},
								type: 'text',
								defaultValue: ''
							},
							{
								intlLabel: {
									id: getTrad('internal-link.options.base.slug'),
									defaultMessage: 'Slug'
								},
								name: 'options.slug',
								description: {
									id: getTrad('internal-link.options.base.slug.description'),
									defaultMessage: 'Select the slug field'
								},
								type: 'text',
								defaultValue: ''
							}
						]
					}
				],
				advanced: [
					{
						sectionTitle: {
							id: 'global.settings',
							defaultMessage: 'Settings'
						},
						items: [
							{
								name: 'required',
								type: 'checkbox',
								intlLabel: {
									id: getTrad('color-picker.options.advanced.requiredField'),
									defaultMessage: 'Required field'
								},
								description: {
									id: getTrad('color-picker.options.advanced.requiredField.description'),
									defaultMessage: "You won't be able to create an entry if this field is empty"
								}
							}
						]
					}
				]
			}
		});
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
