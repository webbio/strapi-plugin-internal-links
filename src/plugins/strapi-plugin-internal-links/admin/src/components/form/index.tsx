import React, { useState, useLayoutEffect, useEffect, ChangeEvent } from 'react';
import * as yup from 'yup';
import { useIntl } from 'react-intl';
import { Alert, Stack, Button, Tabs, Tab, TabGroup, TabPanels } from '@strapi/design-system';
import useContentTypeOptions, { IContentTypeOption } from './hooks/use-content-type-options';
import usePageOptions from './hooks/use-page-options';
import getTrad from '../../utils/get-trad';
import { INTERNAL_LINK_TYPE } from '../factory';
import { IUseInternalLinkInputReturn } from '../input/use-internal-link-input';
import usePlatformOptions from './hooks/use-platform-options';
import { Platform } from '../../api/platform';
import { IInternalLinkAttribute } from '..';
import { useGetConfig } from '../../api/config';
import { IReactSelectValue } from '../Combobox';
import { InternalTab } from './tabs/internal-tab';
import { ExternalTab } from './tabs/external-tab';
import { SourceTab } from './tabs/source-tab';

interface IProps extends Omit<IUseInternalLinkInputReturn, 'initialLink' | 'isInitialData' | 'resetInternalLink'> {
	attributeOptions?: IInternalLinkAttribute['options'];
	shouldShowTitle?: boolean;
}

