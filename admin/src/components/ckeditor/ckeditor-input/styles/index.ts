import { createGlobalStyle } from 'styled-components';
import { style as common } from './common';
import { style as light } from './light';
import { style as dark } from './dark';
import { style as markdownStyles } from './markdown';

export const getGlobalStyling = (theme: any) => {
	let themeStyle: any = null;
	switch (theme) {
		case 'dark':
			themeStyle = dark;
			break;
		case 'light':
			themeStyle = light;
			break;
	}

	return createGlobalStyle`
		${common}
		${themeStyle}
		${markdownStyles}
  `;
};
