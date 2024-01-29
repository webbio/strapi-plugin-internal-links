import styled, { css } from 'styled-components';

const LabelWrapper = styled.div`
	${({ theme }) => css`
		width: 100%;
		display: flex;
		gap: 4px;
		justify-content: space-between;
		color: ${theme.colors.neutral800};
		font-size: ${theme.fontSizes[1]};
		margin-bottom: 4px;
	`}
`;

const LabelWrapperStyles = {
	LabelWrapper
};

export default LabelWrapperStyles;
