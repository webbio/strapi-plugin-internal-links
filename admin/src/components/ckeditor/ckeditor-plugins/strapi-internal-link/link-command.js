import { ATTRIBUTE_NAME, encodeAttributes, isLinkableElement } from './utils';

const Command = window.CKEditor5.core.Command;
const findAttributeRange = window.CKEditor5.typing.findAttributeRange;
const first = window.CKEditor5.utils.first;
const toMap = window.CKEditor5.utils.toMap;

export default class LinkCommand extends Command {
	constructor(editor) {
		super(editor);
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement =
			selection.getSelectedElement() || first(selection.getSelectedBlocks());

		if (isLinkableElement(selectedElement, model.schema)) {
			this.value = selectedElement?.getAttribute(ATTRIBUTE_NAME);
			this.isEnabled = model.schema.checkAttribute(
				selectedElement,
				ATTRIBUTE_NAME
			);
		} else {
			this.value = selection?.getAttribute(ATTRIBUTE_NAME);
			this.isEnabled = model.schema.checkAttributeInSelection(
				selection,
				ATTRIBUTE_NAME
			);
		}
	}

	execute(link, manualDecoratorIds = {}) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const truthyManualDecorators = [];
		const falsyManualDecorators = [];

		const attributeData = {
			href: link.url,
			json: encodeAttributes(link),
		};

		for (const name in manualDecoratorIds) {
			if (manualDecoratorIds[name]) {
				truthyManualDecorators.push(name);
			} else {
				falsyManualDecorators.push(name);
			}
		}

		model.change((writer) => {
			if (selection.isCollapsed) {
				const position = selection.getFirstPosition();

				if (selection.hasAttribute(ATTRIBUTE_NAME)) {
					const linkRange = findAttributeRange(
						position,
						ATTRIBUTE_NAME,
						selection?.getAttribute(ATTRIBUTE_NAME),
						model
					);

					writer.setAttribute(ATTRIBUTE_NAME, attributeData, linkRange);

					truthyManualDecorators.forEach((item) => {
						writer.setAttribute(item, true, linkRange);
					});

					falsyManualDecorators.forEach((item) => {
						writer.removeAttribute(item, linkRange);
					});

					if (link.text) {
						const linkedText = writer.createText(link.text, {
							linkHref: attributeData,
						});
						model.insertContent(linkedText, linkRange.end.nodeBefore, 'after');
						writer.remove(linkRange);
					}
				} else if (!link.url || link.url !== '') {
					const attributes = toMap(selection?.getAttributes());

					attributes.set(ATTRIBUTE_NAME, attributeData);

					truthyManualDecorators.forEach((item) => {
						attributes.set(item, true);
					});

					const { end: positionAfter } = model.insertContent(
						writer.createText(attributeData.href, attributes),
						position
					);

					writer.setSelection(positionAfter);
				}

				[
					ATTRIBUTE_NAME,
					...truthyManualDecorators,
					...falsyManualDecorators,
				].forEach((item) => {
					writer.removeSelectionAttribute(item);
				});
			} else {
				const ranges = model.schema.getValidRanges(
					selection.getRanges(),
					ATTRIBUTE_NAME
				);

				const allowedRanges = [];

				for (const element of selection.getSelectedBlocks()) {
					if (model.schema.checkAttribute(element, ATTRIBUTE_NAME)) {
						allowedRanges.push(writer.createRangeOn(element));
					}
				}

				const rangesToUpdate = allowedRanges.slice();

				for (const range of ranges) {
					if (this._isRangeToUpdate(range, allowedRanges)) {
						rangesToUpdate.push(range);
					}
				}

				for (const range of rangesToUpdate) {
					writer.setAttribute(ATTRIBUTE_NAME, attributeData, range);

					truthyManualDecorators.forEach((item) => {
						writer.setAttribute(item, true, range);
					});

					falsyManualDecorators.forEach((item) => {
						writer.removeAttribute(item, range);
					});
				}
			}
		});
	}

	_isRangeToUpdate(range, allowedRanges) {
		for (const allowedRange of allowedRanges) {
			if (allowedRange.containsRange(range)) {
				return false;
			}
		}

		return true;
	}
}
