import { useFetchClient } from '@strapi/helper-plugin';
import { useEffect, useState } from 'react';

export const useGetDefaultStrapiLocale = () => {
	const { get } = useFetchClient();
	const [defaultLocale, setDefaultLocale] = useState('');

	useEffect(() => {
		getDefaultLocale();
	}, []);

	const getDefaultLocale = async () => {
		const { data } = await get('i18n/locales');

		setDefaultLocale(data.find((l: any) => l.isDefault)?.code || '');
	};

	return {
		defaultLocale
	};
};
