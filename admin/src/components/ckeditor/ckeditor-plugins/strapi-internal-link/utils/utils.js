import { upperFirst } from 'lodash-es';

const ATTRIBUTE_WHITESPACES =
	/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex
const SAFE_URL =
	/^(?:(?:https?|ftps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;
const EMAIL_REG_EXP =
	/^[\S]+@((?![-_])(?:[-\w\u00a1-\uffff]{0,63}[^-_]\.))+(?:[a-z\u00a1-\uffff]{2,})$/i;
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

export const LINK_KEYSTROKE = 'Ctrl+K';

export const ATTRIBUTE_NAME = 'linkHref';

export function isLinkElement(node) {
	return node.is('attributeElement') && !!node.getCustomProperty('link');
}

export function createLinkElement(data, { writer }) {
	const linkElement = writer.createAttributeElement(
		'a',
		{ href: data?.href, ['data-internal-link']: data?.json },
		{ priority: 5 }
	);

	writer.setCustomProperty('link', true, linkElement);

	return linkElement;
}

export function ensureSafeUrl(url) {
	url = String(url);
	return isSafeUrl(url) ? url : '#';
}

function isSafeUrl(url) {
	const normalizedUrl = url.replace(ATTRIBUTE_WHITESPACES, '');
	return normalizedUrl.match(SAFE_URL);
}

export function getLocalizedDecorators(t, decorators) {
	const localizedDecoratorsLabels = {
		'Open in a new tab': t('Open in a new tab'),
		Downloadable: t('Downloadable'),
	};

	decorators.forEach((decorator) => {
		if (decorator.label && localizedDecoratorsLabels[decorator.label]) {
			decorator.label = localizedDecoratorsLabels[decorator.label];
		}
		return decorator;
	});

	return decorators;
}

export function normalizeDecorators(decorators) {
	const retArray = [];

	if (decorators) {
		for (const [key, value] of Object.entries(decorators)) {
			const decorator = Object.assign({}, value, {
				id: `link${upperFirst(key)}`,
			});
			retArray.push(decorator);
		}
	}

	return retArray;
}

export function isLinkableElement(element, schema) {
	if (!element) {
		return false;
	}

	return schema.checkAttribute(element.name, ATTRIBUTE_NAME);
}

export function isEmail(value) {
	return EMAIL_REG_EXP.test(value);
}

export function addLinkProtocolIfApplicable(link, defaultProtocol) {
	const protocol = isEmail(link) ? 'mailto:' : defaultProtocol;
	const isProtocolNeeded = !!protocol && !linkHasProtocol(link);

	return link && isProtocolNeeded ? protocol + link : link;
}

export function linkHasProtocol(link) {
	return PROTOCOL_REG_EXP.test(link);
}

export function openLink(link) {
	window.open(link, '_blank', 'noopener');
}

export function encodeAttributes(attributeObject) {
	if (!attributeObject) return '';

	try {
		const json = JSON.stringify(attributeObject);
		const encodedJson = Buffer.from(json).toString('base64');
		return encodedJson;
	} catch (error) {
		console.error(error);
		return '';
	}
}

export function decodeAttributes(base64String) {
	if (!base64String) return undefined;

	try {
		const decodedJson = Buffer(base64String, 'base64').toString('ascii');
		return decodedJson;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
