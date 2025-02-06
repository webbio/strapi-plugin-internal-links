import type { Attribute, Schema } from '@strapi/strapi';

export interface ModulesLink extends Schema.Component {
	collectionName: 'components_modules_links';
	info: {
		displayName: 'Link';
	};
	attributes: {
		link: Attribute.JSON &
			Attribute.CustomField<
				'plugin::internal-links.internal-link',
				{
					slug: 'slug';
					title: 'title';
				}
			>;
	};
}

export interface ModulesLinkList extends Schema.Component {
	collectionName: 'components_modules_link_lists';
	info: {
		description: '';
		displayName: 'Link list';
	};
	attributes: {
		link: Attribute.Component<'modules.link', true>;
	};
}

export interface ModulesText extends Schema.Component {
	collectionName: 'components_modules_texts';
	info: {
		description: '';
		displayName: 'text';
		icon: 'arrowLeft';
	};
	attributes: {
		text: Attribute.String;
		textInText: Attribute.Component<'modules.text-in-text', true>;
	};
}

export interface ModulesTextInText extends Schema.Component {
	collectionName: 'components_modules_text_in_texts';
	info: {
		displayName: 'text in text';
		icon: 'bell';
	};
	attributes: {
		text: Attribute.String;
	};
}

declare module '@strapi/types' {
	export module Shared {
		export interface Components {
			'modules.link': ModulesLink;
			'modules.link-list': ModulesLinkList;
			'modules.text': ModulesText;
			'modules.text-in-text': ModulesTextInText;
		}
	}
}
