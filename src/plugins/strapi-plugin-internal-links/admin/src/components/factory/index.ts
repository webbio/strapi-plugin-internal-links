export const INTERNAL_LINK_TYPE = {
	INTERNAL: 'internal',
	EXTERNAL: 'external',
	SOURCE: 'source'
} as const;

export interface IInternalLink {
	id: string | number | null;
	sourceContentTypeUid: string;
	sourceContentTypeId: string | number | null;
	sourceFieldName: string;
	targetContentTypeUid?: string;
	targetContentTypeId: string | number | null;
	externalApiLabel?: string;
	startPointReference?: string;
	decisionTreeId?: number;
	url: string;
	text: string;
	type: (typeof INTERNAL_LINK_TYPE)[keyof typeof INTERNAL_LINK_TYPE];
	domain?: string;
	urlAddition?: string;
	externalApiValue?: string;
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
	domain: '',
	urlAddition: '',
	externalApiLabel: '',
	externalApiValue: ''
});

export default createInternalLink;
