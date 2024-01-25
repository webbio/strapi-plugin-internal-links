import { Common } from '@strapi/strapi';

export interface InternalLink {
	id: number | null;
	sourceContentTypeUid?: Common.UID.ContentType | null;
	sourceContentTypeId?: string | null;
	sourceFieldName?: string | null;
	targetContentTypeUid?: Common.UID.ContentType | null;
	targetContentTypeId?: string | null;
	url?: string | null;
	text?: string | null;
	type?: string | null;
	createdAt?: Date | null;
	updatedAt?: Date | null;
	urlAddition?: string | null;
}
