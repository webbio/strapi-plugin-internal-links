import React from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../../utils/get-trad';
import { Label } from '../../label';
import { Field, FieldError, FieldInput, TabPanel, Box, Typography } from '@strapi/design-system';
import { IInternalLinkErrors } from '../../input/use-internal-link-input';
import { IInternalLink } from '../../factory';
import { IInternalLinkAttribute } from '../..';
import { ExternalApiSearch } from '../source-select';
import { IReactSelectValue } from '../../Combobox';

interface Props {
	link: IInternalLink;
	decisionTreeValue?: number;
	shouldShowTitle?: boolean;
	errors: IInternalLinkErrors;
	attributeOptions?: IInternalLinkAttribute['options'];
	onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onTextBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
	onLinkChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onLinkBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
	onSourceChange: (props: IReactSelectValue) => void;
	onDecisionTreeChange: (id: number, label: string, startPointReference?: string) => void;
	configApiUrl?: string;
}

export const SourceTab = ({
	link,
	shouldShowTitle,
	errors,
	onTextBlur,
	onTextChange,
	attributeOptions,
	onSourceChange,
	onDecisionTreeChange,
	configApiUrl
}: Props) => {
	const { formatMessage } = useIntl();
	return (
		<TabPanel>
			<Box color="neutral800" padding={4} background="neutral0">
				{shouldShowTitle && (
					<Field name="text" id="text" error={errors.text} required>
						<Label>
							{formatMessage({
								id: getTrad('internal-link.form.text')
							})}
						</Label>

						<FieldInput type="text" value={link.text} onChange={onTextChange} onBlur={onTextBlur} required />

						<FieldError />
					</Field>
				)}
				<Box paddingTop={4}>
					{!attributeOptions?.externalApi?.apiUrl && !configApiUrl && (
						<Box color="danger500">
							{formatMessage({
								id: getTrad('internal-link.options.source.apiUrl.error')
							})}
						</Box>
					)}

					{(attributeOptions?.externalApi?.apiUrl || configApiUrl) && (
						<ExternalApiSearch
							externalApiValuePath={attributeOptions?.externalApi?.valuePath}
							externalApiLabelPath={attributeOptions?.externalApi?.labelPath}
							externalApiUrl={attributeOptions?.externalApi?.apiUrl || configApiUrl!}
							externalApiLabelAdditionPath={attributeOptions?.externalApi?.labelAdditionPath}
							selectedValue={link}
							onChange={(value) =>
								onSourceChange({
									value: value?.value,
									label: value?.label,
									startPointReference: value?.startPointReference
								})
							}
							onDecisionTreeChange={onDecisionTreeChange}
						/>
					)}
				</Box>
			</Box>
		</TabPanel>
	);
};
