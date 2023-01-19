import LinkActionsView, { DATA_IDENTIFIER } from './link-actions-view';

import {
	ATTRIBUTE_NAME,
	isLinkElement,
	LINK_KEYSTROKE,
	icons,
	decodeAttributes,
} from './utils';

const Plugin = window.CKEditor5.core.Plugin;
const ClickObserver = window.CKEditor5.engine.ClickObserver;
const ButtonView = window.CKEditor5.ui.ButtonView;
const ContextualBalloon = window.CKEditor5.ui.ContextualBalloon;
const isWidget = window.CKEditor5.widget.isWidget;
const VISUAL_SELECTION_MARKER_NAME = 'link-ui';

export default class LinkUI extends Plugin {
	static get requires() {
		return [ContextualBalloon];
	}

	static get pluginName() {
		return 'StrapiLinkUI';
	}

	init() {
		const editor = this.editor;

		editor.editing.view.addObserver(ClickObserver);
		this.actionsView = this._createActionsView();
		this._balloon = editor.plugins.get(ContextualBalloon);
		this._createToolbarLinkButton();
		this._enableUserBalloonInteractions();

		editor.conversion.for('editingDowncast').markerToHighlight({
			model: VISUAL_SELECTION_MARKER_NAME,
			view: {
				classes: ['ck-fake-link-selection'],
			},
		});

		editor.conversion.for('editingDowncast').markerToElement({
			model: VISUAL_SELECTION_MARKER_NAME,
			view: {
				name: 'span',
				classes: ['ck-fake-link-selection', 'ck-fake-link-selection_collapsed'],
			},
		});
	}

	destroy() {
		super.destroy();
	}

	_createActionsView() {
		const editor = this.editor;
		const actionsView = new LinkActionsView(editor.locale);
		const linkCommand = editor.commands.get('link');
		const unlinkCommand = editor.commands.get('unlink');

		actionsView.bind(DATA_IDENTIFIER).to(linkCommand, 'value');
		actionsView.editButtonView.bind('isEnabled').to(linkCommand);
		actionsView.unlinkButtonView.bind('isEnabled').to(unlinkCommand);

		this.listenTo(actionsView, 'edit', () => {
			this._toggleModal(true);
		});

		this.listenTo(actionsView, 'unlink', () => {
			editor.execute('unlink');
			this._hideUI();
		});

		actionsView.keystrokes.set('Esc', (data, cancel) => {
			this._hideUI();
			cancel();
		});

		actionsView.keystrokes.set(LINK_KEYSTROKE, (data, cancel) => {
			this._toggleModal();
			cancel();
		});

		return actionsView;
	}

	_createToolbarLinkButton() {
		const editor = this.editor;
		const linkCommand = editor.commands.get('link');
		const t = editor.t;

		editor.keystrokes.set(LINK_KEYSTROKE, (keyEvtData, cancel) => {
			cancel();

			if (linkCommand.isEnabled) {
				this._toggleModal();
			}
		});

		editor.ui.componentFactory.add('link', (locale) => {
			const button = new ButtonView(locale);

			button.isEnabled = true;
			button.label = t('Link');
			button.icon = icons.linkIcon;
			button.keystroke = LINK_KEYSTROKE;
			button.tooltip = true;
			button.isToggleable = true;

			button.bind('isEnabled').to(linkCommand, 'isEnabled');
			button.bind('isOn').to(linkCommand, 'value', (value) => !!value);

			this.listenTo(button, 'execute', () => this._showUI(true));

			return button;
		});
	}

	_enableUserBalloonInteractions() {
		const viewDocument = this.editor.editing.view.document;

		this.listenTo(viewDocument, 'click', () => {
			const parentLink = this._getSelectedLinkElement();

			if (parentLink) {
				this._showUI();
			}
		});

		this.editor.keystrokes.set(
			'Tab',
			(data, cancel) => {
				if (
					this._areActionsVisible &&
					!this.actionsView.focusTracker.isFocused
				) {
					this.actionsView.focus();
					cancel();
				}
			},
			{
				priority: 'high',
			}
		);

		this.editor.keystrokes.set('Esc', (data, cancel) => {
			if (this._isUIVisible) {
				this._hideUI();
				cancel();
			}
		});
	}

	_addActionsView() {
		if (this._areActionsInPanel) {
			return;
		}

		this._balloon.add({
			view: this.actionsView,
			position: this._getBalloonPositionData(),
		});
	}

	_showUI(forceVisible = false) {
		if (!this._getSelectedLinkElement()) {
			this._showFakeVisualSelection();
			this._addActionsView();

			if (forceVisible) {
				this._balloon.showStack('main');
			}

			this._toggleModal();
		} else {
			if (!this._areActionsVisible) {
				this._addActionsView();
			}

			if (forceVisible) {
				this._balloon.showStack('main');
			}
		}

		this._startUpdatingUI();
	}

