import LinkCommand from './link-command';
import UnlinkCommand from './unlink-command';
import {
	createLinkElement,
	ensureSafeUrl,
	openLink,
	addLinkProtocolIfApplicable,
	ATTRIBUTE_NAME,
} from './utils';

const Plugin = window.CKEditor5.core.Plugin;
const MouseObserver = window.CKEditor5.engine.MouseObserver;
const Input = window.CKEditor5.typing.Input;
const TwoStepCaretMovement = window.CKEditor5.typing.TwoStepCaretMovement;
const inlineHighlight = window.CKEditor5.typing.inlineHighlight;
const findAttributeRange = window.CKEditor5.typing.findAttributeRange;
const ClipboardPipeline = window.CKEditor5.clipboard.ClipboardPipeline;
const keyCodes = window.CKEditor5.utils.keyCodes;
const env = window.CKEditor5.utils.env;

const HIGHLIGHT_CLASS = 'ck-link_selected';

export default class LinkEditing extends Plugin {
	static get pluginName() {
		return 'StrapiLinkEditing';
	}

	static get requires() {
		return [TwoStepCaretMovement, Input, ClipboardPipeline];
	}

	constructor(editor) {
		super(editor);

		editor.config.define('link', {
			addTargetToExternalLinks: false,
		});
	}

	init() {
		const editor = this.editor;

		editor.model.schema.extend('$text', { allowAttributes: ATTRIBUTE_NAME });

		editor.conversion
			.for('dataDowncast')
			.attributeToElement({ model: ATTRIBUTE_NAME, view: createLinkElement });

		editor.conversion.for('editingDowncast').attributeToElement({
			model: ATTRIBUTE_NAME,
			view: (data, conversionApi) => {
				const object = {
					json: data?.json,
					href: data?.href ? ensureSafeUrl(data.href) : undefined,
				};

				return createLinkElement(object, conversionApi);
			},
		});

		editor.conversion.for('upcast').elementToAttribute({
			view: {
				name: 'a',
				attributes: {
					href: true,
					['data-internal-link']: true,
				},
			},
			model: {
				key: ATTRIBUTE_NAME,
				value: (viewElement) => ({
					href: viewElement.getAttribute('href'),
					json: viewElement.getAttribute('data-internal-link'),
				}),
			},
		});

		editor.commands.add('link', new LinkCommand(editor));
		editor.commands.add('unlink', new UnlinkCommand(editor));

		const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);
		twoStepCaretMovementPlugin.registerAttribute(ATTRIBUTE_NAME);

		inlineHighlight(editor, ATTRIBUTE_NAME, 'a', HIGHLIGHT_CLASS);

