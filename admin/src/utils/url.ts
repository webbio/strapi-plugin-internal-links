const ALLOWED_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];

const isValidURL = (url) => {
	try {
		const parsedURL = new URL(url);
		if (!ALLOWED_PROTOCOLS.includes(parsedURL.protocol)) {
			return false;
		}
		return true;
	} catch (error) {
		return false;
	}
};

export default isValidURL;
