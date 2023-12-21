import { useFetchClient } from '@strapi/helper-plugin';
import { useEffect, useState } from 'react';
import getRequestUrl from './get-request-url';
import { GlobalPluginConfig } from '../../../utils/config.types';

export const useGetPluginConfig = () => {
	const { get } = useFetchClient();
	const [config, setConfig] = useState<GlobalPluginConfig | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getConfig();
	}, []);

	const getConfig = async () => {
		setIsLoading(true);
		const { data } = await get(getRequestUrl('config'));

		setConfig(data);
		setIsLoading(false);
	};

	return {
		config,
		isLoading
	};
};
