import type { RequestHandler } from './$types';
import maps from '$lib/data/dbd/maps.json';

export const prerender = false;

export const GET: RequestHandler = () => {
	if (maps.length === 0) {
		return new Response('No maps available.', {
			status: 503,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-store'
			}
		});
	}

	const randomIndex = Math.floor(Math.random() * maps.length);
	const map = maps[randomIndex];

	return new Response(map.name, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store, max-age=0',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
