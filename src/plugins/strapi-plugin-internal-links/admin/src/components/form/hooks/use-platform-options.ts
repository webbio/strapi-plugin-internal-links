import React, { useEffect, useState } from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { Platform, useGetPlatforms } from '../../../api/platform';
import { useGetPlatformRelation } from '../../../api/platform-relation';
import { IPageOption } from './use-page-options';

export interface IPlatformOption {
	id: number;
	label: string;
	value: string;
}

interface IUsePlatformOptions {
	page?: IPageOption;
	pageOptionsIsLoading?: boolean;
}

const mapPageData = (data: Platform[]): IPlatformOption[] => {
	const options = data.map((platform: Platform) => ({
		...platform,
		label: platform.title || '',
		value: String(platform.id)
	}));

	return options;
};

export const usePlatformOptions = ({ page, pageOptionsIsLoading }: IUsePlatformOptions) => {
	const { layout, initialData } = useCMEditViewDataManager() as any;
	const { isLoading: relatedPlatformIsLoading, data: relatedPlatform } = useGetPlatformRelation({
		id: initialData?.id,
		uid: layout.uid,
		targetModel: layout?.attributes?.platform?.target,
		hasPlatformField: Object(layout?.attributes || {}).hasOwnProperty('platform')
	});

	const { data: allPlatforms, isLoading, status, isFetching, isError } = useGetPlatforms({});

	const platformOptions = mapPageData(allPlatforms || []);

	const [platformId, setPlatformId] = useState<number | undefined>(page?.platform?.id);
	const platform = allPlatforms?.find((x) => x.id === Number(platformId));

	useEffect(() => {
		if (!platformId) {
			if (layout.uid === 'api::platform.platform') {
				setPlatformId(initialData?.id);
			} else if (!relatedPlatformIsLoading && relatedPlatform?.id && !page?.platform?.id && !pageOptionsIsLoading) {
				setPlatformId(relatedPlatform.id);
			} else if (page?.platform?.id) {
				setPlatformId(page.platform.id);
			}
		}
	}, [relatedPlatform, relatedPlatformIsLoading, page, pageOptionsIsLoading]);

	return {
		platform: mapPageData(platform ? [platform] : [])[0],
		platformId,
		setPlatformId,
		platformOptions,
		platformOptionsStatus: status,
		platformOptionsIsFetching: isFetching,
		platformOptionsIsLoading: isLoading || relatedPlatformIsLoading,
		platformOptionsIsError: isError
	};
};

export default usePlatformOptions;
