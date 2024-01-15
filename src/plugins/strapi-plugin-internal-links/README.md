# Strapi plugin internal-link

## Features

- 1 Adds a new custom field that can link to another entity within Strapi
- 2 Points to a configurable slug field to generate a link
- 3 Links are updated when the targeted entity changes

## Installation

To install this plugin, you need to add an NPM dependency to your Strapi application.

```sh
# Using Yarn
yarn add @webbio/strapi-plugin-internal-links

# Or using NPM
npm install @webbio/strapi-plugin-internal-links
```

## Configuration

`./config/plugins.ts`

```ts
export default ({ env }) => {
	// ...
	'internal-links': {
		enabled: true,
		config: {
			environment: 'test' // current environment which will affect the chosen domain,
			useSinglePageType: 'api::page.page', // Optional option to use a single page type like the page builder (without page builder options)
			defaultNoTitle: "undefined | boolean" // When enabled this will hide titles by default for the field
			enableUrlAddition: "undefined | boolean" // When enabled this will show an extra input for url additions. This text will be put at the end of the url. This can by used for url params.
			pageBuilder: {
				enabled: true, // When enabled, pageBuilder plugin logic is applied.
				pageUid: 'undefined | string',
				pathField: 'undefined | string',
				platformUid: 'undefined |string'
			},
			domains: {
				default: {
					test: 'https://webbio.nl',
					production: 'https://webbio.nl'
				}
			}
		}
	}
	// ...
});
```

Add the custom field with the content-type builder or directly to the JSON.

```json
// ...
"fieldName": {
	"type": "customField",
	"customField": "plugin::internal-links.internal-link",
	"options": {
		"title": "title", // uses this field to show the targeted entity's title (defaults to 'title')
		"slug": "slug", // uses this field to link to the targeted entity (defaults to 'path' for pagebuilder options. 	otherwise will default to 'fullPath')
		"noTitle": boolean // enable this to hide the title field
	},
}
// ...
```

Then, you'll need to build your admin panel:

```sh
# Using Yarn
yarn build

# Or using NPM
npm run build
```

## internal-links settings page

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nulla ex, maximus quis libero ut, aliquet tincidunt erat. Nulla ut eleifend est, non hendrerit ante. Duis convallis dui quam, quis vehicula sem pulvinar sed. Praesent sit amet lorem eleifend, rutrum mi et, efficitur dolor. Nullam ullamcorper, nisl ac vestibulum tincidunt, purus tellus bibendum ante, at bibendum dui tortor et lectus. Ut volutpat pellentesque aliquam. Nulla euismod nibh nec augue bibendum posuere. Integer tincidunt sagittis leo sed viverra. Ut urna lorem, consectetur sit amet volutpat ut, aliquet non nulla. Fusce varius nisi at nibh feugiat, nec porta justo porttitor. Vivamus eros arcu, congue et quam eu, finibus tincidunt justo. Proin nec tortor lectus. Duis at lectus neque. Duis rhoncus lorem sit amet est dignissim congue. Etiam mattis maximus urna sed euismod.
