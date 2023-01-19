/* eslint-disable */
import ckeditor5Dll from 'ckeditor5/build/ckeditor5-dll.js';
import ckeditor5AlignmentDll from '@ckeditor/ckeditor5-alignment/build/alignment.js';
import ckeditor5AutoformatDll from '@ckeditor/ckeditor5-autoformat/build/autoformat.js';
import ckeditor5BasicStylesDll from '@ckeditor/ckeditor5-basic-styles/build/basic-styles.js';
import ckeditor5BlockQuoteDll from '@ckeditor/ckeditor5-block-quote/build/block-quote.js';
import ckeditor5CodeBlockDll from '@ckeditor/ckeditor5-code-block/build/code-block.js';
import ckeditor5EssentialsDll from '@ckeditor/ckeditor5-essentials/build/essentials.js';
import ckeditor5FontDll from '@ckeditor/ckeditor5-font/build/font.js';
import ckeditor5HeadingDll from '@ckeditor/ckeditor5-heading/build/heading.js';
import ckeditor5HtmlEmbedDll from '@ckeditor/ckeditor5-html-embed/build/html-embed.js';
import ckeditor5HorizontalLineDll from '@ckeditor/ckeditor5-horizontal-line/build/horizontal-line.js';
import ckeditor5MediaEmbedDll from '@ckeditor/ckeditor5-media-embed/build/media-embed.js';
import ckeditor5ImageDll from '@ckeditor/ckeditor5-image/build/image.js';
import ckeditor5IndentDll from '@ckeditor/ckeditor5-indent/build/indent.js';
import ckeditor5LinkDll from '@ckeditor/ckeditor5-link/build/link.js';
import ckeditor5ListDll from '@ckeditor/ckeditor5-list/build/list.js';
import ckeditor5PasteFromOfficeDll from '@ckeditor/ckeditor5-paste-from-office/build/paste-from-office.js';
import ckeditor5RemoveFormatDll from '@ckeditor/ckeditor5-remove-format/build/remove-format.js';
import ckeditor5TableDll from '@ckeditor/ckeditor5-table/build/table.js';
import ckeditor5WordCountDll from '@ckeditor/ckeditor5-word-count/build/word-count.js';
import ckeditor5MaximumLengthDll from '@reinmar/ckeditor5-maximum-length/build/maximum-length.js';
import ckeditor5SourceEditing from '@ckeditor/ckeditor5-source-editing/build/source-editing';
import ckeditor5Markdown from '@ckeditor/ckeditor5-markdown-gfm/build/markdown-gfm';
/* eslint-enable */

import { StrapiMediaLib } from '../ckeditor-plugins/strapi-media-lib';
import StrapiInternalLink from '../ckeditor-plugins/strapi-internal-link';

