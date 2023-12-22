import { useQuery } from 'react-query';

import { useFetchClient } from '@strapi/helper-plugin';
import { Platform } from './platform';

const QUERY_KEY = 'platformRelations';

const fetchPlatformRelation = async ({
	fetchClient,
	id,
	uid,
	targetModel,
	hasPlatformField
}: Record<string, any> & UseGetPlatformRelationParams): Promise<Platform | undefined> => {
	try {
		if (!uid || !id || !hasPlatformField || targetModel !== 'api::platform.platform') {
			throw new Error('No uid or id');
		}

		const { get } = fetchClient;
		const result = await get(`/content-manager/relations/${uid}/${id}/platform?page=1&pageSize=5`);

		return result?.data?.data;
	} catch {
		return undefined;
	}
};

type UseGetPlatformRelationParams = {
	uid: string;
	id: string;
};

export const useGetPlatformRelation = (params: Record<string, any> & UseGetPlatformRelationParams) => {
	const fetchClient = useFetchClient();

	return useQuery<Platform | undefined, Error>([QUERY_KEY, params], () =>
		fetchPlatformRelation({
			...params,
			fetchClient
		})
	);
};
