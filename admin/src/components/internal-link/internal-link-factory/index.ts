import PropTypes from 'prop-types';
import { object, mixed, string, number } from 'yup';

export const INTERNAL_LINK_TYPE = {
	INTERNAL: 'internal',
	EXTERNAL: 'external'
};

export const internalLinkSchema = object({
	id: number().nullable().positive().integer(),
	sourceContentTypeUid: string().required(),
	sourceContentTypeId: number().positive().integer().required(),
	sourceFieldName: string().required(),
	targetContentTypeUid: string(),
	targetContentTypeId: number().positive().integer().required(),
	url: string().url().required(),
	text: string().required(),
	type: mixed().oneOf(Object.values(INTERNAL_LINK_TYPE)).defined(),
	domain: string()
});

export interface InternalLink {
	id: string | number;
	sourceContentTypeUid: string;
	sourceContentTypeId: string | number;
	sourcefieldName: string;
	targetContentTypeUid?: string;
	targetContentTypeId: string | number;
	url: string;
	text: string;
	type: 'internal' | 'external';
	domain?: string;
}

export const createInternalLink = (
	sourceContentTypeUid: string = '',
	sourceContentTypeId: string | null = null,
	sourceFieldName: string = '',
	initialText?: string
) => ({
	id: null,
	sourceContentTypeUid,
	sourceContentTypeId,
	sourceFieldName,
	targetContentTypeUid: '',
	targetContentTypeId: null,
	url: '',
	text: initialText || '',
	type: INTERNAL_LINK_TYPE.EXTERNAL,
	domain: 'https://gelderland.nl'
});

export default createInternalLink;
