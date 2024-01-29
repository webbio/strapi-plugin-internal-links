import { useEffect, useState } from 'react';
import { useGetLocales } from '../api/locales';

export const useGetStrapiLocales = () => {
	const [defaultLocale, setDefaultLocale] = useState('');
	const { data: locales } = useGetLocales({});

	useEffect(() => {
		setDefaultLocale((locales || []).find((l: any) => l.isDefault)?.code || '');
	}, [locales]);

	return {
		defaultLocale,
		locales
	};
};
