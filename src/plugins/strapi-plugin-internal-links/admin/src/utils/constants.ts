// We know, this file is also present on the server. But because of the -p tsconfig.admin.json (see package.json, it is needed to build the admin for use in other packages like tiptap)
// we need to duplicate this file here. Otherwise this ts file will be copied inside the dist folder of a .js file.
// This will break the running of the admin in the browser.
const DEFAULT_PAGEBUILDER_COLLECTION = 'api::page.page';
const DEFAULT_PAGEBUILDER_PATH_FIELD = 'path';
const DEFAULT_PAGEBUILDER_PLATFORM_UID = 'api::platform.platform';

export { DEFAULT_PAGEBUILDER_COLLECTION, DEFAULT_PAGEBUILDER_PATH_FIELD, DEFAULT_PAGEBUILDER_PLATFORM_UID };
