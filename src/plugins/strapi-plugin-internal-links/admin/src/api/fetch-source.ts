import getRequestUrl from '../utils/get-request-url';

type FetchSourceParams = {
	fetchClient: any;
	externalApiUrl: string;
	inputValue: string;
	questionaireId: number;
};

type FetchQuestionairesParams = {
	fetchClient: any;
	questionaireUrl: string;
};

export type ExternalApiResult = {
	data: Record<string, any>;
};

export const fetchSource = async ({
	fetchClient,
	externalApiUrl,
	inputValue,
	questionaireId
}: FetchSourceParams): Promise<ExternalApiResult | undefined> => {
	try {
		if (!externalApiUrl) {
			throw new Error('No URL field set in settings');
		}
		const { post } = fetchClient;
		const result = await post(getRequestUrl('source'), {
			data: {
				url: externalApiUrl,
				searchQuery: inputValue,
				questionaireId: questionaireId
			}
		});

		return result;
	} catch {
		return undefined;
	}
};
export const fetchQuestionaires = async ({
	fetchClient,
	questionaireUrl
}: FetchQuestionairesParams): Promise<ExternalApiResult | undefined> => {
	try {
		if (!questionaireUrl) {
			throw new Error('No URL field set in settings');
		}
		const { post } = fetchClient;
		const result = await post(getRequestUrl('source'), {
			data: {
				url: questionaireUrl
			}
		});

		return result;
	} catch {
		return undefined;
	}
};
