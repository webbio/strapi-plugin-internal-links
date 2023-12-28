export interface GlobalPluginConfig {
	environment?: string;
	useSinglePageType?: string; // Optional option to use a single page type like the page builder (without page builder options) eg. 'api::page.page'
	pageBuilder?: {
		enabled?: boolean; // When enabled, pageBuilder plugin logic is applied.
		pageUid?: string;
		pathField?: string;
		platformUid?: string;
	};
	defaultNoTitle?: boolean;
	domains?: Record<string, any>;
}
