import React from 'react';
import styled from 'styled-components';
import { Icon, Flex } from '@strapi/design-system';
import { Link } from '@strapi/icons';

const IconBox = styled(Flex)`
	/* Hard code color values */
	/* to stay consistent between themes */
	background-color: #0e4dff; /* primary100 */

	svg > path {
		fill: #fff; /* primary600 */
	}
`;

const LinkIcon = () => {
	return (
		<IconBox
			justifyContent="center"
			alignItems="center"
			width={7}
			height={6}
			hasRadius
			aria-hidden
		>
			<Icon height={3} as={Link} />
		</IconBox>
	);
};

export default LinkIcon;
