import { useState } from 'react';
import { useQuery } from 'react-query';

import { useFetchClient } from '@strapi/helper-plugin';

import { IContentTypeOption } from './use-content-type-options';
import pluginId from '../../../plugin-id';
import { useGetDefaultStrapiLocale } from '../../../utils/use-get-default-locale';

export interface IPageOption {
	id: number;
	label: string;
	value: string;
	slugLabel: string;
	showIndicator: boolean;
	locale: string;
}

// Single- and collection type data not typed in Strapi
const mapPageData = (
	data: Record<string, any>,
	contentType: IContentTypeOption,
	defaultLocale: string
): IPageOption[] => {
	const options = data.map((item: any) => {
		const titlePath = contentType.titleField.split('.');
		const locale = item.locale && item.locale !== defaultLocale ? `${item.locale}/` : '';
		const label =
			titlePath.length < 2
				? item[contentType.titleField]
				: titlePath.reduce((previousValue, currentValue) => {
						return previousValue[currentValue];
				  }, item);

		return {
			...item,
			label,
			value: String(item.id),
			slugLabel: contentType?.slugField ? `${locale}${item[contentType?.slugField] || ''}` : '',
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
	const { defaultLocale } = useGetDefaultStrapiLocale();
	const fetchClient = useFetchClient();

	const { data, status, isLoading, isFetching, isError } = useQuery(['page-options', contentType], () =>
		fetchPageOptions(defaultLocale, fetchClient, contentType)
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
