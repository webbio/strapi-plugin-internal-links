import { useState } from 'react';
import { useQuery } from 'react-query';
import trim from 'lodash/trim';

import { useFetchClient } from '@strapi/helper-plugin';

import { IContentTypeOption } from './use-content-type-options';
import pluginId from '../../../plugin-id';
import { useGetStrapiLocales } from '../../../utils/use-get-strapi-locales';

export interface IPageOption {
	id: number;
	label: string;
	value: string;
	slugLabel: string;
	showIndicator: boolean;
	locale: string;
	platform?: { id: number; domain?: string };
}

// Single- and collection type data not typed in Strapi
const mapPageData = (
	data: Record<string, any>,
	contentType: IContentTypeOption,
	defaultLocale: string
): IPageOption[] => {
	const options = data.map((item: any) => {
		const titlePath = contentType.titleField.split('.');
		const locale = item.locale && item.locale !== defaultLocale ? `${item.locale}` : '';
		const label =
			titlePath.length < 2
				? item[contentType.titleField]
				: titlePath.reduce((previousValue, currentValue) => previousValue[currentValue], item);

		const slugField = item?.[contentType?.slugField] === '/' ? '' : item[contentType?.slugField] || '';

		return {
			...item,
			label,
			value: String(item.id),
			slugLabel: contentType?.slugField ? trim(`${locale}/${slugField}`, '/') : '',
			showIndicator: true
		};
	});

	return options;
};

const fetchPageOptions = async (
	defaultLocale: string,
	fetchClient?: any,
	contentType?: IContentTypeOption
): Promise<IPageOption[]> => {
	if (!contentType) return [];

	const type = contentType.kind === 'singleType' ? 'single-type' : 'collection-type';
	const { data } = await fetchClient.get(`/${pluginId}/${type}/${contentType.uid}`);

	return mapPageData(data, contentType, defaultLocale);
};

export const usePageOptions = (contentType?: IContentTypeOption, initialId?: string | number | null) => {
	const { defaultLocale } = useGetStrapiLocales();
	const fetchClient = useFetchClient();

	const { data, status, isLoading, isFetching, isError } = useQuery(
		['page-options', contentType, defaultLocale],
		() => fetchPageOptions(defaultLocale, fetchClient, contentType),
		{ enabled: Boolean(defaultLocale) }
	);

	const [pageId, setPageId] = useState<number | undefined>(Number(initialId));
	const page = data?.find((item) => item.id === pageId);

	return {
		page,
		pageId,
		setPageId,
		pageOptions: data,
		pageOptionsStatus: status,
		pageOptionsIsFetching: isFetching,
		pageOptionsIsLoading: isLoading,
		pageOptionsIsError: isError
	};
};

export default usePageOptions;
