import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	TWITCH_CLIENT_ID: {},
	TWITCH_CLIENT_SECRET: {}
});
