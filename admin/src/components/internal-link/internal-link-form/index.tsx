import React, { useState, useLayoutEffect, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { string } from 'yup';
import { ReactSelect } from '@strapi/helper-plugin';
import { Alert, ToggleCheckbox, Stack, Button, FieldLabel, Field, FieldError, FieldInput } from '@strapi/design-system';

import getTrad from '../../../utils/get-trad';
import axios from '../../../utils/axiosInstance';
import Option from './option';
import pluginId from '../../../plugin-id';
import { INTERNAL_LINK_TYPE } from '../internal-link-factory';
import { IUseInternalLinkInputReturn } from '../internal-link-input/use-internal-link-input';

interface IProps extends Omit<IUseInternalLinkInputReturn, 'initialLink' | 'isInitialData'> {}

const InternalLinkForm = ({ link, setLink, errors, setErrors }: IProps): JSX.Element => {
	const { formatMessage } = useIntl();
	const [checked, setChecked] = useState<boolean>(link.type === 'internal');
	const [contentTypeUid, setContentTypeUid] = useState<string | undefined>();
	const [contentTypeOptions, setContentTypeOptions] = useState<any[]>([]); // TODO: Server typing
	const [contentTypeIsLoading, setContentTypeIsLoading] = useState<boolean>(false);
	const [pageId, setPageId] = useState<number | undefined>();
	const [pageOptions, setPageOptions] = useState<any[]>([]); // TODO: Server typing
	const [pageIsLoading, setPageIsLoading] = useState<boolean>(false);

	const page = pageOptions.find((item) => item.id === pageId); // TODO: Server typing
	const contentType = contentTypeOptions.find((item) => item.uid === contentTypeUid); // TODO: Server typing

	const translationLinkKey = checked ? 'generated-link' : 'link';

	const getAllContentTypes = async (uid: string | undefined): Promise<void> => {
		setContentTypeIsLoading(true);

		try {
			const { data } = await axios.get(`/${pluginId}/content-types`);

			const options = data.map((item) => ({
				...item,
				label: item.displayName,
				value: String(item.uid),
				slugLabel: item.basePath || ''
			}));

			if (uid) {
				setContentTypeUid(uid);
			}

			setContentTypeOptions(options);
		} catch (error) {
			console.error(error);
		}

		setContentTypeIsLoading(false);
	};

	const pageDataToOptionData = (data, id): void => {
		const options = data.map((item) => {
			const titlePath = contentType?.titleField.split('.');
			const locale = item.locale && item.locale !== 'nl' ? `${item.locale}/` : '';
			const label =
				titlePath.length < 2
					? item[contentType?.titleField]
					: titlePath.reduce((previousValue, currentValue) => {
							return previousValue[currentValue];
					  }, item);

			return {
				...item,
				label,
				value: String(item.id),
				slugLabel: contentType?.slugField !== false ? `${locale}${item[contentType?.slugField] || ''}` : '',
				showIndicator: true
			};
		});

		if (id) {
			setPageId(id);
		}

		setPageOptions(options);
	};

	const getAllSingleTypeItems = async (contentTypeUid: string, contentTypeId: number): Promise<void> => {
		setPageIsLoading(true);

		try {
			const { data } = await axios.get(`/${pluginId}/single-type/${contentTypeUid}`);
			pageDataToOptionData(data, contentTypeId);
		} catch (error) {
			console.error(error);
		}

		setPageIsLoading(false);
	};

	const getAllItems = async (contentTypeUid: string, contentTypeId: number): Promise<void> => {
		setPageIsLoading(true);

		try {
			const { data } = await axios.get(`/${pluginId}/collection-type/${contentTypeUid}`);
			pageDataToOptionData(data, contentTypeId);
		} catch (error) {
			console.error(error);
		}

		setPageIsLoading(false);
	};

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

	// TODO: Server typing content type
	const onContentTypeChange = (value: any) => {
		setPageId(undefined);
		setContentTypeUid(value.uid);
	};

	// TODO: Server typing page type
	const onPageChange = (value: any) => {
		setPageId(value.id);
		setLink((previousValue) => ({
			...previousValue,
			targetContentTypeUid: contentType.uid,
			targetContentTypeId: value.id || null,
			url: [link.domain, value.locale !== 'nl' ? value.locale : undefined, value[contentType.slugField] || '']
				.filter((item) => !!item)
				.join('/')
		}));
	};

	const onLinkChange = (event) => {
		if (link.targetContentTypeUid) {
			event.prefentDefault;
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

	const onLinkBlur = async (event) => {
		const newValue = event.target.value;
		const urlSchema = string().url().required();

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

	const onTextBlur = (event) => {
		const newValue = event.target.value;

		if (newValue) {
			setErrors((previousValue) => ({
				...previousValue,
				text: undefined
			}));
		} else {
			setErrors((previousValue) => ({
				...previousValue,
				text: 'This is required'
			}));
		}
	};

	const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLink((value) => ({ ...value, text: event.target.value }));
	};

	useLayoutEffect(() => {
		getAllContentTypes(link.targetContentTypeUid);
		setChecked(!!link.targetContentTypeUid);
		setLink((previousValue) => ({
			...previousValue,
			type: link.targetContentTypeUid ? INTERNAL_LINK_TYPE.INTERNAL : INTERNAL_LINK_TYPE.EXTERNAL
		}));
	}, []);

	useEffect(() => {
		setPageOptions([]);

		if (contentType?.uid && contentType.kind === 'collectionType') {
			getAllItems(contentType.uid, Number(link.targetContentTypeId));
		}

		if (contentType?.uid && contentType.kind === 'singleType') {
			getAllSingleTypeItems(contentType.uid, Number(link.targetContentTypeId));
		}
	}, [contentType?.uid]);

	useEffect(() => {
		if (contentType?.domain) {
			setLink((previousValue) => ({
				...previousValue,
				domain: contentType?.domain
			}));
		}
	}, [contentType?.domain]);

	return (
		<Stack spacing={6}>
			<ToggleCheckbox
				checked={checked}
				onChange={onToggleCheckbox}
				offLabel={formatMessage({
					id: getTrad('internal-link.form.type.external')
				})}
				onLabel={formatMessage({
					id: getTrad('internal-link.form.type.internal')
				})}
			>
				{formatMessage({
					id: getTrad('internal-link.form.type')
				})}
			</ToggleCheckbox>

			<Field name="text" id="text" error={errors.text}>
				<FieldLabel required>
					{formatMessage({
						id: getTrad('internal-link.form.text')
					})}
				</FieldLabel>

				<FieldInput type="text" value={link.text} onChange={onTextChange} onBlur={onTextBlur} required />

				<FieldError />
			</Field>

			{!!checked && (
				<Field>
					<FieldLabel required>
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
						components={{ Option }}
						options={contentTypeOptions}
						isLoading={contentTypeIsLoading}
						isDisabled={contentTypeIsLoading}
						onChange={onContentTypeChange}
						placeholder={
							contentTypeIsLoading
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
						isClear
					/>
				</Field>
			)}

			{!!checked && (
				<Field>
					<FieldLabel required>
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
						components={{ Option }}
						options={pageOptions}
						isLoading={pageIsLoading}
						isDisabled={!contentType || pageIsLoading}
						onChange={onPageChange}
						placeholder={
							pageIsLoading
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
						isClear
					/>
				</Field>
			)}

			<div style={checked ? { display: 'none' } : undefined}>
				<Field name="link" id="link" error={errors.url}>
					<FieldLabel required>
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
						disabled={checked}
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