const headingConfig = {
	options: [
		{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
		{
			model: 'heading2',
			view: 'h2',
			title: 'Heading 2',
			class: 'ck-heading_heading2'
		},
		{
			model: 'heading3',
			view: 'h3',
			title: 'Heading 3',
			class: 'ck-heading_heading3'
		},
		{
			model: 'heading4',
			view: 'h4',
			title: 'Heading 4',
			class: 'ck-heading_heading4'
		},
		{
			model: 'heading5',
			view: 'h5',
			title: 'Heading 5',
			class: 'ck-heading_heading5'
		}
	]
};

const imageConfig = {
	toolbar: ['imageTextAlternative', '|', 'resizeImage']
};

const tableConfig = {
	contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', '|', 'toggleTableCaption']
};

const CKEDITOR_BASE_CONFIG_FOR_PRESETS = {
	markdown: {
		plugins: [
			window.CKEditor5.markdownGfm.Markdown,
			window.CKEditor5.alignment.Alignment,
			window.CKEditor5.autoformat.Autoformat,
			window.CKEditor5.basicStyles.Bold,
			window.CKEditor5.basicStyles.Italic,
			window.CKEditor5.blockQuote.BlockQuote,
			window.CKEditor5.essentials.Essentials,
			window.CKEditor5.heading.Heading,
			window.CKEditor5.image.Image,
			window.CKEditor5.image.ImageCaption,
			window.CKEditor5.image.ImageStyle,
			window.CKEditor5.image.ImageToolbar,
			window.CKEditor5.image.ImageUpload,
			window.CKEditor5.indent.Indent,
			window.CKEditor5.link.Link,
			window.CKEditor5.link.LinkImage,
			window.CKEditor5.list.List,
			window.CKEditor5.paragraph.Paragraph,
			window.CKEditor5.pasteFromOffice.PasteFromOffice,
			window.CKEditor5.sourceEditing.SourceEditing,
			window.CKEditor5.table.Table,
			window.CKEditor5.table.TableToolbar,
			window.CKEditor5.table.TableColumnResize,
			window.CKEditor5.table.TableCaption,
			window.CKEditor5.table.TableProperties,
			window.CKEditor5.table.TableCellProperties,
			window.CKEditor5.wordCount.WordCount
		],
		toolbar: [
			'heading',
			'|',
			'bold',
			'italic',
			'link',
			'|',
			'alignment',
			'blockQuote',
			'|',
			'insertTable',
			'bulletedList',
			'numberedList',
			'|',
			'undo',
			'redo',
			'|',
			'sourceEditing'
		],
		heading: {
			options: [
				{
					model: 'paragraph',
					title: 'Paragraph',
					class: 'ck-heading_paragraph'
				},
				{
					model: 'heading3',
					view: 'h3',
					title: 'Heading 3',
					class: 'ck-heading_heading3'
				},
				{
					model: 'heading4',
					view: 'h4',
					title: 'Heading 4',
					class: 'ck-heading_heading4'
				}
			]
		},
		image: imageConfig,
		table: {
			defaultHeadings: { rows: 1 },
			contentToolbar: ['tableColumn', 'tableRow']
		}
	},

	light: {
		plugins: [
			window.CKEditor5.autoformat.Autoformat,
			window.CKEditor5.basicStyles.Bold,
			window.CKEditor5.basicStyles.Italic,
			window.CKEditor5.essentials.Essentials,
			window.CKEditor5.heading.Heading,
			window.CKEditor5.image.Image,
			window.CKEditor5.image.ImageCaption,
			window.CKEditor5.image.ImageStyle,
			window.CKEditor5.image.ImageToolbar,
			window.CKEditor5.image.ImageUpload,
			window.CKEditor5.indent.Indent,
			window.CKEditor5.list.List,
			window.CKEditor5.paragraph.Paragraph,
			window.CKEditor5.pasteFromOffice.PasteFromOffice,
			window.CKEditor5.table.Table,
			window.CKEditor5.table.TableToolbar,
			window.CKEditor5.table.TableColumnResize,
			window.CKEditor5.table.TableCaption,
			window.CKEditor5.wordCount.WordCount,
			StrapiMediaLib,
			StrapiInternalLink
		],
		toolbar: [
			'heading',
			'|',
			'bold',
			'italic',
			'strapiInternalLink',
			'|',
			'bulletedList',
			'numberedList',
			'|',
			'undo',
			'redo'
		],
		heading: headingConfig,
		image: imageConfig,
		table: tableConfig
	},

	standard: {
		plugins: [
			window.CKEditor5.autoformat.Autoformat,
			window.CKEditor5.basicStyles.Bold,
			window.CKEditor5.basicStyles.Italic,
			window.CKEditor5.blockQuote.BlockQuote,
			window.CKEditor5.codeBlock.CodeBlock,
			window.CKEditor5.essentials.Essentials,
			window.CKEditor5.heading.Heading,
			window.CKEditor5.horizontalLine.HorizontalLine,
			window.CKEditor5.image.Image,
			window.CKEditor5.image.ImageCaption,
			window.CKEditor5.image.ImageStyle,
			window.CKEditor5.image.ImageToolbar,
			window.CKEditor5.image.ImageUpload,
			window.CKEditor5.indent.Indent,
			window.CKEditor5.list.List,
			window.CKEditor5.mediaEmbed.MediaEmbed,
			window.CKEditor5.paragraph.Paragraph,
			window.CKEditor5.pasteFromOffice.PasteFromOffice,
			window.CKEditor5.table.Table,
			window.CKEditor5.table.TableToolbar,
			window.CKEditor5.table.TableColumnResize,
			window.CKEditor5.table.TableCaption,
			window.CKEditor5.wordCount.WordCount,
			StrapiMediaLib,
			StrapiInternalLink
		],
		toolbar: [
			'heading',
			'|',
			'bold',
			'italic',
			'strapiInternalLink',
			'|',
			'insertTable',
			'bulletedList',
			'numberedList',
			'|',
			'horizontalLine',
			'blockQuote',
			'strapiMediaLib',
			'|',
			'undo',
			'redo'
		],
		heading: headingConfig,
		image: imageConfig,
		table: tableConfig
	},

	rich: {
		plugins: [
			window.CKEditor5.alignment.Alignment,
			window.CKEditor5.autoformat.Autoformat,
			window.CKEditor5.basicStyles.Bold,
			window.CKEditor5.basicStyles.Italic,
			window.CKEditor5.blockQuote.BlockQuote,
			window.CKEditor5.codeBlock.CodeBlock,
			window.CKEditor5.essentials.Essentials,
			window.CKEditor5.font.FontSize,
			window.CKEditor5.font.FontColor,
			window.CKEditor5.font.FontBackgroundColor,
			window.CKEditor5.heading.Heading,
			window.CKEditor5.horizontalLine.HorizontalLine,
			window.CKEditor5.htmlEmbed.HtmlEmbed,
			window.CKEditor5.image.Image,
			window.CKEditor5.image.ImageCaption,
			window.CKEditor5.image.ImageStyle,
			window.CKEditor5.image.ImageToolbar,
			window.CKEditor5.image.ImageUpload,
			window.CKEditor5.image.ImageResize,
			window.CKEditor5.indent.Indent,
			window.CKEditor5.indent.IndentBlock,
			window.CKEditor5.list.List,
			window.CKEditor5.mediaEmbed.MediaEmbed,
			window.CKEditor5.paragraph.Paragraph,
			window.CKEditor5.pasteFromOffice.PasteFromOffice,
			window.CKEditor5.removeFormat.RemoveFormat,
			window.CKEditor5.table.Table,
			window.CKEditor5.table.TableToolbar,
			window.CKEditor5.table.TableProperties,
			window.CKEditor5.table.TableCellProperties,
			window.CKEditor5.table.TableColumnResize,
			window.CKEditor5.table.TableCaption,
			window.CKEditor5.wordCount.WordCount,
			window.CKEditor5.sourceEditing.SourceEditing,
			window.CKEditor5.markdownGfm.Markdown,
			StrapiMediaLib,
			StrapiInternalLink
		],
		toolbar: [
			'heading',
			'|',
			'bold',
			'italic',
			'strapiInternalLink',
			'fontSize',
			'fontColor',
			'fontBackgroundColor',
			'removeFormat',
			'|',
			'bulletedList',
			'numberedList',
			'|',
			'outdent',
			'indent',
			'alignment',
			'|',
			'strapiMediaLib',
			'mediaEmbed',
			'blockQuote',
			'insertTable',
			'horizontalLine',
			'codeBlock',
			'htmlEmbed',
			'|',
			'undo',
			'redo',
			'|',
			'sourceEditing'
		],
		heading: headingConfig,
		image: imageConfig,
		table: tableConfig,
		fontSize: {
			options: [9, 11, 13, 'default', 17, 19, 21, 27, 35],
			supportAllValues: false
		},
		fontColor: {
			columns: 5,
			documentColors: 10
		},
		fontBackgroundColor: {
			columns: 5,
			documentColors: 10
		}
	}
};

export default class Configurator {
	private fieldConfig: any;
	
	constructor(fieldConfig) {
		this.fieldConfig = fieldConfig;
	}

	getEditorConfig() {
		const config = this._getBaseConfig();

		if (this.fieldConfig.maxLength) {
			config.plugins.push(window.CKEditor5.maximumLength.MaximumLength);

			config.maximumLength = {
				characters: this.fieldConfig.maxLength
			};
		}

		return config;
	}

	_getBaseConfig() {
		const presetName = this.fieldConfig.options.preset;

		switch (presetName) {
			case 'markdown':
				return CKEDITOR_BASE_CONFIG_FOR_PRESETS.markdown;
			case 'light':
				return CKEDITOR_BASE_CONFIG_FOR_PRESETS.light;
			case 'standard':
				return CKEDITOR_BASE_CONFIG_FOR_PRESETS.standard;
			case 'rich':
				return CKEDITOR_BASE_CONFIG_FOR_PRESETS.rich;
			default:
				throw new Error('Invalid preset name ' + presetName);
		}
	}
}
