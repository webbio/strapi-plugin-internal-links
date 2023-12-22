import React, { useEffect, useState } from 'react';
import { ClearIndicatorProps, DropdownIndicatorProps, GroupBase, components } from 'react-select';
import AsyncSelect, { AsyncProps } from 'react-select/async';

import { CarretDown, Cross } from '@strapi/icons';
import { FieldLabel } from '@strapi/design-system';

import S from './styles';
import { useReactSelectCustomStyles } from './react-select-custom-styles';

export interface IComboboxProps extends AsyncProps<IReactSelectValue, false, GroupBase<IReactSelectValue>> {
	customOption?: typeof components.Option<IReactSelectValue, false, GroupBase<IReactSelectValue>>;
	label?: string;
	id: string;
	extraLabelElement?: React.ReactNode;
	labelAction?: React.ReactNode;
	required?: boolean;
}

export interface IReactSelectValue {
	value: string;
	label: string;
	initialSelected?: boolean;
}

const Combobox = (props: IComboboxProps) => {
	const { label, customOption, extraLabelElement, labelAction, id, required, ...selectProps } = props;
	const styles = useReactSelectCustomStyles();
	const [inputValue, setInputValue] = useState<string | undefined>(props.inputValue);

	useEffect(() => {
		setInputValue(props.inputValue);
	}, [props.inputValue]);

	return (
		<S.Wrapper>
			{props.label && (
				<S.LabelWrapper>
					<FieldLabel action={labelAction} required={required}>
						{props.label}
					</FieldLabel>
					{extraLabelElement}
				</S.LabelWrapper>
			)}
			<AsyncSelect
				{...selectProps}
				inputId={id}
				isClearable
				onInputChange={(value, actionMeta) => {
					props.onInputChange?.(value, actionMeta);
					setInputValue(value);
				}}
				styles={styles}
				inputValue={inputValue}
				components={{
					IndicatorSeparator: null,
					ClearIndicator,
					DropdownIndicator,
					Option: props.customOption || components.Option
				}}
			/>
		</S.Wrapper>
	);
};

export { Combobox };

const ClearIndicator = (props: ClearIndicatorProps<IReactSelectValue, false>) => {
	return (
		<components.ClearIndicator {...props}>
			<Cross />
		</components.ClearIndicator>
	);
};

const DropdownIndicator = (props: DropdownIndicatorProps<IReactSelectValue, false>) => {
	return (
		<components.DropdownIndicator {...props}>
			<CarretDown />
		</components.DropdownIndicator>
	);
};
