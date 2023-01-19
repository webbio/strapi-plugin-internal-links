import {
	addLinkProtocolIfApplicable,
	ATTRIBUTE_NAME,
	encodeAttributes,
	linkHasProtocol,
} from './utils';

const Plugin = window.CKEditor5.core.Plugin;
const Delete = window.CKEditor5.typing.Delete;
const TextWatcher = window.CKEditor5.typing.TextWatcher;
const getLastTextLine = window.CKEditor5.typing.getLastTextLine;

const MIN_LINK_LENGTH_WITH_SPACE_AT_END = 4;

const URL_REG_EXP = new RegExp(
	'(^|\\s)' +
		'(' +
		'(' +
		'(?:(?:(?:https?|ftp):)?\\/\\/)' +
		'(?:\\S+(?::\\S*)?@)?' +
		'(?:' +
		'(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
		'(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
		'(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
		'|' +
		'(' +
		'((?!www\\.)|(www\\.))' +
		'(?![-_])(?:[-_a-z0-9\\u00a1-\\uffff]{1,63}\\.)+' +
		'(?:[a-z\\u00a1-\\uffff]{2,63})' +
		')' +
		')' +
		'(?::\\d{2,5})?' +
		'(?:[/?#]\\S*)?' +
		')' +
		'|' +
		'(' +
		'(www.|(\\S+@))' +
		'((?![-_])(?:[-_a-z0-9\\u00a1-\\uffff]{1,63}\\.))+' +
		'(?:[a-z\\u00a1-\\uffff]{2,63})' +
		')' +
		')$',
	'i'
);

const URL_GROUP_IN_MATCH = 2;

export default class AutoLink extends Plugin {
	static get requires() {
		return [Delete];
	}

	static get pluginName() {
		return 'StrapiAutoLink';
	}

	init() {
		const editor = this.editor;
		const selection = editor.model.document.selection;

		selection.on('change:range', () => {
			this.isEnabled = !selection.anchor.parent.is('element', 'codeBlock');
		});

		this._enableTypingHandling();
	}

	afterInit() {
		this._enableEnterHandling();
		this._enableShiftEnterHandling();
	}

	_enableTypingHandling() {
		const editor = this.editor;

		const watcher = new TextWatcher(editor.model, (text) => {
			if (!isSingleSpaceAtTheEnd(text)) {
				return;
			}

			const url = getUrlAtTextEnd(text.substr(0, text.length - 1));

			if (url) {
				return { url };
			}
		});

		watcher.on('matched:data', (evt, data) => {
			const { batch, range, url } = data;

			if (!batch.isTyping) {
				return;
			}

			const linkEnd = range.end.getShiftedBy(-1); // Executed after a space character.
			const linkStart = linkEnd.getShiftedBy(-url.length);

			const linkRange = editor.model.createRange(linkStart, linkEnd);

			this._applyAutoLink(url, linkRange);
		});

		watcher.bind('isEnabled').to(this);
	}

	_enableEnterHandling() {
		const editor = this.editor;
		const model = editor.model;
		const enterCommand = editor.commands.get('enter');

		if (!enterCommand) {
			return;
		}

		enterCommand.on('execute', () => {
			const position = model.document.selection.getFirstPosition();

			if (!position.parent.previousSibling) {
				return;
			}

			const rangeToCheck = model.createRangeIn(position.parent.previousSibling);

			this._checkAndApplyAutoLinkOnRange(rangeToCheck);
		});
	}

	_enableShiftEnterHandling() {
		const editor = this.editor;
		const model = editor.model;

		const shiftEnterCommand = editor.commands.get('shiftEnter');

		if (!shiftEnterCommand) {
			return;
		}

		shiftEnterCommand.on('execute', () => {
			const position = model.document.selection.getFirstPosition();

			const rangeToCheck = model.createRange(
				model.createPositionAt(position.parent, 0),
				position.getShiftedBy(-1)
			);

			this._checkAndApplyAutoLinkOnRange(rangeToCheck);
		});
	}

	_checkAndApplyAutoLinkOnRange(rangeToCheck) {
		const model = this.editor.model;
		const { text, range } = getLastTextLine(rangeToCheck, model);

		const url = getUrlAtTextEnd(text);

		if (url) {
			const linkRange = model.createRange(
				range.end.getShiftedBy(-url.length),
				range.end
			);

			this._applyAutoLink(url, linkRange);
		}
	}

	_applyAutoLink(url, range) {
		const model = this.editor.model;

		const defaultProtocol = this.editor.config.get('link.defaultProtocol');
		const fullUrl = addLinkProtocolIfApplicable(url, defaultProtocol);

		if (
			!this.isEnabled ||
			!isLinkAllowedOnRange(range, model) ||
			!linkHasProtocol(fullUrl) ||
			linkIsAlreadySet(range)
		) {
			return;
		}

		this._persistAutoLink(fullUrl, range);
	}

	_persistAutoLink(url, range) {
		const model = this.editor.model;
		const deletePlugin = this.editor.plugins.get('Delete');

		const data = {
			href: url,
			json: encodeAttributes({ url, text: url }),
		};

		model.enqueueChange((writer) => {
			writer.setAttribute(ATTRIBUTE_NAME, data, range);

			model.enqueueChange(() => {
				deletePlugin.requestUndoOnBackspace();
			});
		});
	}
}

function isSingleSpaceAtTheEnd(text) {
	return (
		text.length > MIN_LINK_LENGTH_WITH_SPACE_AT_END &&
		text[text.length - 1] === ' ' &&
		text[text.length - 2] !== ' '
	);
}

function getUrlAtTextEnd(text) {
	const match = URL_REG_EXP.exec(text);

	return match ? match[URL_GROUP_IN_MATCH] : null;
}

function isLinkAllowedOnRange(range, model) {
	return model.schema.checkAttributeInSelection(
		model.createSelection(range),
		ATTRIBUTE_NAME
	);
}

function linkIsAlreadySet(range) {
	const item = range.start.nodeAfter;
	return item && item.hasAttribute(ATTRIBUTE_NAME);
}
