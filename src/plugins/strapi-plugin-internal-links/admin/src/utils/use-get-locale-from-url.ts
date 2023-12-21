import { useQueryParams } from '@strapi/helper-plugin';

const useGetLocaleFromUrl = () => {
	const [{ query }] = useQueryParams() as any;

	return query?.plugins?.i18n?.locale;
};

export { useGetLocaleFromUrl };
