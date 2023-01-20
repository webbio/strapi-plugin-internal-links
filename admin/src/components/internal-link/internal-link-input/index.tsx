import React, { useLayoutEffect, useState, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { Stack, IconButton, 	Field,
	FieldHint,
	FieldError,
	FieldLabel,
	FieldInput, } from '@strapi/design-system';

import { Pencil, Link, Trash} from '@strapi/icons';


import getTrad from '../../../utils/get-trad';
import createInternalLink from '../internal-link-factory';
import { InputGroup, Actions } from './styles';
import useInternalLinkInput from './use-internal-link-input';

const InternalLinkModal = lazy(() => import('../internal-link-modal'));

const InternalLinkInput = ({
	description,
	error,
	intlLabel,
	labelAction,
	name,
	onChange,
	required,
	value,
}) => {
	const { formatMessage } = useIntl();
	const { layout, initialData } = useCMEditViewDataManager();
	const { link, setLink, initialLink, isInitialData, errors, setErrors } =
		useInternalLinkInput(value, error, layout.uid, initialData.id, name);

	const [showModal, setShowModal] = useState(false);
	const [copyButtonText, setCopyButtonText] = useState(
		formatMessage({
			id: getTrad('internal-link.form.copy'),
		})
	);

	const saveModal = () => {
		setShowModal(false);
		initialLink.current = link;
		handleChange();
	};

	const closeModal = () => {
		setShowModal(false);
		setErrors((previousValue) => ({
			...previousValue,
			text: undefined,
			url: undefined,
			link: undefined,
		}));
	};

	const handleChange = () => {
		onChange({
			target: {
				name,
				value: link.url ? JSON.stringify(link) : 'null',
				type: 'json',
			},
		});
	};

	const onCopy = () => {
		if (!navigator?.clipboard) return;

		navigator.clipboard.writeText(link.url);

		setCopyButtonText(
			formatMessage({
				id: getTrad('internal-link.form.copied'),
			})
		);

		setTimeout(() => {
			setCopyButtonText(
				formatMessage({
					id: getTrad('internal-link.form.copy'),
				})
			);
		}, 3000);
	};

	const onDelete = () => {
		setLink(createInternalLink(layout.uid, initialData.id, name));

		onChange({
			target: {
				name,
				value: 'null',
				type: 'json',
			},
		});
	};

	useLayoutEffect(() => {
		if (!isInitialData) {
			handleChange();
		}

		if (!isInitialData && link.id) {
			setLink((previousValue) => ({
				...previousValue,
				id: null,
			}));
		}
	}, [isInitialData]);

	useLayoutEffect(() => {
		const validInitialData =
			initialLink.current.url && typeof initialLink.current.url === 'string';

		if (!validInitialData) {
			onChange({
				target: {
					name,
					value: 'null',
					type: 'json',
				},
			});
		}
	}, [initialLink.current]);

	return (
		<Suspense fallback={<div>Loading</div>}>
			<Field
				name={name}
				id={name}
				error={errors?.url}
				hint={description && formatMessage(description)}
			>
				<Stack spacing={1}>
					<FieldLabel action={labelAction} required={required}>
						{formatMessage(intlLabel)}
					</FieldLabel>

					<InputGroup horizontal>
						<FieldInput
							type="json"
							id="internal-link-value"
							label={formatMessage(intlLabel)}
							aria-label={formatMessage({
								id: getTrad('internal-link.input.aria-label'),
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
									id: getTrad('internal-link.form.edit'),
								})}
							/>

							<IconButton
								icon={<Link />}
								onClick={onCopy}
								label={copyButtonText}
							/>

							<IconButton
								icon={<Trash />}
								onClick={onDelete}
								label={formatMessage({
									id: getTrad('internal-link.form.delete'),
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

InternalLinkInput.defaultProps = {
	description: null,
	disabled: false,
	error: null,
	labelAction: null,
	required: false,
	value: '',
};

InternalLinkInput.propTypes = {
	intlLabel: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	attribute: PropTypes.object.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.object,
	disabled: PropTypes.bool,
	error: PropTypes.string,
	labelAction: PropTypes.object,
	required: PropTypes.bool,
	value: PropTypes.string,
};

export default InternalLinkInput;
