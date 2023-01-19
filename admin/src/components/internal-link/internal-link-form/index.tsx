import React, { useState, useLayoutEffect, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { string } from 'yup';

import { Alert, ToggleCheckbox, Stack, Button, FieldLabel, Field, FieldError, FieldInput } from '@strapi/design-system';

import { ReactSelect } from '@strapi/helper-plugin';

import getTrad from '../../../utils/get-trad';
import axios from '../../../utils/axiosInstance';
import Option from './option';
import { INTERNAL_LINK_TYPE } from '../internal-link-factory';
import pluginId from '../../../plugin-id';

const InternalLinkForm = ({ link, setLink, errors, setErrors }) => {
	const { formatMessage } = useIntl();
	const [checked, setChecked] = useState(link.type === 'internal');
	const [contentType, setContentType] = useState<any>();
	const [contentTypeOptions, setContentTypeOptions] = useState([]);
	const [contentTypeIsLoading, setContentTypeIsLoading] = useState(false);
	const [page, setPage] = useState();
	const [pageOptions, setPageOptions] = useState([]);
	const [pageIsLoading, setPageIsLoading] = useState(false);

	const translationLinkKey = checked ? 'generated-link' : 'link';

	const getAllContentTypes = async (uid) => {
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
				setContentType(options.find((type) => type.uid === uid));
			}

			setContentTypeOptions(options);
		} catch (error) {
			console.error(error);
		}

		setContentTypeIsLoading(false);
	};

	const pageDataToOptionData = (data, id) => {
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
			setPage(options.find((item) => item.id === id));
		}

		setPageOptions(options);
	};

	const getAllSingleTypeItems = async (contentTypeUid, contentTypeId) => {
		setPageIsLoading(true);

		try {
			const { data } = await axios.get(`/${pluginId}/single-type/${contentTypeUid}`);
			pageDataToOptionData(data, contentTypeId);
		} catch (error) {
			console.error(error);
		}

		setPageIsLoading(false);
	};

	const getAllItems = async (contentTypeUid, contentTypeId) => {
		setPageIsLoading(true);

		try {
			const { data } = await axios.get(`/${pluginId}/collection-type/${contentTypeUid}`);
			pageDataToOptionData(data, contentTypeId);
		} catch (error) {
			console.error(error);
		}

		setPageIsLoading(false);
	};

	const onToggleCheckbox = () => {
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

	const onContentTypeChange = (value) => {
		setPage(undefined);
		setContentType(value);
	};

	const onPageChange = (value) => {
		setPage(value);
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
		setContentType(undefined);
		setPage(undefined);

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

	const onTextChange = (event) => {
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
