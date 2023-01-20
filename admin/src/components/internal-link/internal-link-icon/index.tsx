import React from 'react';
import styled from 'styled-components';
import { Icon, Flex } from '@strapi/design-system';
import { Link } from '@strapi/icons';

const IconBox = styled(Flex)`
	background-color: #0e4dff;

	svg > path {
		fill: #fff;
	}
`;

const LinkIcon = (): JSX.Element => (
	<IconBox justifyContent="center" alignItems="center" width={7} height={6} hasRadius aria-hidden>
		<Icon height={3} as={Link} />
	</IconBox>
);

export default LinkIcon;
