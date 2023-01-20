import { ATTRIBUTE_NAME, isLinkableElement } from './utils';

const Command = window.CKEditor5.core.Command;
const findAttributeRange = window.CKEditor5.typing.findAttributeRange;

export default class UnlinkCommand extends Command {
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		if (isLinkableElement(selectedElement, model.schema)) {
			this.isEnabled = model.schema.checkAttribute(
				selectedElement,
				ATTRIBUTE_NAME
			);
		} else {
			this.isEnabled = model.schema.checkAttributeInSelection(
				selection,
				ATTRIBUTE_NAME
			);
		}
	}

	execute() {
		const editor = this.editor;
		const model = this.editor.model;
		const selection = model.document.selection;
		const linkCommand = editor.commands.get('link');

		model.change((writer) => {
			const rangesToUnlink = selection.isCollapsed
				? [
						findAttributeRange(
							selection.getFirstPosition(),
							ATTRIBUTE_NAME,
							selection?.getAttribute(ATTRIBUTE_NAME),
							model
						),
				  ]
				: model.schema.getValidRanges(selection.getRanges(), ATTRIBUTE_NAME);

			for (const range of rangesToUnlink) {
				writer.removeAttribute(ATTRIBUTE_NAME, range);

				if (linkCommand) {
					for (const manualDecorator of linkCommand.manualDecorators) {
						writer.removeAttribute(manualDecorator.id, range);
					}
				}
			}
		});
	}
}
