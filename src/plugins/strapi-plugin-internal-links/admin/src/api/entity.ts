import { useQuery } from 'react-query';

import { useFetchClient } from '@strapi/helper-plugin';
import { SearchFilteredEntitiesResult } from './search-filtered-entity';
import { GlobalPluginConfig } from '../../../utils/config.types';
import { DEFAULT_PAGEBUILDER_PATH_FIELD } from '../utils/constants';

export type Entity = {} & SearchFilteredEntitiesResult['results'][number];

export type FetchEntityProps = {
	fetchClient: any;
} & UseGetEntityProps;

export type UseGetEntityProps = {
	id?: number;
	uid?: string;
	pageBuilderConfig?: GlobalPluginConfig['pageBuilder'];
};

const QUERY_KEY = 'entity';

const fetchEntity = async ({
	fetchClient,
	id,
	uid,
	pageBuilderConfig
}: FetchEntityProps): Promise<Entity | undefined> => {
	try {
		if (!id || !uid) {
			throw new Error('No id or uid');
		}

		const { get } = fetchClient;
		const result = await get(`/content-manager/collection-types/${uid}/${id}`);

		const pathField = pageBuilderConfig?.pathField || DEFAULT_PAGEBUILDER_PATH_FIELD;
		return {
			id: result?.data.id as number,
			title: result?.data.title,
			publicationState: result?.data?.publishedAt ? 'published' : 'draft',
			publishedAt: result?.data?.publishedAt,
			href: `/content-manager/collectionType/${uid}/${result.id}`,
			path: result?.data?.[pathField] === '/' ? '' : result?.data?.[pathField] || '',
			platform: result?.data?.platform,
			locale: result?.data?.locale
		};
	} catch {
		return undefined;
	}
};

export const useGetEntity = (params: UseGetEntityProps) => {
	const fetchClient = useFetchClient();

	return useQuery<Entity | undefined, Error>(
		[QUERY_KEY, params.uid, params.id],
		() =>
			fetchEntity({
				...params,
				fetchClient
			}),
		{ enabled: Boolean(params.id && params.uid) }
	);
};
