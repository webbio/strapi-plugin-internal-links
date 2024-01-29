import React from 'react';

import { FieldLabel } from '@strapi/design-system';

import S from './styles';

interface Props extends Record<string, any> {
	children?: React.ReactNode;
}

export const Label = ({ children, rest }: Props) => {
	return (
		<S.LabelWrapper>
			<FieldLabel {...rest}>{children}</FieldLabel>
		</S.LabelWrapper>
	);
};
