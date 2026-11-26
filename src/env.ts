import { defineEnvVars } from '@sveltejs/kit/env';

// Cloudflare Pages preview builds do not have Twitch secrets.
// Keep them optional at build time; getCredentials() verifies them when an API request needs them.
export const variables = defineEnvVars({
	TWITCH_CLIENT_ID: {
		schema: (value) => value ?? ''
	},
	TWITCH_CLIENT_SECRET: {
		schema: (value) => value ?? ''
	}
});
