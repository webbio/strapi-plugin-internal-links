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

const ComboboxStyles = {
	Wrapper,
	Option
};

export default ComboboxStyles;
