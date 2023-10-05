import type { Schema, Attribute } from '@strapi/strapi';

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

declare module '@strapi/types' {
	export module Shared {
		export interface Components {
			'modules.text-in-text': ModulesTextInText;
			'modules.text': ModulesText;
		}
	}
}
