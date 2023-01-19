# Strapi plugin internal-link

## Features

- 1
- 2
- 3

## Installation

To install this plugin, you need to add an NPM dependency to your Strapi application.

```sh
# Using Yarn
yarn add @webbio/strapi-plugin-internal-links

# Or using NPM
npm install @webbio/strapi-plugin-internal-links
```

## How it works

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nulla ex, maximus quis libero ut, aliquet tincidunt erat. Nulla ut eleifend est, non hendrerit ante. Duis convallis dui quam, quis vehicula sem pulvinar sed. Praesent sit amet lorem eleifend, rutrum mi et, efficitur dolor. Nullam ullamcorper, nisl ac vestibulum tincidunt, purus tellus bibendum ante, at bibendum dui tortor et lectus. Ut volutpat pellentesque aliquam. Nulla euismod nibh nec augue bibendum posuere. Integer tincidunt sagittis leo sed viverra. Ut urna lorem, consectetur sit amet volutpat ut, aliquet non nulla. Fusce varius nisi at nibh feugiat, nec porta justo porttitor. Vivamus eros arcu, congue et quam eu, finibus tincidunt justo. Proin nec tortor lectus. Duis at lectus neque. Duis rhoncus lorem sit amet est dignissim congue. Etiam mattis maximus urna sed euismod.

## Configuration

`./config/plugins.js`

```js
module.exports = ({ env }) => ({
	// ...
	internal-links: {
		enabled: true,
		config: {
			// ...
		}
	}
	// ...
});
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
