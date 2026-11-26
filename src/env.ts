import { defineEnvVars } from '@sveltejs/kit/env';

// @migration-task Review dynamic environment variables. They accept missing values (`undefined`), add stricter validation where a value is required.
export const variables = defineEnvVars({
	TWITCH_CLIENT_ID: { schema: (input) => input },
	TWITCH_CLIENT_SECRET: { schema: (input) => input }
});
