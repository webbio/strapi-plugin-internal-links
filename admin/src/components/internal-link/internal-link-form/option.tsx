import React from 'react';
import { components, OptionProps } from 'react-select';
import { Typography, Stack } from '@strapi/design-system';
import PublishStateIcon from '../publish-state-icon';

interface IOptionProps extends OptionProps {
	isFocused: boolean;
	data: {
		displayName: string;
		kind: string;
		label: string;
		slugLabel: string;
		slugField: string;
		titleField: string;
		uid: string;
		value: string;
		publishedAt: string;
		showIndicator: boolean;
	};
}

const Option = (props: IOptionProps): JSX.Element => {
	const { label, slugLabel, publishedAt } = props.data;
	const Component = components.Option;

	return (
		<Component {...props}>
			<Stack horizontal gap={4}>
				{props.data.showIndicator && <PublishStateIcon isPublished={!!publishedAt} />}
				<div style={{ width: '330px' }}>
					<Typography ellipsis>{label}</Typography>
				</div>
				<div style={{ width: '330px' }}>
					<Typography textColor="neutral600" style={{ fontWeight: 400 }}>
						{slugLabel ? `/${slugLabel}` : ''}
					</Typography>
				</div>
			</Stack>
		</Component>
	);
};

export default Option;
