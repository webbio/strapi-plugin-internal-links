// import type ClassicEditor from '@ckeditor/ckeditor5-editor-classic';

import React, { useRef, useState } from 'react';
import { useIntl, MessageDescriptor, IntlFormatters } from 'react-intl';
/*eslint-disable */
import ckeditor5Dll from 'ckeditor5/build/ckeditor5-dll.js';
import ckeditor5EditorClassicDll from '@ckeditor/ckeditor5-editor-classic/build/editor-classic.js';
/*eslint-enable */
import { CKEditor } from '@ckeditor/ckeditor5-react';

import Configurator from './configurator';
import { getGlobalStyling } from './styles';

import { Field, FieldHint, FieldError, FieldLabel, Stack } from '@strapi/design-system';
import MediaLib from '../ckeditor-media-lib';
import InternalLink from '../ckeditor-internal-link';

type IIntlText = MessageDescriptor & Parameters<IntlFormatters['formatMessage']>;

type IEditorPresetTypes = 'markdown' | 'light' | 'standard' | 'rich';

export interface IEditorOptions {
	preset: IEditorPresetTypes;
	sourceId?: number;
	sourceUid?: string;
	maxLengthCharacters?: number;
}

export interface IEditorAttributes {
	pluginOptions?: { slug?: { targetField?: string; field?: string } };
	required?: boolean;
	options: IEditorOptions;
}

export interface ICKEditorInputProps {
	intlLabel?: IIntlText;
	onChange?: any;
	attribute: IEditorAttributes;
	name?: string;
	description?: IIntlText;
	disabled?: boolean;
	error?: any;
	labelAction?: any;
	required?: boolean;
	value?: string;
	contentTypeUID?: string;
	placeholder?: IIntlText;
}

const CKEditorInput = ({
	attribute,
	onChange,
	name,
	value = '',
	disabled = false,
	labelAction,
	intlLabel,
	required = false,
	description,
	error = null
}: ICKEditorInputProps) => {
	if (!window.CKEditor5) return <>BIEM</>;

	const { formatMessage } = useIntl();
	const { maxLengthCharacters: maxLength, sourceId, sourceUid, ...options } = attribute.options;

	const configurator = new Configurator({ options, maxLength });
	const editorConfig = configurator.getEditorConfig();
	const wordCounter = useRef<HTMLDivElement>(null);
	const strapiTheme = localStorage.getItem('STRAPI_THEME');
	const GlobalStyling = getGlobalStyling(strapiTheme);

	const [editorInstance, setEditorInstance] = useState<any | false>(false);
	const [mediaLibVisible, setMediaLibVisible] = useState<boolean>(false);
	const [internalLinkVisible, setInternalLinkVisible] = useState<boolean>(false);
	const [errors, setErrors] = useState<any>(error);
	const [selectedText, setSelectedText] = useState<string | undefined>(undefined);
	const [initialLink, setInitialLink] = useState<string | null | undefined>(error);
	const [isEdit, setIsEdit] = useState<boolean | undefined>(undefined);

	const toggleMediaLibVisible = () => {
		setMediaLibVisible((previousValue) => !previousValue);
	};

	const handleChangeAssets = (assets) => {
		let imageHtmlString = '';

		assets.map((asset) => {
			if (asset.mime.includes('image')) {
				imageHtmlString += `<img src="${asset.url}" alt="${asset.alt}" />`;
			}
		});

		const viewFragment = editorInstance.data.processor.toView(imageHtmlString);
		const modelFragment = editorInstance.data.toModel(viewFragment);
		editorInstance.model.insertContent(modelFragment);

		toggleMediaLibVisible();
	};

	const toggleInternalLinkVisible = (selectedValue?: string, initialValue?: string, isEdit?: boolean) => {
		setSelectedText(selectedValue);
		setInitialLink(initialValue);
		setIsEdit(isEdit);
		setInternalLinkVisible((previousValue) => !previousValue);
	};

	const handleLinkInsert = (html: string, link) => {
		if (!html) return;
		const viewFragment = editorInstance.data.processor.toView(html);
		const modelFragment = editorInstance.data.toModel(viewFragment);

		if (isEdit && link.url) {
			editorInstance.execute('link', link);
		} else {
			editorInstance.model.insertContent(modelFragment);
		}

		setSelectedText(undefined);
		setInitialLink(undefined);
		setIsEdit(false);
	};

	const onEditorReady = (editor: any) => {
		const wordCountPlugin = editor.plugins.get('WordCount');
		const wordCountWrapper = wordCounter.current;

		if (wordCountWrapper) {
			wordCountWrapper.appendChild(wordCountPlugin.wordCountContainer);
		}

		if (editor.plugins.has('strapiMediaLib')) {
			const mediaLibPlugin = editor.plugins.get('strapiMediaLib');
			mediaLibPlugin.connect(toggleMediaLibVisible);
		}

		if (editor.plugins.has('strapiInternalLink')) {
			const internalLinkPlugin = editor.plugins.get('strapiInternalLink');
			internalLinkPlugin.connect(toggleInternalLinkVisible);
		}

		setEditorInstance(editor);
	};

	const onEditorChange = (_: Event, editor: any) => {
		const data = editor.getData();
		onChange({ target: { name, value: data } });

		if (!maxLength) return;

		const wordCountPlugin = editor.plugins.get('WordCount');
		const numberOfCharacters = wordCountPlugin.characters;

		if (numberOfCharacters > maxLength) {
			setErrors('Too long');
		}
	};

	const onEditorFocus = () => {
		if (editorInstance?.plugins?.has('Markdown')) {
			document?.body?.classList?.add('ck-markdown-active');
		} else {
			document?.body?.classList?.remove('ck-markdown-active');
		}
	};

	return (
		<Field name={name} id={name} error={errors} hint={description && formatMessage(description)}>
			<GlobalStyling />

			<Stack spacing={1} required={required}>
				{intlLabel && <FieldLabel action={labelAction}>{formatMessage(intlLabel)}</FieldLabel>}
				<CKEditor
					editor={window.CKEditor5.editorClassic.ClassicEditor}
					data={value}
					disabled={disabled}
					onReady={onEditorReady}
					onChange={onEditorChange}
					onFocus={onEditorFocus}
					config={editorConfig}
				/>

				<div ref={wordCounter}></div>
				<FieldHint />
				<FieldError />
			</Stack>

			<MediaLib isOpen={mediaLibVisible} onChange={handleChangeAssets} onToggle={toggleMediaLibVisible} />

			<InternalLink
				isOpen={internalLinkVisible}
				onChange={handleLinkInsert}
				onToggle={toggleInternalLinkVisible}
				name={name || ''}
				text={selectedText}
				value={initialLink || ''}
				sourceId={sourceId}
				sourceUid={sourceUid}
			/>
		</Field>
	);
};

export default CKEditorInput;
