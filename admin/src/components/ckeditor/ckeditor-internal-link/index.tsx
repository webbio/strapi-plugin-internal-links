import React from 'react';
import PropTypes from 'prop-types';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import InternalLinkModal from '../../internal-link/internal-link-modal';
import useInternalLinkInput from '../../internal-link/internal-link-input/use-internal-link-input';
import { encodeAttributes } from '../ckeditor-plugins/strapi-internal-link/utils';

interface IProps {
	isOpen: boolean;
	name: string;
	text?: string;
	value?: string;
	error?: string,
	sourceUid?: string;
	sourceId?: number;
	onChange?: any;
	onToggle?: any;
}

const InternalLink = ({
	text = '',
	value= '',
	error,
	name,
	isOpen,
	onToggle = () => {},
	onChange = () => {},
	sourceUid,
	sourceId,
}: IProps) => {
	if (!isOpen) return null;

	const viewData = useCMEditViewDataManager();

	const { link, setLink, errors, setErrors, initialLink } =
		useInternalLinkInput(
			value,
			error,
			sourceUid || viewData?.layout?.uid,
			sourceId || viewData?.initialData?.id,
			name,
			text
		);

	const handleChange = () => {
		const html = `
			<a
				href="${link.url}"
				data-internal-link='${encodeAttributes(link)}'
			>
				${link.text}
			</a>`;

		onChange(html, link);
	};

	const saveModal = () => {
		initialLink.current = link;
		handleChange();
		onToggle();
	};

	const closeModal = () => {
		setLink(initialLink.current);
		setErrors((previousValue) => ({
			...previousValue,
			text: undefined,
			url: undefined,
			link: undefined,
		}));
		onToggle();
	};

	return (
		<InternalLinkModal
			toggleModal={saveModal}
			closeModal={closeModal}
			setLink={setLink}
			link={link}
			errors={errors}
			setErrors={setErrors}
		/>
	);
};

export default InternalLink;
