import type { Schema, Attribute } from '@strapi/strapi';

export interface ModulesText extends Schema.Component {
	collectionName: 'components_modules_texts';
	info: {
		displayName: 'text';
		icon: 'arrowLeft';
		description: '';
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
					title: 'title';
					slug: 'slug';
				}
			>;
	};
}

export interface ModulesLinkList extends Schema.Component {
	collectionName: 'components_modules_link_lists';
	info: {
		displayName: 'Link list';
		description: '';
	};
	attributes: {
		link: Attribute.Component<'modules.link', true>;
	};
}

declare module '@strapi/types' {
	export module Shared {
		export interface Components {
			'modules.text': ModulesText;
			'modules.text-in-text': ModulesTextInText;
			'modules.link': ModulesLink;
			'modules.link-list': ModulesLinkList;
		}
	}
}
