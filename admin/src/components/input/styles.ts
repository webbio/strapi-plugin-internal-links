import styled from 'styled-components';
import { Box, Stack } from '@strapi/design-system';

const spacing = '4px';

export const Actions = styled(Stack)`
	gap: ${spacing};
`;

export const InputGroup = styled(Box)`
	position: relative;

	${Actions} {
		position: absolute;
		right: ${spacing};
		top: 50%;
		translate: 0 -50%;
	}

	input {
		padding-right: 110px;
	}
`;
