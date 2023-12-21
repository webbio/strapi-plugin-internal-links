import React, { useState, useLayoutEffect, useEffect, ChangeEvent } from 'react';
import * as yup from 'yup';
import { useIntl } from 'react-intl';
import { ReactSelect } from '@strapi/helper-plugin';
import { Alert, ToggleCheckbox, Stack, Button, FieldLabel, Field, FieldError, FieldInput } from '@strapi/design-system';

import Option from './option';
import useContentTypeOptions, { IContentTypeOption } from './hooks/use-content-type-options';
import usePageOptions, { IPageOption } from './hooks/use-page-options';
import getTrad from '../../utils/get-trad';
import { INTERNAL_LINK_TYPE } from '../factory';
import { IUseInternalLinkInputReturn } from '../input/use-internal-link-input';
import { useGetPluginConfig } from '../../utils/use-get-plugin-config';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { useGetPlatformRelation } from '../../api/platform-relation';
import usePlatformOptions from './hooks/use-platform-options';
import { PageReactSelectValue, PageSearch } from './page-select';
import { SingleValue } from 'react-select';
import { Platform } from '../../api/platform';

interface IProps extends Omit<IUseInternalLinkInputReturn, 'initialLink' | 'isInitialData' | 'resetInternalLink'> {
	attribute?: {
		'link-regex'?: string;
	};
}

