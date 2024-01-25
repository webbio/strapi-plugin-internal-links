const getLinkWithAddition = (url?: string, urlAddition?: string): string => [url, urlAddition].filter(Boolean).join('');

export { getLinkWithAddition };
