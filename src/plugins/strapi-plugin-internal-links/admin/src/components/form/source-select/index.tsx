import React from 'react';
import { useIntl } from 'react-intl';
import debounce from 'lodash/debounce';
import objGet from 'lodash/get';
import { useFetchClient } from '@strapi/helper-plugin';
import { SingleSelect, SingleSelectOption, Flex, FieldLabel, Box } from '@strapi/design-system';
import { Combobox, IReactSelectValue } from '../../Combobox';
import getTrad from '../../../utils/get-trad';
import { Label } from '../../label';
import { ExternalApiResult, fetchQuestionaires, fetchSource } from '../../../api/fetch-source';
import { IInternalLink } from '../../factory';
import { useGetConfig } from '../../../api/config';

const SEARCH_DEBOUNCE_MS = 150;

interface Props {
	selectedValue?: IInternalLink;
	externalApiUrl: string;
	externalApiLabelPath?: string;
	externalApiValuePath?: string;
	externalApiLabelAdditionPath?: string;
	onChange: (item?: Record<string, any>) => void;
	onDecisionTreeChange: (id: number, label?: string) => void;
}

export interface PageReactSelectValue extends Omit<IReactSelectValue, 'initialSelected'> {
	subTitle?: string;
	externalLabel?: string;
}

export const ExternalApiSearch = ({
	onChange,
	onDecisionTreeChange,
	selectedValue,
	externalApiUrl,
	externalApiLabelPath,
	externalApiValuePath,
	externalApiLabelAdditionPath
}: Props) => {
	const { formatMessage } = useIntl();
	const fetchClient = useFetchClient();
	const mappedSelectedValue = mapSelectItem(selectedValue);

	const { data: pluginConfig } = useGetConfig({});

	const questionaireUrl = pluginConfig?.externalApi?.questionaireUrl;

	const [decisionTrees, setDecisionTrees] = React.useState<Record<string, any>[]>([]);
	const [decisionTreeItems, setDecisionTreeItems] = React.useState<React.ReactElement>(<></>);

	React.useEffect(() => {
		if (!questionaireUrl) return;
		getDecisionTrees();
	}, [questionaireUrl]);

	const getDecisionTrees = async (): Promise<void> => {
		if (questionaireUrl === undefined) return;

		const result = await fetchQuestionaires({ fetchClient, questionaireUrl });

		setDecisionTrees(result?.data.data || []);

		setDecisionTreeItems(
			<>
				<SingleSelectOption key="none" value={1}>
					Toon alle adviesbomen
				</SingleSelectOption>
				{result?.data.data.map((item: Record<string, any>) => (
					<SingleSelectOption key={item.id} value={item.id}>
						{item.title}
					</SingleSelectOption>
				))}
			</>
		);
	};

	const getItems = async (inputValue: string): Promise<IReactSelectValue[]> => {
		if (!externalApiUrl) {
			throw new Error('No URL field set in settings');
		}

		const externalItems = await fetchSource({
			fetchClient,
			externalApiUrl,
			inputValue,
			questionaireId: Number(selectedValue?.decisionTreeId)
		});
		if (!externalItems || !externalApiLabelPath || !externalApiValuePath) {
			return [];
		}

		// fetch gives data back, but some apis gives also data back so you get data.data
		const data = checkData(externalItems);

		const mappedData = data.map((item: Record<string, any>) => ({
			value: objGet(item, externalApiValuePath),
			label: externalApiLabelAdditionPath
				? `${objGet(item, externalApiLabelAdditionPath)} - ${objGet(item, externalApiLabelPath)}`
				: objGet(item, externalApiLabelPath),
			startPointReference: item.startPointReference
		}));

		return mappedData;
	};

	const handleChange = (item?: IReactSelectValue) => onChange(item);

	const getExternalData = debounce((searchTerm, callback) => {
		promiseOptions(searchTerm).then((result) => {
			return callback(result || []);
		});
	}, SEARCH_DEBOUNCE_MS);

	const promiseOptions = (inputValue: string): Promise<IReactSelectValue[]> =>
		new Promise<IReactSelectValue[]>((resolve) => {
			resolve(getItems(inputValue));
		});

	return (
		<Flex direction="column" width="100%">
			<Label>
				<FieldLabel required>
					{formatMessage({
						id: getTrad('internal-link.form.source.start')
					})}
				</FieldLabel>
			</Label>
			<Box width="100%" gap={2} marginBottom={4}>
				<SingleSelect
					style={{ width: '100%' }}
					width="100%"
					fullWidth
					defaultValue={null}
					onChange={(value: any) => {
						handleChange(undefined);
						let label = '';
						if (value == 1) {
							label = 'Begin van beslisboom';
						} else {
							label = decisionTrees.find((item) => item.id == value)?.title || '';
						}

						onDecisionTreeChange(value, label);
					}}
					key={'DecisionTreeSelect'}
					value={selectedValue?.decisionTreeId}
					placeholder={'Kies een adviesboom'}
				>
					{decisionTreeItems}
				</SingleSelect>
			</Box>

			{selectedValue?.decisionTreeId && selectedValue?.decisionTreeId != 1 ? (
				<Flex width="100%" gap={2}>
					<Combobox
						key={`externalApiSearch`}
						id="externalApiSearch"
						loadOptions={(searchTerm, callback) => getExternalData(searchTerm, callback)}
						cacheOptions={false}
						// @ts-ignore onChange is correct
						onChange={handleChange}
						value={mappedSelectedValue}
						placeholder={formatMessage({
							id: getTrad('internal-link.form.source.placeholder')
						})}
						required
					/>
				</Flex>
			) : (
				<></>
			)}
		</Flex>
	);
};

function mapSelectItem(value?: IInternalLink): IReactSelectValue | null {
	return value?.externalApiLabel && value?.externalApiValue
		? {
				value: value.externalApiValue,
				label: value.externalApiLabel,
				startPointReference: value.startPointReference || ''
		  }
		: null;
}

function checkData(externalItems: ExternalApiResult) {
	if (externalItems.data.data) {
		return externalItems.data.data;
	}
	return externalItems.data;
}