		this._enableLinkOpen();
		this._enableInsertContentSelectionAttributesFixer();
		this._enableClickingAfterLink();
		this._enableTypingOverLink();
		this._handleDeleteContentAfterLink();
		this._enableClipboardIntegration();
	}

	_enableLinkOpen() {
		const editor = this.editor;
		const view = editor.editing.view;
		const viewDocument = view.document;

		this.listenTo(
			viewDocument,
			'click',
			(evt, data) => {
				const shouldOpen = env.isMac
					? data.domEvent.metaKey
					: data.domEvent.ctrlKey;

				if (!shouldOpen) {
					return;
				}

				let clickedElement = data.domTarget;

				if (clickedElement.tagName.toLowerCase() != 'a') {
					clickedElement = clickedElement.closest('a');
				}

				if (!clickedElement) {
					return;
				}

				const url = clickedElement?.getAttribute('href');

				if (!url) {
					return;
				}

				evt.stop();
				data.preventDefault();

				openLink(url);
			},
			{ context: '$capture' }
		);

		this.listenTo(viewDocument, 'keydown', (evt, data) => {
			const url = editor.commands.get('link').value;
			const shouldOpen = url && data.keyCode === keyCodes.enter && data.altKey;

			if (!shouldOpen) {
				return;
			}

			evt.stop();

			openLink(url);
		});
	}

	_enableInsertContentSelectionAttributesFixer() {
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;

		this.listenTo(
			model,
			'insertContent',
			() => {
				const nodeBefore = selection.anchor.nodeBefore;
				const nodeAfter = selection.anchor.nodeAfter;

				if (!selection.hasAttribute(ATTRIBUTE_NAME)) {
					return;
				}

				if (!nodeBefore) {
					return;
				}

				if (!nodeBefore.hasAttribute(ATTRIBUTE_NAME)) {
					return;
				}

				if (nodeAfter && nodeAfter.hasAttribute(ATTRIBUTE_NAME)) {
					return;
				}

				model.change((writer) => {
					removeLinkAttributesFromSelection(
						writer,
						getLinkAttributesAllowedOnText(model.schema)
					);
				});
			},
			{ priority: 'low' }
		);
	}

	_enableClickingAfterLink() {
		const editor = this.editor;
		const model = editor.model;

		editor.editing.view.addObserver(MouseObserver);

		let clicked = false;

		this.listenTo(editor.editing.view.document, 'mousedown', () => {
			clicked = true;
		});

		this.listenTo(editor.editing.view.document, 'selectionChange', () => {
			if (!clicked) {
				return;
			}

			clicked = false;

			const selection = model.document.selection;

			if (!selection.isCollapsed) {
				return;
			}

			if (!selection.hasAttribute(ATTRIBUTE_NAME)) {
				return;
			}

			const position = selection.getFirstPosition();
			const linkRange = findAttributeRange(
				position,
				ATTRIBUTE_NAME,
				selection?.getAttribute(ATTRIBUTE_NAME),
				model
			);

			if (
				position.isTouching(linkRange.start) ||
				position.isTouching(linkRange.end)
			) {
				model.change((writer) => {
					removeLinkAttributesFromSelection(
						writer,
						getLinkAttributesAllowedOnText(model.schema)
					);
				});
			}
		});
	}

	_enableTypingOverLink() {
		const editor = this.editor;
		const view = editor.editing.view;

		let selectionAttributes;
		let deletedContent;

		this.listenTo(
			view.document,
			'delete',
			() => {
				deletedContent = true;
			},
			{ priority: 'high' }
		);

		this.listenTo(
			editor.model,
			'deleteContent',
			() => {
				const selection = editor.model.document.selection;

				if (selection.isCollapsed) {
					return;
				}

				if (deletedContent) {
					deletedContent = false;

					return;
				}

				if (!isTyping(editor)) {
					return;
				}

				if (shouldCopyAttributes(editor.model)) {
					selectionAttributes = selection?.getAttributes();
				}
			},
			{ priority: 'high' }
		);

		this.listenTo(
			editor.model,
			'insertContent',
			(evt, [element]) => {
				deletedContent = false;

				if (!isTyping(editor)) {
					return;
				}

				if (!selectionAttributes) {
					return;
				}

				editor.model.change((writer) => {
					for (const [attribute, value] of selectionAttributes) {
						writer.setAttribute(attribute, value, element);
					}
				});

				selectionAttributes = null;
			},
			{ priority: 'high' }
		);
	}

	_handleDeleteContentAfterLink() {
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;
		const view = editor.editing.view;

		let shouldPreserveAttributes = false;
		let hasBackspacePressed = false;

		this.listenTo(
			view.document,
			'delete',
			(evt, data) => {
				hasBackspacePressed = data.direction === 'backward';
			},
			{ priority: 'high' }
		);

		this.listenTo(
			model,
			'deleteContent',
			() => {
				shouldPreserveAttributes = false;

				const position = selection?.getFirstPosition();
				const linkHref = selection?.getAttribute(ATTRIBUTE_NAME);

				if (!linkHref) {
					return;
				}

				const linkRange = findAttributeRange(
					position,
					ATTRIBUTE_NAME,
					linkHref,
					model
				);

				shouldPreserveAttributes =
					linkRange.containsPosition(position) ||
					linkRange.end.isEqual(position);
			},
			{ priority: 'high' }
		);

		this.listenTo(
			model,
			'deleteContent',
			() => {
				if (!hasBackspacePressed) {
					return;
				}

				hasBackspacePressed = false;

				if (shouldPreserveAttributes) {
					return;
				}

				editor.model.enqueueChange((writer) => {
					removeLinkAttributesFromSelection(
						writer,
						getLinkAttributesAllowedOnText(model.schema)
					);
				});
			},
			{ priority: 'low' }
		);
	}

	_enableClipboardIntegration() {
		const editor = this.editor;
		const model = editor.model;
		const defaultProtocol = this.editor.config.get('link.defaultProtocol');

		if (!defaultProtocol) {
			return;
		}

		this.listenTo(
			editor.plugins.get('ClipboardPipeline'),
			'contentInsertion',
			(evt, data) => {
				model.change((writer) => {
					const range = writer.createRangeIn(data.content);

					for (const item of range.getItems()) {
						if (item.hasAttribute(ATTRIBUTE_NAME)) {
							const newLink = addLinkProtocolIfApplicable(
								item?.getAttribute(ATTRIBUTE_NAME),
								defaultProtocol
							);

							writer.setAttribute(ATTRIBUTE_NAME, newLink, item);
						}
					}
				});
			}
		);
	}
}

function removeLinkAttributesFromSelection(writer, linkAttributes) {
	writer.removeSelectionAttribute(ATTRIBUTE_NAME);

	for (const attribute of linkAttributes) {
		writer.removeSelectionAttribute(attribute);
	}
}

function shouldCopyAttributes(model) {
	const selection = model.document.selection;
	const firstPosition = selection.getFirstPosition();
	const lastPosition = selection.getLastPosition();
	const nodeAtFirstPosition = firstPosition.nodeAfter;

	if (!nodeAtFirstPosition) {
		return false;
	}

	if (!nodeAtFirstPosition.is('$text')) {
		return false;
	}

	if (!nodeAtFirstPosition.hasAttribute(ATTRIBUTE_NAME)) {
		return false;
	}

	const nodeAtLastPosition = lastPosition.textNode || lastPosition.nodeBefore;

	if (nodeAtFirstPosition === nodeAtLastPosition) {
		return true;
	}

	const linkRange = findAttributeRange(
		firstPosition,
		ATTRIBUTE_NAME,
		nodeAtFirstPosition?.getAttribute(ATTRIBUTE_NAME),
		model
	);

	return linkRange.containsRange(
		model.createRange(firstPosition, lastPosition),
		true
	);
}

function isTyping(editor) {
	const currentBatch = editor.model.change((writer) => writer.batch);
	return currentBatch.isTyping;
}

function getLinkAttributesAllowedOnText(schema) {
	const textAttributes = schema.getDefinition('$text').allowAttributes;
	return textAttributes.filter((attribute) => attribute.startsWith('link'));
}
