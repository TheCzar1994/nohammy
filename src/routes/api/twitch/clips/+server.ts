import { json, type RequestHandler } from '@sveltejs/kit';
import { getTwitchClips } from '$lib/server/twitch';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=300'
	});

	try {
		const clips = await getTwitchClips(fetch);

		return json({
			clips
		});
	} catch (error) {
		console.error('[Twitch] Failed to get clips:', error);

		return json(
			{
				clips: [],
				unavailable: true
			},
			{
				status: 503
			}
		);
	}
};
