import { useState } from 'react';
import { IContentTypeOption } from './use-content-type-options';

import { useQuery } from 'react-query';
import axios from '../../../../utils/axiosInstance';
import pluginId from '../../../../plugin-id';

export interface IPageOption {
	id: number;
	label: string;
	value: string;
	slugLabel: string;
	showIndicator: boolean;
	locale: string;
}

// Single- and collection type data not typed in Strapi
const mapPageData = (data: any, contentType: IContentTypeOption): IPageOption[] => {
	const options = data.map((item: any) => {
		const titlePath = contentType.titleField.split('.');
		const locale = item.locale && item.locale !== 'nl' ? `${item.locale}/` : '';
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

const fetchPageOptions = async (contentType?: IContentTypeOption): Promise<IPageOption[]> => {
	if (!contentType) return [];

	const type = contentType.kind === 'singleType' ? 'single-type' : 'collection-type';
	const { data } = await axios.get(`/${pluginId}/${type}/${contentType.uid}`);

	return mapPageData(data, contentType);
};

export const usePageOptions = (contentType?: IContentTypeOption, initialId?: string | number | null) => {
	const { data, status, isLoading, isFetching, isError } = useQuery(['page-options', contentType], () =>
		fetchPageOptions(contentType)
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
