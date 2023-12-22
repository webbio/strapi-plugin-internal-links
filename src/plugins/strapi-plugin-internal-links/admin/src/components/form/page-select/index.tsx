import React from 'react';
import { useIntl } from 'react-intl';
import debounce from 'lodash/debounce';
import { OptionProps, SingleValue, components } from 'react-select';
import { useCMEditViewDataManager, useFetchClient } from '@strapi/helper-plugin';

import { Combobox, IReactSelectValue } from '../../Combobox';
import { getSearchFilteredEntities } from '../../../api/search-filtered-entity';
import { useGetLocaleFromUrl } from '../../../utils/use-get-locale-from-url';
import { useGetDefaultStrapiLocale } from '../../../utils/use-get-default-locale';

import S from './styles';
import getTrad from '../../../utils/get-trad';
import { GlobalPluginConfig } from '../../../../../utils/config.types';
import { useGetEntity } from '../../../api/entity';

const SEARCH_DEBOUNCE_MS = 150;
const PAGE = 1;

export interface PageReactSelectValue extends Omit<IReactSelectValue, 'initialSelected'> {
	id: number;
	href?: string;
	publicationState?: string;
	publishedAt?: string;
	path: string;
	locale: string;
	platform?: { domain?: string };
}

interface Props {
	selectedId?: number;
	uid?: string;
	platformTitle?: string;
	pageBuilderConfig?: GlobalPluginConfig['pageBuilder'];
	onChange: (item?: SingleValue<PageReactSelectValue>) => void;
}

export const PageSearch = ({ uid, selectedId, platformTitle, pageBuilderConfig, onChange }: Props) => {
	const { formatMessage } = useIntl();
	const fetchClient = useFetchClient();
	const form = useCMEditViewDataManager() as any;

	const urlLocale = useGetLocaleFromUrl();
	const { defaultLocale } = useGetDefaultStrapiLocale();
	const selectedLocale = form.initialData?.locale ?? urlLocale ?? defaultLocale;
	const { data: entityFromId } = useGetEntity({
		uid,
		id: selectedId,
		pageBuilderConfig
	});

	const selectedPageFromId = mapSelectItem(entityFromId);

	const isPagePageType = !uid;
	const searchEntitiesIsEnabled = !isPagePageType;

	const getItems = async (inputValue?: string, platformTitle?: string): Promise<PageReactSelectValue[]> => {
		const searchEntities = await getSearchFilteredEntities({
			fetchClient,
			page: PAGE,
			locale: selectedLocale,
			uid,
			searchQuery: inputValue,
			platformTitle,
			pageBuilderConfig
		});

		return searchEntities.results.map((x) => ({
			id: x.id,
			value: String(x.id),
			label: x.title,
			href: x?.href,
			publicationState: x.publicationState,
			publishedAt: x.publishedAt,
			path: x.path,
			platform: x.platform,
			locale: x.locale || ''
		}));
	};

	const handleChange = (item?: SingleValue<PageReactSelectValue>) => onChange(item);

	const debouncedFetch = debounce((searchTerm, callback, selectedPlatformTitle?: string) => {
		promiseOptions(searchTerm, selectedPlatformTitle).then((result) => {
			return callback(result || []);
		});
	}, SEARCH_DEBOUNCE_MS);

	const promiseOptions = (inputValue: string, selectedPlatformTitle?: string): Promise<PageReactSelectValue[]> =>
		new Promise<PageReactSelectValue[]>((resolve) => {
			resolve(getItems(inputValue, selectedPlatformTitle));
		});

	return (
		<Combobox
			key={`rerenderOnUidOrPlatformChange-${uid}-${platformTitle}`}
			id="collectionTypeSearch"
			label={formatMessage({
				id: getTrad('internal-link.form.page')
			})}
			loadOptions={(i, c) => debouncedFetch(i, c, platformTitle)}
			cacheOptions
			// @ts-ignore onChange is correct
			onChange={handleChange}
			// @ts-ignore customOption is correct
			customOption={CustomOption}
			// @ts-ignore customOption is correct
			value={selectedPageFromId}
			defaultOptions={searchEntitiesIsEnabled}
			placeholder={formatMessage({
				id: getTrad('internal-link.form.page.placeholder')
			})}
			required
			isDisabled={!uid}
		/>
	);
};

const CustomOption = (props: OptionProps<PageReactSelectValue, false>) => {
	return (
		<components.Option {...props}>
			<S.CustomOption>
				<S.CustomOptionStatus publicationState={props.data?.publicationState} />
				{props.children}
			</S.CustomOption>
		</components.Option>
	);
};

const mapSelectItem = (initialValue?: Record<string, any>): SingleValue<PageReactSelectValue | null> =>
	initialValue?.id
		? {
				id: initialValue.id,
				value: String(initialValue?.id),
				label: initialValue?.title ?? '',
				href: initialValue?.href,
				publicationState: initialValue.publicationState,
				publishedAt: initialValue.publishedAt,
				platform: initialValue.platform,
				path: initialValue.path || '',
				locale: initialValue.locale || ''
		  }
		: null;
