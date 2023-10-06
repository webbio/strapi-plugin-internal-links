import { Common } from '@strapi/strapi';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import { DEFAULT_PAGEBUILDER_COLLECTION, DEFAULT_PAGEBUILDER_PATH_FIELD } from '../utils/constants';

const getGlobalConfig = () => {
	const config: Record<string, any> | undefined = strapi.config?.get('plugin.internal-links');

	if (config?.pageBuilder?.enabled) {
		if (!config?.pageBuilder?.pageUid) {
			set(config, 'pageBuilder.pageUid', DEFAULT_PAGEBUILDER_COLLECTION);
		}

		if (!config?.pageBuilder?.pathField) {
			set(config, 'pageBuilder.pathField', DEFAULT_PAGEBUILDER_PATH_FIELD);
		}
	}

	return isEmpty(config) ? null : config;
};
const getContentTypeConfig = (uid: Common.UID.ContentType) => {
	const config = strapi.contentType(uid).pluginOptions?.['internal-links'];
	return isEmpty(config) ? null : config;
};

export default {
	getGlobalConfig,
	getContentTypeConfig
};
