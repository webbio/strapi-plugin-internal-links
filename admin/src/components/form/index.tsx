import React, { useState, useLayoutEffect, useEffect } from 'react';
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

interface IProps extends Omit<IUseInternalLinkInputReturn, 'initialLink' | 'isInitialData' | 'resetInternalLink'> {
	attribute: {
		'link-regex'?: string;
	};
}

const InternalLinkForm = ({ link, setLink, errors, setErrors, attribute }: IProps): JSX.Element => {
	const { formatMessage } = useIntl();

	const {
		contentType,
		setContentTypeUid,
		contentTypeOptions,
		contentTypeOptionsIsLoading,
		contentTypeOptionsIsFetching
	} = useContentTypeOptions(link.targetContentTypeUid);

	const { page, setPageId, pageOptions, pageOptionsIsLoading, pageOptionsIsFetching } = usePageOptions(
		contentType,
		link.targetContentTypeId
	);

	const [checked, setChecked] = useState<boolean>(link.type === 'internal');
	const translationLinkKey = checked ? 'generated-link' : 'link';

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

	const onContentTypeChange = (value: IContentTypeOption) => {
		setPageId(undefined);
		setContentTypeUid(value.uid);
	};

	const onPageChange = (value: IPageOption) => {
		if (!contentType) return;

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
		const linkRegex = attribute?.['link-regex'];
		const regexObject = new RegExp(linkRegex);
		const newValue = event.target.value;

		const urlSchema = linkRegex ? yup.string().required().matches(regexObject) : yup.string().required();

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

	const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLink((value) => ({ ...value, text: (event.target satisfies HTMLInputElement).value }));
	};

	useLayoutEffect(() => {
		setChecked(!!link.targetContentTypeUid);
		setLink((previousValue) => ({
			...previousValue,
			type: link.targetContentTypeUid ? INTERNAL_LINK_TYPE.INTERNAL : INTERNAL_LINK_TYPE.EXTERNAL
		}));
	}, []);

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

			<Field name="text" id="text" error={errors.text} required>
				<FieldLabel>
					{formatMessage({
						id: getTrad('internal-link.form.text')
					})}
				</FieldLabel>

				<FieldInput type="text" value={link.text} onChange={onTextChange} onBlur={onTextBlur} required />

				<FieldError />
			</Field>

			{!!checked && (
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
						components={{ Option }}
						options={contentTypeOptionsIsFetching ? [] : contentTypeOptions}
						isLoading={contentTypeOptionsIsLoading}
						isDisabled={contentTypeOptionsIsLoading}
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
						isClear
					/>
				</Field>
			)}

			{!!checked && (
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
						components={{ Option }}
						options={pageOptionsIsFetching ? [] : pageOptions}
						isLoading={pageOptionsIsLoading}
						isDisabled={!contentType || pageOptionsIsLoading}
						onChange={onPageChange}
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
						isClear
					/>
				</Field>
			)}

			<div style={checked ? { display: 'none' } : undefined}>
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
