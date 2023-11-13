export const INTERNAL_LINK_TYPE = {
	INTERNAL: 'internal',
	EXTERNAL: 'external'
} as const;

export interface IInternalLink {
	id: string | number | null;
	sourceContentTypeUid: string;
	sourceContentTypeId: string | number | null;
	sourceFieldName: string;
	targetContentTypeUid?: string;
	targetContentTypeId: string | number | null;
	url: string;
	text: string;
	type: (typeof INTERNAL_LINK_TYPE)[keyof typeof INTERNAL_LINK_TYPE];
	domain?: string;
}

export const createInternalLink = (
	sourceContentTypeUid: string = '',
	sourceContentTypeId: string | null = null,
	sourceFieldName: string = '',
	initialText?: string,
	initialLink?: string
): IInternalLink => ({
	id: null,
	sourceContentTypeUid,
	sourceContentTypeId,
	sourceFieldName,
	targetContentTypeUid: '',
	targetContentTypeId: null,
	url: initialLink || '',
	text: initialText || '',
	type: INTERNAL_LINK_TYPE.INTERNAL,
	domain: ''
});

export default createInternalLink;
