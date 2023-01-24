import React, { useLayoutEffect, useState, lazy, Suspense } from 'react';
import { useIntl, MessageDescriptor, IntlFormatters } from 'react-intl';

import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { Stack, IconButton, Field, FieldHint, FieldError, FieldLabel, FieldInput } from '@strapi/design-system';

import { Pencil, Link, Trash } from '@strapi/icons';

import getTrad from '../../../utils/get-trad';
import createInternalLink from '../internal-link-factory';
import { InputGroup, Actions } from './styles';
import useInternalLinkInput from './use-internal-link-input';

export interface IInternalLinkInputProps {
	intlLabel?: MessageDescriptor & Parameters<IntlFormatters['formatMessage']>;
	onChange?: any;
	attribute?: {
		pluginOptions?: { slug?: { targetField?: string; field?: string } };
		required?: boolean;
	};
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

const InternalLinkModal = lazy(() => import('../internal-link-modal'));

const InternalLinkInput = ({
	description,
	error,
	intlLabel,
	labelAction,
	name,
	onChange,
	required,
	value
}: IInternalLinkInputProps): JSX.Element => {
	const { formatMessage } = useIntl();
	const { layout, initialData } = useCMEditViewDataManager();
	const { link, setLink, initialLink, isInitialData, errors, setErrors } = useInternalLinkInput(
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
		if (!navigator?.clipboard) return;

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
		<Suspense fallback={<></>}>
			<Field name={name} id={name} error={errors?.url} hint={description && formatMessage(description)}>
				<Stack spacing={1}>
					{intlLabel && (
						<FieldLabel action={labelAction} required={required}>
							{formatMessage(intlLabel)}
						</FieldLabel>
					)}

					<InputGroup horizontal>
						<FieldInput
							type="json"
							id="internal-link-value"
							label={intlLabel ? formatMessage(intlLabel) : ''}
							aria-label={formatMessage({
								id: getTrad('internal-link.input.aria-label')
							})}
							value={link.url}
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
				/>
			)}
		</Suspense>
	);
};

export default InternalLinkInput;
