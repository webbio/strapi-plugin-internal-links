import { useQuery, UseQueryOptions } from 'react-query';
import orderBy from 'lodash/orderBy';

import { useFetchClient } from '@strapi/helper-plugin';
import { GlobalPluginConfig } from '../../../utils/config.types';
import { DEFAULT_PAGEBUILDER_PATH_FIELD } from '../utils/constants';

export type SearchFilteredEntitiesResult = {
	pagination: {
		page: number;
		pageCount: number;
		pageSize: number;
		total: number;
	};
	results: {
		id: number;
		title: string;
		href: string;
		publicationState?: string;
		publishedAt?: string;
		path: string;
		platform?: { domain?: string };
		locale?: string;
	}[];
};

type SearchFilteredEntitiesQueryParams = {
	fetchClient?: any;
	uid?: string;
	page: number;
	locale: string;
	searchQuery?: string;
	platformTitle?: string;
	notIds?: number[];
	pageBuilderConfig?: GlobalPluginConfig['pageBuilder'];
};

const QUERY_KEY = 'filteredEntities';

export const getSearchFilteredEntities = async ({
	fetchClient,
	uid,
	page,
	locale,
	searchQuery,
	platformTitle,
	notIds,
	pageBuilderConfig
}: SearchFilteredEntitiesQueryParams): Promise<SearchFilteredEntitiesResult> => {
	try {
		if (!uid) {
			throw new Error('No Uid field');
		}

		const { get } = fetchClient;
		const searchParams = new URLSearchParams();
		searchParams.append('page', String(page));
		searchParams.append('pageSize', '999');

		if (locale) {
			searchParams.append('locale', locale);
		}

		if (searchQuery) {
			searchParams.delete('sort');
			searchParams.append('sort', 'title:ASC');
			searchParams.append('_q', searchQuery);
		}

		if (platformTitle) {
			searchParams.append('filters[$and][0][platform][title][$contains]', String(platformTitle));
		}

		if (notIds && notIds.length > 0) {
			for (let index = 0; index < notIds.length; index++) {
				const id = notIds[index];
				searchParams.append(`filters[$and][${index + 1}][id][$ne]`, String(id));
			}
		}

		const { data } = await get(`/content-manager/collection-types/${uid}?${searchParams.toString()}`);
		const pathField = pageBuilderConfig?.pathField || DEFAULT_PAGEBUILDER_PATH_FIELD;

		const mapResults = data.results.map(
			(result: Record<string, any>): SearchFilteredEntitiesResult['results'][number] => ({
				id: result.id,
				title: result.title,
				publicationState: result?.publishedAt ? 'published' : 'draft',
				publishedAt: result?.publishedAt,
				href: `/content-manager/collectionType/${uid}/${result.id}`,
				path: result?.[pathField] === '/' ? '' : result?.[pathField] || '',
				platform: result?.platform,
				locale: result?.locale
			})
		);

		return {
			pagination: data.pagination,
			results: orderBy(mapResults, ['title'], ['asc'])
		};
	} catch (e) {
		return {
			pagination: { page: 1, pageCount: 0, pageSize: 0, total: 0 },
			results: []
		};
	}
};

export const useSearchFilteredEntities = (
	params: SearchFilteredEntitiesQueryParams,
	options?: UseQueryOptions<SearchFilteredEntitiesResult, Error>
) => {
	const fetchClient = useFetchClient();

	return useQuery<SearchFilteredEntitiesResult, Error>(
		[QUERY_KEY, params],
		() =>
			getSearchFilteredEntities({
				...params,
				fetchClient
			}),
		options
	);
};
