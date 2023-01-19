import { css } from 'styled-components';

export const style = css`
	// Hide options in Markdown editor
	.ck-markdown-active
		.ck.ck-toolbar[aria-label='Table toolbar']
		.ck-dropdown__panel
		.ck-list__item:first-child,
	.ck-markdown-active
		.ck.ck-toolbar[aria-label='Table toolbar']
		.ck-dropdown__panel
		.ck-list__separator {
		display: none;
	}
`;
