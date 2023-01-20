import { useState, useEffect, useRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../../utils/get-trad';
import createInternalLink from '../internal-link-factory';

export const isJson = (string: string) => {
	if (!string) return false;

	try {
		const parsed = JSON.parse(string);
		return Object.keys(parsed).length > 0;
	} catch (error) {
		return false;
	}
};

const useInternalLinkInput = (
	initialValue: any,
	initialError: any,
	layoutUid: string,
	initialDataId: string,
	fieldName: string,
	initialText?: string
) => {
	const { formatMessage } = useIntl();
	const parsedInitialValue = useMemo(() => {
		const initialValueIsJson = isJson(initialValue);
		const newInternalLink = createInternalLink(
			layoutUid,
			initialDataId,
			fieldName,
			initialText
		);

		if (!initialValueIsJson) return newInternalLink;

		const data = JSON.parse(initialValue);

		if (
			data.sourceContentTypeUid &&
			data.sourceContentTypeId &&
			data.sourceFieldName
		) {
			return data;
		} else if (data.url) {
			return {
				...newInternalLink,
				url: data.url,
				text: data.text || data.url,
			};
		} else {
			return newInternalLink;
		}
	}, []);

	const [link, setLink] = useState(parsedInitialValue);
	const [errors, setErrors] = useState({
		text: undefined,
		url: initialError,
		link: undefined,
	});

	const initialLink = useRef(link);
	const isInitialData =
		JSON.stringify(initialLink.current) === JSON.stringify(link);

	useEffect(() => {
		setErrors((previousValue) => ({
			...previousValue,
			url: initialError
				? formatMessage({
						id: getTrad(`internal-link.form.link.error`),
				  })
				: undefined,
		}));
	}, [initialError]);

	return {
		link,
		setLink,
		errors,
		setErrors,
		initialLink,
		isInitialData,
	};
};

export default useInternalLinkInput;
