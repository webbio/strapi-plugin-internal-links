import { useState, useEffect, useRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../../utils/get-trad';
import createInternalLink, { InternalLink } from '../internal-link-factory';

export interface IInternalLinkErrors {
	input?: string;
	text?: string;
	url?: string;
	link?: string;
}

export interface IUseInternalLinkInputReturn {
	link: InternalLink;
	setLink: React.Dispatch<React.SetStateAction<InternalLink>>;
	errors: IInternalLinkErrors;
	setErrors: React.Dispatch<React.SetStateAction<IInternalLinkErrors>>;
	initialLink: React.MutableRefObject<InternalLink>;
	isInitialData: boolean;
}

export const isJson = (string: string): boolean => {
	if (!string) return false;

	try {
		const parsed = JSON.parse(string);
		return Object.keys(parsed).length > 0;
	} catch (error) {
		return false;
	}
};

export const isInternalLink = (object: any): object is InternalLink => {
	return (
		'id' in object &&
		'sourceContentTypeUid' in object &&
		'sourceContentTypeId' in object &&
		'sourceFieldName' in object &&
		'url' in object &&
		'text' in object &&
		'type' in object
	);
};

const useInternalLinkInput = (
	initialValue: string,
	initialError: string | undefined,
	layoutUid: string,
	initialDataId: string,
	fieldName: string,
	initialText?: string
): IUseInternalLinkInputReturn => {
	const { formatMessage } = useIntl();
	const parsedInitialValue = useMemo((): InternalLink => {
		const initialValueIsJson = isJson(initialValue);
		const newInternalLink = createInternalLink(layoutUid, initialDataId, fieldName, initialText);

		if (!initialValueIsJson) return newInternalLink;

		const data = JSON.parse(initialValue);

		if (!isInternalLink(data)) return newInternalLink;

		if (data.sourceContentTypeUid && data.sourceContentTypeId && data.sourceFieldName) {
			return data;
		}

		return {
			...newInternalLink,
			url: data.url,
			text: data.text || data.url
		};
	}, []);

	const [link, setLink] = useState<InternalLink>(parsedInitialValue);
	const [errors, setErrors] = useState<IInternalLinkErrors>({
		text: undefined,
		url: initialError,
		link: undefined
	});

	const initialLink = useRef(link);
	const isInitialData = JSON.stringify(initialLink.current) === JSON.stringify(link);

	useEffect(() => {
		setErrors((previousValue) => ({
			...previousValue,
			url: initialError
				? formatMessage({
						id: getTrad(`internal-link.form.link.error`)
				  })
				: undefined
		}));
	}, [initialError]);

	return {
		link,
		setLink,
		errors,
		setErrors,
		initialLink,
		isInitialData
	};
};

export default useInternalLinkInput;
