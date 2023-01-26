import { useQuery } from 'react-query';
import axios from '../../../../utils/axiosInstance';
import pluginId from '../../../../plugin-id';

export interface IContentTypeOption {
	uid: string;
	kind: 'collectionType' | 'singleType';
	displayName: string;
	titleField: string;
	slugField: string;
	basePath: string;
	domain?: string;
}

const fetchContentTypeOptions = async (): Promise<IContentTypeOption[]> => {
	const { data }: { data: IContentTypeOption[] } = await axios.get(`/${pluginId}/content-types`);

	const options = data.map((item) => ({
		...item,
		label: item.displayName,
		value: String(item.uid),
		slugLabel: item.basePath || ''
	}));

	return options;
};

export const useContentTypeOptions = () => {
	const { data, status, isLoading, isFetching, isError } = useQuery(['content-type-options'], fetchContentTypeOptions);

	return {
		contentTypeOptions: data,
		contentTypeOptionsStatus: status,
		contentTypeOptionsIsFetching: isFetching,
		contentTypeOptionsIsLoading: isLoading,
		contentTypeOptionsIsError: isError
	};
};

export default useContentTypeOptions;
