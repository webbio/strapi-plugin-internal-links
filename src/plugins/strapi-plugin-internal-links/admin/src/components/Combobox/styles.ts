import styled, { css } from 'styled-components';

const Wrapper = styled.div`
	${({ theme }) => css`
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 4px;
	`}
`;

const Option = styled.span`
	display: flex;
	flex-direction: column;
`;

const LabelWrapper = styled.div`
	${({ theme }) => css`
		width: 100%;
		display: flex;
		gap: 4px;
		justify-content: space-between;
		color: ${theme.colors.neutral800};
		font-size: ${theme.fontSizes[1]};
	`}
`;

const ComboboxStyles = {
	Wrapper,
	Option,
	LabelWrapper
};

export default ComboboxStyles;
