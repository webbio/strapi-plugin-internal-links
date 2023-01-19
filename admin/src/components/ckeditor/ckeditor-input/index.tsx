import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { CKEditor } from '@ckeditor/ckeditor5-react';

/*eslint-disable */
import ckeditor5Dll from 'ckeditor5/build/ckeditor5-dll.js';
import ckeditor5EditorClassicDll from '@ckeditor/ckeditor5-editor-classic/build/editor-classic.js';
/*eslint-enable */

import Configurator from './configurator';
import { getGlobalStyling } from './styles';

import { Field, FieldHint, FieldError, FieldLabel, Stack } from '@strapi/design-system';
import MediaLib from '../ckeditor-media-lib';
import InternalLink from '../ckeditor-internal-link';

interface IProps {
	intlLabel: any;
	onChange: any;
	attribute: any;
	name: string;
	description: any;
	disabled: boolean;
	error: string | null;
	labelAction: any;
	required: boolean;
	value: string;
}

const CKEditorInput = ({
	attribute,
	onChange,
	name,
	value = '',
	disabled = false,
	labelAction = null,
	intlLabel,
	required = false,
	description = null,
	error = null
}: IProps) => {
	const { formatMessage } = useIntl();
	const { maxLengthCharacters: maxLength, sourceId, sourceUid, ...options } = attribute.options;

	const configurator = new Configurator({ options, maxLength });
	const editorConfig = configurator.getEditorConfig();
	const wordCounter = useRef<any>(null);
	const strapiTheme = localStorage.getItem('STRAPI_THEME');
	const GlobalStyling = getGlobalStyling(strapiTheme);

	const [editorInstance, setEditorInstance] = useState<any>(false);
	const [mediaLibVisible, setMediaLibVisible] = useState(false);
	const [internalLinkVisible, setInternalLinkVisible] = useState(false);
	const [errors, setErrors] = useState(error);
	const [selectedText, setSelectedText] = useState(undefined);
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

	const toggleInternalLinkVisible = (selectedValue, initialValue, isEdit) => {
		setSelectedText(selectedValue);
		setInitialLink(initialValue);
		setIsEdit(isEdit);
		setInternalLinkVisible((previousValue) => !previousValue);
	};

	const handleLinkInsert = (html, link) => {
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

	return (
		<Field
			name={name}
			id={name}
			// GenericInput calls formatMessage and returns a string for the error
			error={errors}
			hint={description && formatMessage(description)}
		>
			<GlobalStyling />

			<Stack spacing={1}>
				<FieldLabel action={labelAction} required={required}>
					{formatMessage(intlLabel)}
				</FieldLabel>
				<CKEditor
					editor={window.CKEditor5.editorClassic.ClassicEditor}
					data={value}
					disabled={disabled}
					onReady={(editor) => {
						const wordCountPlugin = editor.plugins.get('WordCount');
						const wordCountWrapper = wordCounter.current;
						wordCountWrapper.appendChild(wordCountPlugin.wordCountContainer);

						if (editor.plugins.has('strapiMediaLib')) {
							const mediaLibPlugin = editor.plugins.get('strapiMediaLib');
							mediaLibPlugin.connect(toggleMediaLibVisible);
						}

						if (editor.plugins.has('strapiInternalLink')) {
							const internalLinkPlugin = editor.plugins.get('strapiInternalLink');
							internalLinkPlugin.connect(toggleInternalLinkVisible);
						}

						setEditorInstance(editor);
					}}
					onChange={(event, editor) => {
						const data = editor.getData();
						onChange({ target: { name, value: data } });

						const wordCountPlugin = editor.plugins.get('WordCount');
						const numberOfCharacters = wordCountPlugin.characters;

						if (numberOfCharacters > maxLength) {
							setErrors('Too long');
						}
					}}
					onFocus={() => {
						if (editorInstance?.plugins?.has('Markdown')) {
							document?.body?.classList?.add('ck-markdown-active');
						} else {
							document?.body?.classList?.remove('ck-markdown-active');
						}
					}}
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
				name={name}
				text={selectedText}
				value={initialLink}
				sourceId={sourceId}
				sourceUid={sourceUid}
			/>
		</Field>
	);
};

export default CKEditorInput;
