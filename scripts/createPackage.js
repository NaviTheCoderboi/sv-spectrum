import fs from 'node:fs/promises';
import path from 'node:path';

const PACKAGE_NAME = 'foo';

const packageJson = {
	name: '@sv-aria/foo',
	version: '1.0.0',
	author: {
		name: 'NaviTheCoderboi',
		url: 'https://github.com/NaviTheCoderboi',
	},
	repository: {
		type: 'git',
		url: 'git://github.com/NaviTheCoderboi/sv-aria',
		directory: 'packages/foo',
	},
	main: 'src/index.ts',
	type: 'module',
	license: 'MIT',
	exports: {
		'.': {
			import: './dist/index.js',
			types: './dist/index.d.ts',
			default: './dist/index.js',
		},
	},
	scripts: {
		typecheck: 'tsc --noEmit',
		build: 'sucker bundle ./src -ts ./tsconfig.json -o ./dist -p neutral -c -d',
	},
	publishConfig: {
		access: 'public',
	},
	devDependencies: {
		svelte: '5.0.0-next.233',
	},
	peerDependencies: {
		svelte: '5.0.0-next.233',
	},
};

const tsconfigJson = {
	extends: '../../tsconfig.base.json',
	include: ['src/**/*'],
	exclude: ['node_modules', 'dist'],
};

await fs.mkdir(
	path.join(import.meta.dirname, `../packages/${PACKAGE_NAME}/src`),
	{ recursive: true },
);
await fs.writeFile(
	path.join(import.meta.dirname, `../packages/${PACKAGE_NAME}/package.json`),
	JSON.stringify(packageJson, null, 4),
);

await fs.writeFile(
	path.join(import.meta.dirname, `../packages/${PACKAGE_NAME}/tsconfig.json`),
	JSON.stringify(tsconfigJson, null, 4),
);

await fs.writeFile(
	path.join(import.meta.dirname, `../packages/${PACKAGE_NAME}/src/index.ts`),
	``,
);
