import React from 'react';
import { Icon } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Plus, Link } from '@strapi/icons';

import { ModalLayout, ModalBody, ModalHeader, ModalFooter, Flex, Button, Typography } from '@strapi/design-system';

import getTrad from '../../utils/get-trad';
import InternalLinkForm from '../form';
import { IInternalLinkAttribute } from "../input";
import { IUseInternalLinkInputReturn } from '../input/use-internal-link-input';


interface IInternalLinkModalProps extends Omit<IUseInternalLinkInputReturn, 'initialLink' | 'isInitialData' | 'resetInternalLink'> {
    attribute: IInternalLinkAttribute,
	toggleModal: () => void;
	closeModal: () => void;
}

const InternalLinkModal = ({
	link,
	setLink,
	errors,
	setErrors,
    attribute,
	toggleModal = () => {
		console.warn('Modal toggle function not set');
	},
	closeModal = () => {
		console.warn('Modal close function not set');
	}
}: IInternalLinkModalProps): JSX.Element => {
	const { formatMessage } = useIntl();

	const hasErrors = Object.values(errors).some((item) => !!item);
	const isFilled =
		(link.type === 'external' && !!link.text && !!link.url) ||
		(link.type === 'internal' && !!link.targetContentTypeUid && !!link.targetContentTypeId);

	const spacing = 4;
	const colors = {
		text: 'neutral800',
		icon: 'neutral900'
	};

	return (
		<ModalLayout onClose={closeModal} labelledBy="title">
			<ModalHeader>
				<Typography fontWeight="bold" textColor={colors.text} as="h2" id="title">
					<Flex gap={spacing}>
						<Icon as={Link} color={colors.icon} width={spacing} height={spacing} />
						{formatMessage({
							id: getTrad('internal-link.modal.title')
						})}
					</Flex>
				</Typography>
			</ModalHeader>

			{/* New Strapi design system overflow styling breaks dropdowns in modals */}
			<ModalBody style={{ overflow: 'initial' }}>
				<Typography fontWeight="bold" textColor={colors.text} id="body">
                    <InternalLinkForm link={link} setLink={setLink} errors={errors} setErrors={setErrors} attribute={attribute.options} />
				</Typography>
			</ModalBody>

			<ModalFooter
				startActions={
					<Button onClick={closeModal} variant="tertiary">
						{formatMessage({
							id: getTrad('internal-link.modal.buttons.cancel')
						})}
					</Button>
				}
				endActions={
					<Button
						onClick={toggleModal}
						startIcon={<Plus />}
						disabled={hasErrors || !isFilled}
						style={{
							opacity: hasErrors || !isFilled ? 0.5 : 1
						}}
					>
						{formatMessage({
							id: getTrad('internal-link.modal.buttons.submit')
						})}
					</Button>
				}
			/>
		</ModalLayout>
	);
};

export default InternalLinkModal;
