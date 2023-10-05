if (process.env.HUSKY === '0') {
	process.exit(0);
}

const husky = require('husky');
husky.install(`${process.cwd()}/.husky`);
