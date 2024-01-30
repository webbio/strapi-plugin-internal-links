import React from 'react';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';

import { IReactSelectValue } from '../../Combobox';
import { useGetLocales } from '../../../api/locales';
import S from './styles';

export interface LocaleReactSelectValue extends Omit<IReactSelectValue, 'initialSelected'> {
	id: number;
	name?: string;
	isDefault?: boolean;
}

interface Props {
	isDisabled?: boolean;
	onChange: (newValue?: string) => void;
	value?: string;
	isLoadingValue?: boolean;
}

export const LocaleSelect = ({ onChange, isDisabled, value, isLoadingValue }: Props) => {
	const { data: allLocales } = useGetLocales({});

	const handleChange = (item?: string) => {
		onChange(item);
	};

	return (
		<S.LocaleSelectWrapper>
			<SingleSelect
				required
				disabled={isLoadingValue || isDisabled || (allLocales || [])?.length < 2}
				value={value}
				onChange={handleChange}
			>
				{(allLocales || []).map((l, index) => (
					<SingleSelectOption value={l.code} key={index}>
						{l.code.toLocaleUpperCase()}
					</SingleSelectOption>
				))}
			</SingleSelect>
		</S.LocaleSelectWrapper>
	);
};