const InternalLinkForm = ({
	link,
	setLink,
	errors,
	setErrors,
	attributeOptions,
	shouldShowTitle
}: IProps): JSX.Element => {
	const { formatMessage } = useIntl();
	const { data: pluginConfig } = useGetConfig({});
	const useSinglePageType = !!pluginConfig?.useSinglePageType || pluginConfig?.pageBuilder?.enabled;
	const noUrlValidation = pluginConfig?.noUrlValidation;
	const externalApi = attributeOptions?.externalApi?.enabled;
	const globalExternalApiUrl = pluginConfig?.externalApi?.apiUrl;
	// More information including tests: https://regexr.com/7p9qh
	const defaultUrlRegex = new RegExp(
		/(^https?:\/\/(www.)?[a-zA-Z0-9]{1,}.[^s]{2,}((\/[a-zA-Z0-9\-\_\=\?\%\&\#]{1,}){1,})?)\/?$|^mailto:[\w-\. +]+@([\w-]+\.)+[\w-]{2,4}$|^tel:((\+|00(\s|\s?\-\s?)?)[0-9]{2}(\s|\s?\-\s?)?(\(0\)[\-\s]?)?|0)[0-9](((\s|\s?\-\s?)?[0-9]){1,})|^#[a-zA-Z0-9\,\[\]\-\_\=\?\%\&\#]{1,}$/
	);
	const { contentType, setContentTypeUid } = useContentTypeOptions(link.targetContentTypeUid);
	const { page, pageId, setPageId, pageOptionsIsLoading } = usePageOptions(contentType, link.targetContentTypeId);
	const { setPlatformId } = usePlatformOptions({ page, pageOptionsIsLoading });
	const [tabType, setTabType] = useState<'internal' | 'external' | 'source'>(link.type || INTERNAL_LINK_TYPE.INTERNAL);

	useEffect(() => {
		if (pluginConfig && useSinglePageType) {
			setContentTypeUid(pluginConfig.pageBuilder?.pageUid || pluginConfig.useSinglePageType);
		}
	}, [pluginConfig]);

	const checkTab = () => {
		if (tabType === INTERNAL_LINK_TYPE.EXTERNAL) {
			return 1;
		}
		if (tabType === INTERNAL_LINK_TYPE.SOURCE) {
			return 2;
		}
		return 0;
	};

	const onContentTypeChange = (value: IContentTypeOption) => {
		setPageId(undefined);
		setContentTypeUid(value.uid);
	};

	const onPageChange = (id?: number, path?: string, domain?: string) => {
		if (!contentType) return;

		setPageId(id);
		setLink((previousValue) => ({
			...previousValue,
			targetContentTypeUid: id ? contentType.uid : '',
			targetContentTypeId: id || null,
			url: [domain, path].filter(Boolean).join('/')
		}));
	};

	const onSourceChange = (props: IReactSelectValue) => {
		if (!props) {
			setLink((previousValue) => ({
				...previousValue,
				externalApiValue: '',
				url: ''
			}));
			return;
		}
		setLink((previousValue) => ({
			...previousValue,
			externalApiValue: props ? props.value : '',
			externalApiLabel: props ? props.label : '',
			url: props.value
		}));
	};

	const onDecisionTreeChange = (id: number | undefined, label?: string) => {
		setLink((previousValue) => ({
			...previousValue,
			decisionTreeId: id,
			url: label || ''
		}));
	};

	const onLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (link.targetContentTypeUid) {
			event.preventDefault;
			setErrors((previousValue) => ({
				...previousValue,
				link: formatMessage({
					id: getTrad('internal-link.form.link.placeholder')
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
		const linkRegex = attributeOptions?.['link-regex'];
		const regexObject = linkRegex ? new RegExp(linkRegex) : defaultUrlRegex;
		const newValue = event.target.value;
		const urlSchema = yup.string().required().matches(regexObject);

		if (noUrlValidation) {
			return;
		}

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
						id: getTrad('internal-link.form.text.error')
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

	const onUrlAdditionBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
		const newValue = event.target.value;

		if (newValue) {
			try {
				// If the text doesn't parse as JSON we cannot save the link.
				JSON.parse(JSON.stringify({ text: newValue }));

				const allowedStart = newValue.startsWith('?') || newValue.startsWith('#');

				setErrors((previousValue) => ({
					...previousValue,
					urlAddition: allowedStart ? undefined : formatMessage({ id: getTrad('internal-link.form.urlAddition.error') })
				}));
			} catch {
				setErrors((previousValue) => ({
					...previousValue,

					urlAddition: formatMessage({
						id: getTrad('internal-link.form.urlAddition.error')
					})
				}));
			}
		}
	};

	const onPlatformChange = (value?: Platform) => {
		setPlatformId(value?.id);
		onPageChange();
	};

	const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLink((value) => ({ ...value, text: (event.target satisfies HTMLInputElement).value }));
	};

	const tabChange = (selected: number) => {
		setErrors((previousValue) => ({
			...previousValue,
			link: undefined,
			url: undefined
		}));
		if (selected === 0) {
			setTabType(INTERNAL_LINK_TYPE.INTERNAL);
			setLink((value) => ({ ...value, type: INTERNAL_LINK_TYPE.INTERNAL }));
		} else if (selected === 1) {
			setTabType(INTERNAL_LINK_TYPE.EXTERNAL);
			setLink((value) => ({ ...value, type: INTERNAL_LINK_TYPE.EXTERNAL }));
		} else if (selected === 2) {
			setTabType(INTERNAL_LINK_TYPE.SOURCE);
			setLink((value) => ({ ...value, type: INTERNAL_LINK_TYPE.SOURCE }));
		}
	};

	const onUrlAdditionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = (event.target satisfies HTMLInputElement).value;

		if (link.url) {
			setLink((v) => ({ ...v, urlAddition: value }));
		}
	};

	useLayoutEffect(() => {
		setTabType(link.type);
	}, []);

	useEffect(() => {
		if ((page?.platform?.domain || contentType?.domain) && link?.domain !== page?.platform?.domain) {
			setLink((previousValue) => ({
				...previousValue,
				domain: page?.platform?.domain || contentType?.domain
			}));
		}
	}, [contentType?.domain, page]);

	return (
		<Stack spacing={6}>
			<TabGroup
				label="internalLinkTabs"
				id="tabs"
				onTabChange={(selected: number) => tabChange(selected)}
				initialSelectedTabIndex={checkTab}
			>
				<Tabs>
					<Tab>
						{formatMessage({
							id: getTrad('internal-link.tab.internal.label')
						})}
					</Tab>
					<Tab>
						{formatMessage({
							id: getTrad('internal-link.tab.external.label')
						})}
					</Tab>
					{externalApi && (
						<Tab>
							{attributeOptions?.externalApi?.tabName ||
								formatMessage({
									id: getTrad('internal-link.tab.source.label')
								})}
						</Tab>
					)}
				</Tabs>
				<TabPanels>
					<InternalTab
						errors={errors}
						link={link}
						pageId={pageId}
						contentType={contentType}
						shouldShowTitle={shouldShowTitle}
						attributeOptions={attributeOptions}
						onTextBlur={onTextBlur}
						onTextChange={onTextChange}
						onPageChange={onPageChange}
						onUrlAdditionChange={onUrlAdditionChange}
						onUrlAdditionBlur={onUrlAdditionBlur}
						onContentTypeChange={onContentTypeChange}
						onPlatformChange={onPlatformChange}
					/>
					<ExternalTab
						errors={errors}
						link={link}
						shouldShowTitle={shouldShowTitle}
						onLinkBlur={onLinkBlur}
						onLinkChange={onLinkChange}
						onTextBlur={onTextBlur}
						onTextChange={onTextChange}
					/>
					<SourceTab
						errors={errors}
						link={link}
						attributeOptions={attributeOptions}
						shouldShowTitle={shouldShowTitle}
						onLinkBlur={onLinkBlur}
						onLinkChange={onLinkChange}
						onSourceChange={onSourceChange}
						onDecisionTreeChange={onDecisionTreeChange}
						onTextBlur={onTextBlur}
						onTextChange={onTextChange}
						configApiUrl={globalExternalApiUrl}
					/>
				</TabPanels>
			</TabGroup>

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
