export const serializeLink = (value) => {
	const stringified = JSON.stringify(value);
	const base64 = Buffer.from(stringified).toString('base64');
	return base64;
};

export const deserializeLink = (value) => {
	const stringified = Buffer.from(value, 'base64').toString();
	const parsed = JSON.parse(stringified);
	return parsed;
};
