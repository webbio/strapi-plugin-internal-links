import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import debounce from 'lodash/debounce';
import objGet from 'lodash/get';
import { OptionProps, SingleValue, components } from 'react-select';
import { useCMEditViewDataManager, useFetchClient } from '@strapi/helper-plugin';
import { Flex, FieldLabel } from '@strapi/design-system';

import { Combobox, IReactSelectValue } from '../../Combobox';
import { getSearchFilteredEntities } from '../../../api/search-filtered-entity';
import { useGetLocaleFromUrl } from '../../../utils/use-get-locale-from-url';
import getTrad from '../../../utils/get-trad';
import { GlobalPluginConfig } from '../../../../../utils/config.types';
import { useGetEntity } from '../../../api/entity';
import { LocaleSelect } from './locale-select';
import { Label } from '../../label';
import { useGetStrapiLocales } from '../../../utils/use-get-strapi-locales';

import S from './styles';
import { IInternalLinkAttribute } from '../..';

const SEARCH_DEBOUNCE_MS = 150;
const PAGE = 1;

export interface PageReactSelectValue extends Omit<IReactSelectValue, 'initialSelected'> {
	id: number;
	href?: string;
	publicationState?: string | false;
	publishedAt?: string;
	path: string;
	locale: string;
	platform?: { domain?: string };
	subTitle?: string;
}

interface Props {
	selectedId?: number;
	uid?: string;
	platformTitle?: string;
	pluginConfig?: GlobalPluginConfig;
	onChange: (item?: SingleValue<PageReactSelectValue>) => void;
	attributeOptions?: IInternalLinkAttribute['options'];
}

export const PageSearch = ({ uid, selectedId, platformTitle, pluginConfig, onChange, attributeOptions }: Props) => {
	const { formatMessage } = useIntl();
	const fetchClient = useFetchClient();
	const form = useCMEditViewDataManager() as any;

	const {
		data: entityFromId,
		isLoading: isLoadingEntity,
		dataUpdatedAt
	} = useGetEntity({
		uid,
		id: selectedId,
		pageBuilderConfig: pluginConfig?.pageBuilder
	});

	const { defaultLocale } = useGetStrapiLocales();
	const urlLocale = useGetLocaleFromUrl();
	const [selectedLocale, setSelectedLocale] = React.useState<string | undefined>();

	const searchableFields =
		attributeOptions?.pageSearchOptions?.searchableFields || pluginConfig?.pageSearchOptions?.searchableFields;
	const subTitlePath =
		attributeOptions?.pageSearchOptions?.subTitlePath || pluginConfig?.pageSearchOptions?.subTitlePath;

	useEffect(() => {
		if (!selectedLocale && !isLoadingEntity && (dataUpdatedAt || !selectedId)) {
			setSelectedLocale(entityFromId?.locale || form.initialData?.locale || urlLocale || defaultLocale);
		}
	}, [entityFromId, defaultLocale]);

	const selectedPageFromId = mapSelectItem(entityFromId, subTitlePath);

	const isPagePageType = !uid;

	const getItems = async (inputValue?: string, platformTitle?: string): Promise<PageReactSelectValue[]> => {
		if (!selectedLocale) {
			return [];
		}

		const searchEntities = await getSearchFilteredEntities({
			fetchClient,
			page: PAGE,
			locale: selectedLocale,
			uid,
			searchQuery: inputValue,
			platformTitle,
			pluginConfig,
			searchableFields,
			subTitlePath
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
			locale: x.locale || '',
			subTitle: x.subTitle,
			startPointReference: x.startPointReference || ''
		}));
	};

	const handleChange = (item?: SingleValue<PageReactSelectValue>) => onChange(item);
	const handleLocaleChange = (locale?: string) => {
		onChange();
		setSelectedLocale(locale);
	};

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
		<Flex direction="column" width="100%">
			<Label>
				<FieldLabel required>
					{formatMessage({
						id: getTrad('internal-link.form.page')
					})}
				</FieldLabel>
			</Label>
			<Flex width="100%" gap={2}>
				<LocaleSelect
					onChange={handleLocaleChange}
					isDisabled={isPagePageType}
					value={selectedLocale}
					isLoadingValue={isLoadingEntity || (!dataUpdatedAt && Boolean(selectedId))}
				/>

				<Combobox
					key={`rerenderOnUidOrPlatformChange-${uid}-${platformTitle}-${selectedLocale}`}
					id="collectionTypeSearch"
					loadOptions={(i, c) => debouncedFetch(i, c, platformTitle)}
					cacheOptions
					// @ts-ignore onChange is correct
					onChange={handleChange}
					// @ts-ignore customOption is correct
					customOption={CustomOption}
					// @ts-ignore customOption is correct
					value={selectedPageFromId}
					defaultOptions={!isPagePageType}
					placeholder={formatMessage({
						id: getTrad('internal-link.form.page.placeholder')
					})}
					required
					isDisabled={isPagePageType}
				/>
			</Flex>
		</Flex>
	);
};

const CustomOption = (props: OptionProps<PageReactSelectValue, false>) => {
	return (
		<components.Option {...props}>
			<S.CustomOption>
				{props.data?.publicationState && <S.CustomOptionStatus publicationState={props.data?.publicationState} />}

				<Flex direction="column" alignItems="start" gap={0}>
					{props.children}
					{props.data?.subTitle && <S.CustomOptionSubTitle>{props.data?.subTitle}</S.CustomOptionSubTitle>}
				</Flex>
			</S.CustomOption>
		</components.Option>
	);
};

function mapSelectItem(
	initialValue?: Record<string, any>,
	subTitlePath?: string
): SingleValue<PageReactSelectValue | null> {
	return initialValue?.id
		? {
				id: initialValue.id,
				value: String(initialValue?.id),
				label: initialValue?.title ?? '',
				href: initialValue?.href,
				publicationState: initialValue.publicationState,
				publishedAt: initialValue.publishedAt,
				platform: initialValue.platform,
				path: initialValue.path || '',
				locale: initialValue.locale || '',
				subTitle: subTitlePath ? objGet(initialValue, subTitlePath) : '',
				startPointReference: initialValue.startPointReference
			}
		: null;
}
