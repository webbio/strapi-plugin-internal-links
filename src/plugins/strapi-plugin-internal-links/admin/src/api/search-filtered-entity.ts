import { useQuery, UseQueryOptions } from 'react-query';
import objGet from 'lodash/get';
import qs from 'qs';
import Fuse from 'fuse.js';

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
		publicationState?: string | false;
		publishedAt?: string;
		path: string;
		platform?: { domain?: string };
		locale?: string;
		subTitle?: string;
		startPointReference?: string;
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
	pluginConfig?: GlobalPluginConfig;
	searchableFields?: string[];
	subTitlePath?: string;
	mainFieldName?: string;
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
	pluginConfig,
	searchableFields = ['title'],
	subTitlePath,
	mainFieldName = 'title'
}: SearchFilteredEntitiesQueryParams): Promise<SearchFilteredEntitiesResult> => {
	try {
		if (!uid) {
			throw new Error('No Uid field');
		}

		const { get } = fetchClient;
		const notIdFilters = notIds && notIds.length > 0 ? notIds.map((id) => ({ id: { $ne: id } })) : [];

		const fieldFilters = searchableFields.map((field) => ({ [field]: { $containsi: searchQuery } }));

		const filters = qs.stringify({
			page,
			pageSize: 20,
			locale,
			// _q is a fuzzy search with sometimes unexpected results
			// _q: searchQuery || undefined,
			filters: {
				$and: [
					platformTitle && { platform: { title: { $eq: platformTitle || undefined } } },
					{
						$or: fieldFilters
					},
					...notIdFilters
				].filter(Boolean)
			}
		});

		const { data } = await get(`/content-manager/collection-types/${uid}?${filters}`);

		let results = data.results;

		if (searchQuery) {
			const fuse = new Fuse(data.results, {
				keys: searchableFields
			});

			const fuseSearch = fuse.search(searchQuery);

			if (fuseSearch && fuseSearch.length > 0) {
				results = fuseSearch.map((r) => r.item);
			}
		}

		const pathField = pluginConfig?.pageBuilder?.pathField || DEFAULT_PAGEBUILDER_PATH_FIELD;

		const mapResults = results.map((result: Record<string, any>): SearchFilteredEntitiesResult['results'][number] => {
			const getPublicationState = () => {
				if (result?.publishedAt !== undefined) {
					return result?.publishedAt ? 'published' : 'draft';
				}

				return false;
			};

			const subTitle = subTitlePath ? objGet(result, subTitlePath) : undefined;

			return {
				id: result.id,
				title: result?.[mainFieldName],
				publicationState: getPublicationState(),
				publishedAt: result?.publishedAt,
				href: `/content-manager/collectionType/${uid}/${result.id}`,
				path: result?.[pathField] || '',
				platform: result?.platform,
				locale: result?.locale,
				subTitle: typeof subTitle === 'string' || typeof subTitle === 'number' ? String(subTitle) : ''
			};
		});

		return {
			pagination: data.pagination,
			results: mapResults
		};
	} catch (e) {
		console.error(e);
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
