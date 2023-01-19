import { ensureSafeUrl, icons } from './utils';

const FocusTracker = window.CKEditor5.utils.FocusTracker;
const KeystrokeHandler = window.CKEditor5.utils.KeystrokeHandler;
const ButtonView = window.CKEditor5.ui.ButtonView;
const View = window.CKEditor5.ui.View;
const ViewCollection = window.CKEditor5.ui.ViewCollection;
const FocusCycler = window.CKEditor5.ui.FocusCycler;

export const DATA_IDENTIFIER = 'data';

export default class LinkActionsView extends View {
	constructor(locale) {
		super(locale);

		const t = locale.t;

		this.focusTracker = new FocusTracker();

		this.keystrokes = new KeystrokeHandler();

		this.previewButtonView = this._createPreviewButton();

		this.unlinkButtonView = this._createButton(
			t('Unlink'),
			icons.unlinkIcon,
			'unlink'
		);

		this.editButtonView = this._createButton(
			t('Edit link'),
			icons.editIcon,
			'edit'
		);

		this.set(DATA_IDENTIFIER);

		this._focusables = new ViewCollection();

		this._focusCycler = new FocusCycler({
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				focusPrevious: 'shift + tab',
				focusNext: 'tab',
			},
		});

		this.setTemplate({
			tag: 'div',

			attributes: {
				class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
				tabindex: '-1',
			},

			children: [
				this.previewButtonView,
				this.editButtonView,
				this.unlinkButtonView,
			],
		});
	}

	render() {
		super.render();

		const childViews = [
			this.previewButtonView,
			this.editButtonView,
			this.unlinkButtonView,
		];

		childViews.forEach((view) => {
			this._focusables.add(view);
			this.focusTracker.add(view.element);
		});

		this.keystrokes.listenTo(this.element);
	}

	destroy() {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	focus() {
		this._focusCycler.focusFirst();
	}

	_createButton(label, icon, eventName) {
		const button = new ButtonView(this.locale);

		button.set({
			label,
			icon,
			tooltip: true,
		});

		button.delegate('execute').to(this, eventName);

		return button;
	}

	_createPreviewButton() {
		const button = new ButtonView(this.locale);
		const bind = this.bindTemplate;
		const t = this.t;

		button.set({
			withText: true,
			tooltip: t('Open link in new tab'),
		});

		button.extendTemplate({
			attributes: {
				class: ['ck', 'ck-link-actions__preview'],
				href: bind.to(
					DATA_IDENTIFIER,
					(data) => data?.href && ensureSafeUrl(data.href)
				),
				target: '_blank',
				rel: 'noopener noreferrer',
			},
		});

		button.bind('label').to(this, DATA_IDENTIFIER, (data) => {
			return data?.href || t('This link has no URL');
		});

		button.bind('isEnabled').to(this, DATA_IDENTIFIER, (data) => !!data?.href);

		button.template.tag = 'a';
		button.template.eventListeners = {};

		return button;
	}
}
