import styled from 'styled-components';
import { Box } from '@strapi/design-system';

const CustomOption = styled(Box)`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const CustomOptionStatus = styled(Box)`
	background: ${({ theme, publicationState }) =>
		publicationState === 'published' ? theme.colors.success600 : theme.colors.secondary600};
	width: 6px;
	height: 6px;
	border-radius: 100px;
`;

export default {
	CustomOptionStatus,
	CustomOption
};
