import React, { useLayoutEffect, useState, lazy, Suspense } from 'react';
import { useIntl, MessageDescriptor, IntlFormatters } from 'react-intl';

import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import {
	Stack,
	IconButton,
	Field,
	FieldHint,
	TextInput,
	FieldError,
	FieldLabel,
	FieldInput
} from '@strapi/design-system';
import { Pencil, Link, Trash } from '@strapi/icons';

import getTrad from '../../utils/get-trad';
import createInternalLink from '../factory';
import useInternalLinkInput from './use-internal-link-input';
import { InputGroup, Actions } from './styles';
import { useGetConfig } from '../../api/config';
import { useGetPlatforms } from '../../api/platform';
import { useGetPlatformRelation } from '../../api/platform-relation';
import { getLinkWithAddition } from '../../utils/url-addition';

export interface IInternalLinkAttribute {
	customField: string;
	type: string;
	pluginOptions?: { slug?: { targetField?: string; field?: string } };
	options?: {
		required?: boolean;
		title?: string;
		slug?: string;
		'link-regex'?: string;
		noTitle?: boolean;
	};
}

export interface IInternalLinkInputProps {
	intlLabel?: MessageDescriptor & Parameters<IntlFormatters['formatMessage']>;
	onChange?: any;
	attribute?: IInternalLinkAttribute;
	name?: string;
	description?: MessageDescriptor & Parameters<IntlFormatters['formatMessage']>;
	disabled?: boolean;
	error?: any;
	labelAction?: any;
	required?: boolean;
	value?: string;
	contentTypeUID?: string;
	placeholder?: MessageDescriptor & Parameters<IntlFormatters['formatMessage']>;
}

const InternalLinkModal = lazy(() => import('../modal'));

const InternalLinkInput = ({
	description,
	error,
	intlLabel,
	labelAction,
	name,
	onChange,
	required,
	value,
	attribute
}: IInternalLinkInputProps): JSX.Element => {
	const { formatMessage } = useIntl();
	const { layout, initialData } = useCMEditViewDataManager() as any;
	// The next three hooks are used to fetch the platforms and their relations before the modal is opened
	useGetConfig({});
	useGetPlatforms({});
	useGetPlatformRelation({
		id: initialData?.id,
		uid: layout.uid,
		targetModel: layout?.attributes?.platform?.target,
		hasPlatformField: Object(layout?.attributes || {}).hasOwnProperty('platform')
	});

	const { link, setLink, initialLink, isInitialData, errors, setErrors, resetInternalLink } = useInternalLinkInput(
		value || '',
		error,
		layout.uid,
		initialData.id,
		name || ''
	);

	const [showModal, setShowModal] = useState(false);
	const [copyButtonText, setCopyButtonText] = useState(
		formatMessage({
			id: getTrad('internal-link.form.copy')
		})
	);

	const saveModal = (): void => {
		setShowModal(false);
		initialLink.current = link;
		handleChange();
	};

	const closeModal = (): void => {
		setShowModal(false);
		resetInternalLink();

		setErrors((previousValue) => ({
			...previousValue,
			text: undefined,
			url: undefined,
			link: undefined
		}));
	};

	const handleChange = (): void => {
		onChange({
			target: {
				name,
				value: link.url ? JSON.stringify(link) : 'null',
				type: 'json'
			}
		});
	};

	const onCopy = (): void => {
		if (!(navigator || null)?.clipboard) return;

		navigator.clipboard.writeText(link.url);

		setCopyButtonText(
			formatMessage({
				id: getTrad('internal-link.form.copied')
			})
		);

		setTimeout(() => {
			setCopyButtonText(
				formatMessage({
					id: getTrad('internal-link.form.copy')
				})
			);
		}, 3000);
	};

	const onDelete = (): void => {
		setLink(createInternalLink(layout.uid, initialData.id, name));

		onChange({
			target: {
				name,
				value: 'null',
				type: 'json'
			}
		});
	};

	useLayoutEffect(() => {
		if (!isInitialData) {
			handleChange();
		}

		if (!isInitialData && link.id) {
			setLink((previousValue) => ({
				...previousValue,
				id: null
			}));
		}
	}, [isInitialData]);

	useLayoutEffect(() => {
		const validInitialData = initialLink.current.url && typeof initialLink.current.url === 'string';

		if (!validInitialData) {
			onChange({
				target: {
					name,
					value: 'null',
					type: 'json'
				}
			});
		}
	}, [initialLink.current]);

	return (
		<Suspense
			fallback={
				<Field
					name={name}
					id={name}
					error={errors?.url}
					hint={description && formatMessage(description)}
					required={required}
				>
					<TextInput
						id="internal-link-suspense"
						label={intlLabel ? formatMessage(intlLabel) : ''}
						aria-label={formatMessage({
							id: getTrad('internal-link.input.aria-label')
						})}
						value={getLinkWithAddition(link.url, link.urlAddition)}
						required={required}
						labelAction={labelAction}
						disabled
					/>
				</Field>
			}
		>
			<Field
				name={name}
				id={name}
				error={errors?.url}
				hint={description && formatMessage(description)}
				required={required}
			>
				<Stack spacing={1}>
					{intlLabel && <FieldLabel action={labelAction}>{formatMessage(intlLabel)}</FieldLabel>}

					<InputGroup horizontal>
						<FieldInput
							type="json"
							id="internal-link-value"
							label={intlLabel ? formatMessage(intlLabel) : ''}
							aria-label={formatMessage({
								id: getTrad('internal-link.input.aria-label')
							})}
							value={getLinkWithAddition(link.url, link.urlAddition)}
							onClick={() => setShowModal(true)}
							required={required}
							disabled
						/>

						<Actions horizontal>
							<IconButton
								icon={<Pencil />}
								onClick={() => setShowModal(true)}
								label={formatMessage({
									id: getTrad('internal-link.form.edit')
								})}
							/>

							<IconButton icon={<Link />} onClick={onCopy} label={copyButtonText} />

							<IconButton
								icon={<Trash />}
								onClick={onDelete}
								label={formatMessage({
									id: getTrad('internal-link.form.delete')
								})}
							/>
						</Actions>
					</InputGroup>

					<FieldHint />
					<FieldError />
				</Stack>
			</Field>

			{!!showModal && (
				<InternalLinkModal
					toggleModal={saveModal}
					closeModal={closeModal}
					setLink={setLink}
					link={link}
					errors={errors}
					setErrors={setErrors}
					attribute={attribute}
				/>
			)}
		</Suspense>
	);
};

export default InternalLinkInput;
