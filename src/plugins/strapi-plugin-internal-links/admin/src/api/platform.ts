import { useQuery } from 'react-query';

import { useFetchClient } from '@strapi/helper-plugin';

export type Platform = {
	id: number;
	title?: string;
};

const QUERY_KEY = 'platforms';

const fetchPlatforms = async ({ fetchClient }: Record<string, any>): Promise<Platform[]> => {
	try {
		const { get } = fetchClient;
		const result = await get('/content-manager/collection-types/api::platform.platform?page=1&pageSize=999');

		return result?.data?.results.map((entity: Record<string, any>) => ({
			id: entity.id,
			title: entity.title
		}));
	} catch {
		return [];
	}
};

export const useGetPlatforms = (params: Record<string, any>) => {
	const fetchClient = useFetchClient();

	return useQuery<Platform[], Error>([QUERY_KEY, params], () =>
		fetchPlatforms({
			...params,
			fetchClient
		})
	);
};
