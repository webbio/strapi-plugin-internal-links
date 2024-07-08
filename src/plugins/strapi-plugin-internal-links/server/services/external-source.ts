type ExternalApiData = {
	url: string;
	searchQuery: string;
	questionaireId: number;
};

const getexternalApiData = async (data: ExternalApiData) => {
	const url = createUrl(data);
	// @ts-ignore
	const result = await (await fetch(url)).json();
	return result;
};

const createUrl = (data: ExternalApiData) => {
	console.log('CREATE URL', `${data.url}${data.searchQuery}&filter.questionaire=${data.questionaireId}`);
	return `${data.url}${data.searchQuery}&filter.questionaire=${data.questionaireId}`;
};

export default {
	getexternalApiData
};
