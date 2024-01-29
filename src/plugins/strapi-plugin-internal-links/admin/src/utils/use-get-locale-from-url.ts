import { useQueryParams } from '@strapi/helper-plugin';

const useGetLocaleFromUrl = (): string => {
	const [{ query }] = useQueryParams() as any;

	return query?.plugins?.i18n?.locale;
};

export { useGetLocaleFromUrl };
