import { useQuery } from 'react-query';

import { useFetchClient } from '@strapi/helper-plugin';

const QUERY_KEY = 'locales';

export type Locale = {
	id: number;
	code: string;
	name?: string;
	isDefault?: boolean;
	createdAt?: string;
	updatedAt?: string;
};

export const fetchLocales = async ({ fetchClient }: Record<string, any>): Promise<Locale[] | undefined> => {
	try {
		const { get } = fetchClient;
		const { data } = await get('i18n/locales');

		return data;
	} catch {
		return undefined;
	}
};

export const useGetLocales = (params: Record<string, any>) => {
	const fetchClient = useFetchClient();

	return useQuery<Locale[] | undefined, Error>([QUERY_KEY], () =>
		fetchLocales({
			...params,
			fetchClient
		})
	);
};
