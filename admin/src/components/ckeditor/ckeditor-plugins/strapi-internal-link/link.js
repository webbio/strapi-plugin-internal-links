import LinkEditing from './link-editing';
import LinkUI from './link-ui';
import AutoLink from './auto-link';
import { icons } from './utils';

const Plugin = window.CKEditor5.core.Plugin;
const ButtonView = window.CKEditor5.ui.ButtonView;

export default class StrapiInternalLink extends Plugin {
	static get requires() {
		return [LinkEditing, LinkUI, AutoLink];
	}

	static get pluginName() {
		return 'strapiInternalLink';
	}

	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add('strapiInternalLink', () => {
			const button = new ButtonView();

			button.set({
				label: 'Internal Link',
				icon: icons.linkIcon,
				tooltip: true,
			});

			button.on('execute', this.toggle.bind(this));

			return button;
		});
	}

	connect(strapiToggle) {
		if (typeof strapiToggle !== 'function') {
			throw new Error('Input parameter for toggle should be a function');
		}

		this.strapiToggle = strapiToggle;
	}

	toggle(initialValue, forceEdit = false) {
		if (typeof this.strapiToggle !== 'function') {
			throw new Error(
				'Strapi media library toggle function not connected. Use connect function first'
			);
		}

		const isEdit =
			forceEdit || (initialValue && typeof initialValue === 'string');

		const selectedText = [];
		const selectionRange =
			this.editor?.model?.document?.selection?.getFirstRange();

		if (selectionRange) {
			for (const item of selectionRange.getItems()) {
				selectedText.push(item.data);
			}
		}

		this.strapiToggle(selectedText.join(' '), initialValue, isEdit);
	}
}
