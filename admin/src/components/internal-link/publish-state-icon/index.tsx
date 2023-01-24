import React from 'react';
import { Box } from '@strapi/design-system';

interface IProps {
	isPublished: boolean
}

const PublishStateIcon = ({ isPublished = false }: IProps): JSX.Element => (
	<Box
		background={isPublished ? 'success600' : 'secondary600'}
		style={{
			height: '6px',
			borderRadius: '50%',
			width: '6px'
		}}
	/>
);

export default PublishStateIcon;
