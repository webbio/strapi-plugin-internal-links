module.exports = {
	'**/*.(ts|js)': () => `pnpm lint`,
	'*.{js,css,md,ts,tsx,scss}': 'prettier --write'
};
