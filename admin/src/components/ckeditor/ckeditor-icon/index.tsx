import React from 'react';
import styled from 'styled-components';
import { Icon, Flex } from '@strapi/design-system';
import SvgIcon from './svg';

const IconBox = styled(Flex)`
	background-color: #0e4dff;

	svg > path {
		fill: #fff;
	}
`;

const CKEditorIcon = (): JSX.Element => (
	<IconBox justifyContent="center" alignItems="center" width={7} height={6} hasRadius aria-hidden>
		<Icon height={5} as={SvgIcon} />
	</IconBox>
);

export default CKEditorIcon;
