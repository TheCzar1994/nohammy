export const twitch = {
	channel: 'nohammy',
	url: 'https://twitch.tv/nohammy',
	pollIntervalMs: 60_000,

	clips: {
		count: 3,
		windowDays: 30,
		fallbackWindowDays: 90
	}
} as const;
