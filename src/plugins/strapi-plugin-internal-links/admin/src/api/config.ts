import { useQuery } from 'react-query';

import { useFetchClient } from '@strapi/helper-plugin';
import getRequestUrl from '../utils/get-request-url';
import { GlobalPluginConfig } from '../../../utils/config.types';

const QUERY_KEY = 'config';

const fetchConfig = async ({ fetchClient }: Record<string, any>): Promise<GlobalPluginConfig | undefined> => {
	try {
		const { get } = fetchClient;
		const { data } = await get(getRequestUrl('config'));

		return data;
	} catch {
		return undefined;
	}
};

export const useGetConfig = (params: Record<string, any>) => {
	const fetchClient = useFetchClient();

	return useQuery<GlobalPluginConfig | undefined, Error>([QUERY_KEY], () =>
		fetchConfig({
			...params,
			fetchClient
		})
	);
};