	_hideUI() {
		if (!this._isUIInPanel) {
			return;
		}

		const editor = this.editor;

		this.stopListening(editor.ui, 'update');
		this.stopListening(this._balloon, 'change:visibleView');

		editor.editing.view.focus();

		this._balloon.remove(this.actionsView);

		this._hideFakeVisualSelection();
	}

	_toggleModal(edit = false) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const initialValue = selection.getAttribute(ATTRIBUTE_NAME);

		this._hideUI();
		this.editor.plugins
			.get('strapiInternalLink')
			.toggle(decodeAttributes(initialValue?.json), edit);
	}

	_startUpdatingUI() {
		const editor = this.editor;
		const viewDocument = editor.editing.view.document;

		let prevSelectedLink = this._getSelectedLinkElement();
		let prevSelectionParent = getSelectionParent();

		const update = () => {
			const selectedLink = this._getSelectedLinkElement();
			const selectionParent = getSelectionParent();

			if (
				(prevSelectedLink && !selectedLink) ||
				(!prevSelectedLink && selectionParent !== prevSelectionParent)
			) {
				this._hideUI();
			} else if (this._isUIVisible) {
				this._balloon.updatePosition(this._getBalloonPositionData());
			}

			prevSelectedLink = selectedLink;
			prevSelectionParent = selectionParent;
		};

		function getSelectionParent() {
			return viewDocument.selection.focus
				.getAncestors()
				.reverse()
				.find((node) => node.is('element'));
		}

		this.listenTo(editor.ui, 'update', update);
		this.listenTo(this._balloon, 'change:visibleView', update);
	}

	get _areActionsInPanel() {
		return this._balloon.hasView(this.actionsView);
	}

	get _areActionsVisible() {
		return this._balloon.visibleView === this.actionsView;
	}

	get _isUIInPanel() {
		return this._areActionsInPanel;
	}

	get _isUIVisible() {
		const visibleView = this._balloon.visibleView;
		return visibleView == this._areActionsVisible;
	}

	_getBalloonPositionData() {
		const view = this.editor.editing.view;
		const model = this.editor.model;
		const viewDocument = view.document;
		let target = null;

		if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
			const markerViewElements = Array.from(
				this.editor.editing.mapper.markerNameToElements(
					VISUAL_SELECTION_MARKER_NAME
				)
			);
			const newRange = view.createRange(
				view.createPositionBefore(markerViewElements[0]),
				view.createPositionAfter(
					markerViewElements[markerViewElements.length - 1]
				)
			);

			target = view.domConverter.viewRangeToDom(newRange);
		} else {
			target = () => {
				const targetLink = this._getSelectedLinkElement();

				return targetLink
					? view.domConverter.mapViewToDom(targetLink)
					: view.domConverter.viewRangeToDom(
							viewDocument.selection.getFirstRange()
					  );
			};
		}

		return { target };
	}

	_getSelectedLinkElement() {
		const view = this.editor.editing.view;
		const selection = view.document.selection;
		const selectedElement = selection.getSelectedElement();

		if (
			selection.isCollapsed ||
			(selectedElement && isWidget(selectedElement))
		) {
			return findLinkElementAncestor(selection.getFirstPosition());
		} else {
			const range = selection.getFirstRange().getTrimmed();
			const startLink = findLinkElementAncestor(range.start);
			const endLink = findLinkElementAncestor(range.end);

			if (!startLink || startLink != endLink) {
				return null;
			}

			if (view.createRangeIn(startLink).getTrimmed().isEqual(range)) {
				return startLink;
			} else {
				return null;
			}
		}
	}

	_showFakeVisualSelection() {
		const model = this.editor.model;

		model.change((writer) => {
			const range = model.document.selection.getFirstRange();

			if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
				writer.updateMarker(VISUAL_SELECTION_MARKER_NAME, { range });
			} else {
				if (range.start.isAtEnd) {
					const startPosition = range.start.getLastMatchingPosition(
						({ item }) => !model.schema.isContent(item),
						{ boundaries: range }
					);

					writer.addMarker(VISUAL_SELECTION_MARKER_NAME, {
						usingOperation: false,
						affectsData: false,
						range: writer.createRange(startPosition, range.end),
					});
				} else {
					writer.addMarker(VISUAL_SELECTION_MARKER_NAME, {
						usingOperation: false,
						affectsData: false,
						range,
					});
				}
			}
		});
	}

	_hideFakeVisualSelection() {
		const model = this.editor.model;

		if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
			model.change((writer) => {
				writer.removeMarker(VISUAL_SELECTION_MARKER_NAME);
			});
		}
	}
}

function findLinkElementAncestor(position) {
	return position.getAncestors().find((ancestor) => isLinkElement(ancestor));
}
