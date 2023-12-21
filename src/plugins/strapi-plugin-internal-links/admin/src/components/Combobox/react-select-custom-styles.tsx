// @ts-nocheck
import { StylesConfig } from 'react-select';
import { useTheme } from 'styled-components';
import { IReactSelectValue } from '.';

export const useReactSelectCustomStyles = (): StylesConfig<IReactSelectValue, false> => {
	const theme = useTheme() as Record<string, any>;

	return {
		control: (provided, { isFocused, isDisabled }) => ({
			...provided,
			color: theme.colors.neutral800,
			backgroundColor: theme.colors.neutral0,
			minHeight: '40px',
			lineHeight: 1.4,
			borderRadius: theme.borderRadius,
			fontSize: theme.fontSizes[2],
			borderColor: isFocused ? theme.colors.buttonPrimary600 : theme.colors.neutral200,
			boxShadow: isFocused ? `${theme.colors.buttonPrimary600} 0px 0px 0px 2px` : 'none',

			':hover': {
				borderColor: isFocused ? theme.colors.buttonPrimary600 : theme.colors.neutral200
			}
		}),

		input: (provided, {}) => ({
			...provided,
			color: theme.colors.neutral800
		}),
		singleValue: (provided, {}) => ({
			...provided,
			color: theme.colors.neutral800
		}),
		placeholder: (provided) => ({
			...provided,
			color: theme.colors.neutral500
		}),
		menu: (provided) => ({
			...provided,
			border: `1px solid ${theme.colors.neutral150}`,
			boxShadow: '0px 1px 4px rgba(33, 33, 52, 0.1)',
			borderRadius: theme.borderRadius,
			backgroundColor: theme.colors.neutral0
		}),
		menuList: (provided) => ({
			...provided,
			paddingLeft: '4px',
			paddingRight: '4px'
		}),
		option: (provided, { isFocused, isSelected, isDisabled }) => ({
			...provided,
			backgroundColor: isFocused ? theme.colors.primary100 : 'transparent',
			fontSize: theme.fontSizes[2],
			borderRadius: theme.borderRadius,
			color: isSelected ? theme.colors.buttonPrimary600 : theme.colors.neutral800,
			fontWeight: isSelected ? 700 : 400,
			minHeight: '40px',
			display: 'flex',
			justifyContent: 'center',
			flexDirection: 'column',
			gap: '4px',
			opacity: isDisabled ? 0.7 : 1,

			'span:not(:first-of-type)': {
				fontSize: theme.fontSizes[1],
				color: theme.colors.neutral500
			},

			'&:active': {
				backgroundColor: theme.colors.primary100
			}
		}),
		loadingIndicator: (provided) => ({
			...provided,
			'>span': {
				backgroundColor: theme.colors.buttonPrimary600
			}
		}),
		loadingMessage: (provided) => ({
			...provided,
			color: theme.colors.neutral500
		}),
		noOptionsMessage: (provided) => ({
			...provided,
			color: theme.colors.neutral500
		}),
		clearIndicator: (provided, { isFocused }) => ({
			...provided,
			cursor: 'pointer',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			paddingLeft: '6px',
			paddingRight: '6px',
			svg: {
				width: '0.6875rem',
				path: {
					fill: theme.colors.neutral600
				}
			},
			':hover svg path': {
				fill: theme.colors.neutral700
			}
		}),

		dropdownIndicator: (provided, { isFocused }) => ({
			...provided,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			paddingLeft: '6px',
			paddingRight: '12px',
			svg: {
				width: '0.375rem',
				path: {
					fill: theme.colors.neutral600
				}
			}
		})
	};
};
