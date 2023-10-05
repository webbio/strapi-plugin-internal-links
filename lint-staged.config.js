module.exports = {
	'**/*.(ts|js)': () => `yarn lint`,
	'*.{js,css,md,ts,tsx,scss}': 'prettier --write'
};
