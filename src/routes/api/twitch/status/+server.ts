import { type RequestHandler } from '@sveltejs/kit';
import { getTwitchStream } from '#lib/server/twitch.ts';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=30'
	});

	try {
		const stream = await getTwitchStream(fetch);

		return Response.json({
			stream
		});
	} catch (error) {
		console.error('[Twitch] Failed to get stream status:', error);

		return Response.json(
			{
				stream: null,
				unavailable: true
			},
			{
				status: 503
			}
		);
	}
};
