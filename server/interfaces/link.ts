export interface InternalLink {
	id: number;
	sourceContentTypeUid?: string | null;
	sourceContentTypeId?: string | null;
	sourceFieldName?: string | null;
	targetContentTypeUid?: string | null;
	targetContentTypeId?: string | null;
	url?: string | null;
	text?: string | null;
	type?: string | null;
	createdAt?: Date | null;
	updatedAt?: Date | null;
}
