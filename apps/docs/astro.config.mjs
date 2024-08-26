import svelte from '@astrojs/svelte';
import liveCode from 'astro-live-code';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	site: 'https://sv-aria.vercel.app/',
	integrations: [
		liveCode({
			layout: '/src/components/LiveCodeLayout.astro',
		}),
		starlight({
			title: 'Svelte Aria',
			logo: {
				src: './src/assets/svelte-aria.png',
			},
			customCss: [
				'./src/styles/tailwind.css',
				'./src/styles/fonts.css',
				'./src/styles/colors.css',
				'./src/styles/colors.css',
				'./src/styles/customize.css',
			],
			components: {
				SiteTitle: './src/components/Title.astro',
				Head: './src/components/Head.astro',
				Search: './src/components/Search.astro',
			},
			social: {
				github: 'https://github.com/NaviTheCoderboi/sv-aria',
			},
			sidebar: [
				{
					label: 'Overview',
					items: [
						{
							label: 'Introduction',
							slug: 'overview/introduction',
						},
						{
							label: 'Getting Started',
							slug: 'overview/getting-started',
						},
					],
				},
				{
					label: 'Guides',
					autogenerate: {
						directory: 'guides',
					},
				},
				{
					label: 'Interactions',
					autogenerate: {
						directory: 'interactions',
					},
				},
			],
			expressiveCode: {
				themes: ['houston', 'one-light'],
				useStarlightDarkModeSwitch: true,
			},
		}),
		tailwind({
			applyBaseStyles: false,
		}),
		svelte(),
	],
	output: 'static',
});
