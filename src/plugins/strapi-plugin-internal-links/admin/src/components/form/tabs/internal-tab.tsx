import React from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../../utils/get-trad';
import { Label } from '../../label';
import { Field, FieldError, FieldInput, TabPanel, Box } from '@strapi/design-system';
import usePlatformOptions from '../hooks/use-platform-options';
import ReactSelect from 'react-select';
import { IInternalLinkErrors } from '../../input/use-internal-link-input';
import useContentTypeOptions, { IContentTypeOption } from '../hooks/use-content-type-options';
import { IInternalLink } from '../../factory';
import { PageSearch } from '../page-select';
import { IInternalLinkAttribute } from '../..';
import { Platform } from '../../../api/platform';
import { useGetConfig } from '../../../api/config';
import usePageOptions from '../hooks/use-page-options';
import Option from '../option';
import { useReactSelectCustomStyles } from '../../Combobox/react-select-custom-styles';
import { ClearIndicator, DropdownIndicator } from '../../Combobox';

interface Props {
	link: IInternalLink;
	shouldShowTitle?: boolean;
	isExternalTab?: boolean;
	errors: IInternalLinkErrors;
	attributeOptions?: IInternalLinkAttribute['options'];
	contentType?: IContentTypeOption;
	pageId?: number;
	onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onTextBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
	onPageChange: (id?: number, path?: string, domain?: string) => void;
	onUrlAdditionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onUrlAdditionBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
	onContentTypeChange: (value: IContentTypeOption) => void;
	onPlatformChange: (value: Platform) => void;
}

export const InternalTab = ({
	link,
	shouldShowTitle,
	pageId,
	errors,
	attributeOptions,
	contentType,
	onTextBlur,
	onTextChange,
	onPageChange,
	onUrlAdditionChange,
	onUrlAdditionBlur,
	onContentTypeChange,
	onPlatformChange
}: Props) => {
	const { formatMessage } = useIntl();
	const styles = useReactSelectCustomStyles();
	const { contentTypeOptions, contentTypeOptionsIsLoading, contentTypeOptionsIsFetching } = useContentTypeOptions(
		link.targetContentTypeUid
	);
	const { page, pageOptionsIsLoading } = usePageOptions(contentType, link.targetContentTypeId);
	const { data: pluginConfig, isLoading: isLoadingConfig } = useGetConfig({});
	const useSinglePageType = !!pluginConfig?.useSinglePageType || pluginConfig?.pageBuilder?.enabled;
	const pageBuilderEnabled = pluginConfig?.pageBuilder?.enabled;

	const { platform, platformOptions, platformOptionsIsLoading, platformOptionsIsFetching } = usePlatformOptions({
		page,
		pageOptionsIsLoading
	});

	const getLoadingMessage = () => {
		return formatMessage({
			id: getTrad('internal-link.loading')
		});
	};

	const getNoOptionsMessage = () => {
		return formatMessage({
			id: getTrad('internal-link.empty')
		});
	};

	return (
		<TabPanel>
			<Box color="neutral800" padding={4} background="neutral0">
				{shouldShowTitle && (
					<Field name="text" id="text" error={errors.text} required>
						<Label>
							{formatMessage({
								id: getTrad('internal-link.form.text')
							})}
						</Label>

						<FieldInput type="text" value={link.text} onChange={onTextChange} onBlur={onTextBlur} required />

						<FieldError />
					</Field>
				)}
				{pageBuilderEnabled && platformOptions.length > 1 && (
					<Box paddingTop={4}>
						<Field required>
							<Label>
								{formatMessage({
									id: getTrad('internal-link.form.platform')
								})}
							</Label>

							<ReactSelect
								inputId="platform"
								name="platform"
								value={platform}
								menuPosition="absolute"
								menuPlacement="auto"
								// @ts-ignore
								styles={styles}
								// @ts-ignore Option is of correct type
								components={{ Option, IndicatorSeparator: null, ClearIndicator, DropdownIndicator }}
								options={platformOptionsIsFetching ? [] : platformOptions}
								isLoading={platformOptionsIsLoading}
								isDisabled={!contentType || platformOptionsIsLoading}
								// @ts-ignore onChange is of correct type
								onChange={onPlatformChange}
								placeholder={
									platformOptionsIsLoading
										? formatMessage({
												id: getTrad('internal-link.loading')
											})
										: formatMessage({
												id: getTrad('internal-link.form.platform.placeholder')
											})
								}
								loadingMessage={getLoadingMessage}
								noOptionsMessage={getNoOptionsMessage}
								isSearchable
								// @ts-ignore isClear is of correct type
								isClear
							/>
						</Field>
					</Box>
				)}

				{!isLoadingConfig && !useSinglePageType && (
					<Box paddingTop={4}>
						<Field required>
							<Label>
								{formatMessage({
									id: getTrad('internal-link.form.collection')
								})}
							</Label>

							<ReactSelect
								inputId="collection"
								name="collection"
								value={contentType}
								menuPosition="absolute"
								menuPlacement="auto"
								// @ts-ignore
								styles={styles}
								// @ts-ignore Option is of correct type
								components={{ Option, IndicatorSeparator: null, ClearIndicator, DropdownIndicator }}
								options={contentTypeOptionsIsFetching ? [] : contentTypeOptions}
								isLoading={contentTypeOptionsIsLoading}
								isDisabled={contentTypeOptionsIsLoading}
								// @ts-ignore onChange is of correct type
								onChange={onContentTypeChange}
								placeholder={
									contentTypeOptionsIsLoading
										? formatMessage({
												id: getTrad('internal-link.loading')
											})
										: formatMessage({
												id: getTrad('internal-link.form.collection.placeholder')
											})
								}
								loadingMessage={getLoadingMessage}
								noOptionsMessage={getNoOptionsMessage}
								isSearchable
								// @ts-ignore isClear is of correct type
								isClear
							/>
						</Field>
					</Box>
				)}

				<Box paddingTop={4}>
					<PageSearch
						selectedId={pageId}
						uid={contentType?.uid}
						platformTitle={pageBuilderEnabled ? platform?.label : undefined}
						onChange={(value) => onPageChange(value?.id, value?.path, value?.platform?.domain)}
						pluginConfig={pluginConfig}
						attributeOptions={attributeOptions}
					/>
				</Box>

				{pluginConfig?.enableUrlAddition && (
					<Box paddingTop={4}>
						<Field name="urlAddition" id="urlAddition" error={errors.urlAddition}>
							<Label>
								{formatMessage({
									id: getTrad('internal-link.form.urlAddition')
								})}
							</Label>

							<FieldInput
								type="text"
								value={link?.urlAddition}
								onChange={onUrlAdditionChange}
								disabled={pageOptionsIsLoading || !link?.domain}
								onBlur={onUrlAdditionBlur}
							/>

							<FieldError />
						</Field>
					</Box>
				)}
			</Box>
		</TabPanel>
	);
};