const InternalLinkForm = ({ link, setLink, errors, setErrors, attribute, ...rest }: IProps): JSX.Element => {
	const { formatMessage } = useIntl();
	const { config: pluginConfig, isLoading: isLoadingConfig } = useGetPluginConfig();
	const useSinglePageType = !!pluginConfig?.useSinglePageType || pluginConfig?.pageBuilder?.enabled;
	const pageBuilderEnabled = pluginConfig?.pageBuilder?.enabled;

	// More information including tests: https://regexr.com/7b2ai
	const defaultUrlRegex = new RegExp(
		/(^https?:\/\/(www.)?[a-zA-Z0-9]{1,}.[^s]{2,}((\/[a-zA-Z0-9\-\_\=\?\%\&\#]{1,}){1,})?)$|^mailto:[\w-\. +]+@([\w-]+\.)+[\w-]{2,4}$|^tel:((\+|00(\s|\s?\-\s?)?)[0-9]{2}(\s|\s?\-\s?)?(\(0\)[\-\s]?)?|0)[0-9](((\s|\s?\-\s?)?[0-9]){1,})$/
	);

	const {
		contentType,
		setContentTypeUid,
		contentTypeOptions,
		contentTypeOptionsIsLoading,
		contentTypeOptionsIsFetching
	} = useContentTypeOptions(link.targetContentTypeUid);

	const { page, pageId, setPageId, pageOptions, pageOptionsIsLoading, pageOptionsIsFetching } = usePageOptions(
		contentType,
		link.targetContentTypeId
	);
	const { platform, setPlatformId, platformOptions, platformOptionsIsLoading, platformOptionsIsFetching } =
		usePlatformOptions({ page });

	const [checked, setChecked] = useState<boolean>(link.type === 'external');
	const translationLinkKey = !checked ? 'generated-link' : 'link';

	const onToggleCheckbox = (): void => {
		setChecked((prev) => !prev);
		setErrors((previousValue) => ({
			...previousValue,
			link: undefined,
			url: undefined
		}));
		setLink((previousValue) => ({
			...previousValue,
			type:
				previousValue.type === INTERNAL_LINK_TYPE.INTERNAL ? INTERNAL_LINK_TYPE.EXTERNAL : INTERNAL_LINK_TYPE.INTERNAL
		}));
	};

	useEffect(() => {
		if (pluginConfig && useSinglePageType) {
			setContentTypeUid(pluginConfig.pageBuilder?.pageUid || pluginConfig.useSinglePageType);
		}
	}, [pluginConfig]);

	const onContentTypeChange = (value: IContentTypeOption) => {
		setPageId(undefined);
		setContentTypeUid(value.uid);
	};

	const onPageChange = (id?: number, path?: string, domain?: string) => {
		if (!contentType) return;
		console.log('onPageChange', id, path, domain);
		setPageId(id);
		setLink((previousValue) => ({
			...previousValue,
			targetContentTypeUid: id ? contentType.uid : '',
			targetContentTypeId: id || null,
			url: [domain, path].filter(Boolean).join('/')
		}));
	};

	const onLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (link.targetContentTypeUid) {
			event.preventDefault;
			setErrors((previousValue) => ({
				...previousValue,
				link: formatMessage({
					id: getTrad(`internal-link.form.link.placeholder`)
				})
			}));
		} else {
			setLink((value) => ({ ...value, url: event.target.value }));
		}

		setErrors((previousValue) => ({
			...previousValue,
			url: undefined
		}));
	};

	const onLinkBlur = async (event: ChangeEvent<HTMLInputElement>) => {
		const linkRegex = attribute?.['link-regex'];
		const regexObject = linkRegex ? new RegExp(linkRegex) : defaultUrlRegex;
		const newValue = event.target.value;
		const urlSchema = yup.string().required().matches(regexObject);

		if (newValue) {
			try {
				await urlSchema.validate(event.target.value);
				setErrors((previousValue) => ({
					...previousValue,
					url: undefined
				}));
			} catch {
				setErrors((previousValue) => ({
					...previousValue,
					url: formatMessage({
						id: getTrad(`internal-link.form.link.error`)
					})
				}));
			}
		} else {
			setErrors((previousValue) => ({
				...previousValue,
				url: formatMessage({
					id: getTrad(`internal-link.form.link.placeholder`)
				})
			}));
		}
	};

	const onReset = () => {
		setContentTypeUid(undefined);
		setPageId(undefined);

		setErrors((previousValue) => ({
			...previousValue,
			link: undefined
		}));

		setLink((previousValue) => ({
			...previousValue,
			id: null,
			targetContentTypeUid: '',
			targetContentTypeId: null
		}));
	};

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

	const onTextBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
		const newValue = event.target.value;

		if (newValue) {
			try {
				// If the text doesn't parse as JSON we cannot save the link.
				JSON.parse(JSON.stringify({ text: newValue }));
				setErrors((previousValue) => ({
					...previousValue,
					text: undefined
				}));
			} catch {
				setErrors((previousValue) => ({
					...previousValue,
					text: formatMessage({
						id: getTrad(`internal-link.form.text.error`)
					})
				}));
			}
		} else {
			setErrors((previousValue) => ({
				...previousValue,
				text: formatMessage({
					id: getTrad('internal-link.form.text.required')
				})
			}));
		}
	};

	console.log('Link', page);

	const onPlatformChange = (value?: Platform) => {
		// Why is the platform still wrong?
		// setPlatformId(value?.id);
		onPageChange();
	};

	const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLink((value) => ({ ...value, text: (event.target satisfies HTMLInputElement).value }));
	};

	useLayoutEffect(() => {
		setChecked(link.type === 'external');
	}, []);

	useEffect(() => {
		if (page?.platform?.domain || contentType?.domain) {
			setLink((previousValue) => ({
				...previousValue,
				domain: page?.platform?.domain || contentType?.domain
			}));
		}
	}, [contentType?.domain, page]);

	return (
		<Stack spacing={6}>
			<ToggleCheckbox
				checked={checked}
				onChange={onToggleCheckbox}
				onLabel={formatMessage({
					id: getTrad('internal-link.form.type.external')
				})}
				offLabel={formatMessage({
					id: getTrad('internal-link.form.type.internal')
				})}
			>
				{formatMessage({
					id: getTrad('internal-link.form.type')
				})}
			</ToggleCheckbox>

			<Field name="text" id="text" error={errors.text} required>
				<FieldLabel>
					{formatMessage({
						id: getTrad('internal-link.form.text')
					})}
				</FieldLabel>

				<FieldInput type="text" value={link.text} onChange={onTextChange} onBlur={onTextBlur} required />

				<FieldError />
			</Field>

			{!checked && !isLoadingConfig && !useSinglePageType && (
				<Field required>
					<FieldLabel>
						{formatMessage({
							id: getTrad('internal-link.form.collection')
						})}
					</FieldLabel>

					<ReactSelect
						inputId="collection"
						name="collection"
						value={contentType}
						menuPosition="absolute"
						menuPlacement="auto"
						// @ts-ignore Option is of correct type
						components={{ Option }}
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
			)}

			{!checked && pageBuilderEnabled && platformOptions.length > 1 && (
				<Field required>
					<FieldLabel>
						{formatMessage({
							id: getTrad('internal-link.form.platform')
						})}
					</FieldLabel>

					<ReactSelect
						inputId="platform"
						name="platform"
						value={platform}
						menuPosition="absolute"
						menuPlacement="auto"
						// @ts-ignore Option is of correct type
						components={{ Option }}
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
			)}

			{!checked && useSinglePageType && (
				<PageSearch
					selectedId={pageId}
					uid={contentType?.uid}
					platformTitle={platform?.label}
					onChange={(value) => onPageChange(value?.id, value?.path, value?.platform?.domain)}
					pageBuilderConfig={pluginConfig?.pageBuilder}
				/>
			)}

			{!checked && !useSinglePageType && (
				<Field required>
					<FieldLabel>
						{formatMessage({
							id: getTrad('internal-link.form.page')
						})}
					</FieldLabel>

					<ReactSelect
						inputId="page"
						name="page"
						value={page}
						menuPosition="absolute"
						menuPlacement="auto"
						// @ts-ignore Option is of correct type
						components={{ Option }}
						options={pageOptionsIsFetching ? [] : pageOptions}
						isLoading={pageOptionsIsLoading}
						isDisabled={!contentType || pageOptionsIsLoading}
						// @ts-ignore onChange is of correct type
						onChange={(value: IPageOption) => onPageChange(value.id, value.slugLabel, value.platform?.domain)}
						placeholder={
							pageOptionsIsLoading
								? formatMessage({
										id: getTrad('internal-link.loading')
								  })
								: formatMessage({
										id: getTrad('internal-link.form.page.placeholder')
								  })
						}
						loadingMessage={getLoadingMessage}
						noOptionsMessage={getNoOptionsMessage}
						isSearchable
						// @ts-ignore isClear is of correct type
						isClear
					/>
				</Field>
			)}

			<div style={!checked ? { display: 'none' } : undefined}>
				<Field name="link" id="link" error={errors.url} required>
					<FieldLabel>
						{formatMessage({
							id: getTrad(`internal-link.form.${translationLinkKey}`)
						})}
					</FieldLabel>

					<FieldInput
						type="text"
						value={link.url}
						onChange={onLinkChange}
						onBlur={onLinkBlur}
						required
						disabled={!checked}
						placeholder={formatMessage({
							id: getTrad(`internal-link.form.${translationLinkKey}.placeholder`)
						})}
					/>

					<FieldError />
				</Field>
			</div>

			{errors?.link && (
				<Alert
					title={formatMessage({
						id: getTrad('internal-link.form.alert.title')
					})}
					closeLabel={formatMessage({
						id: getTrad('internal-link.form.alert.close')
					})}
					action={
						<Button variant="danger-light" onClick={onReset}>
							{formatMessage({
								id: getTrad('internal-link.form.alert.button')
							})}
						</Button>
					}
					variant="danger"
					onClose={() => {
						setErrors((previousValue) => ({
							...previousValue,
							link: undefined
						}));
					}}
				>
					{formatMessage({
						id: getTrad('internal-link.form.alert.description')
					})}
				</Alert>
			)}
		</Stack>
	);
};

export default InternalLinkForm;
