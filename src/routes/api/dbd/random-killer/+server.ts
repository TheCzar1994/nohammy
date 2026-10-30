import type { RequestHandler } from './$types';
import killers from '$lib/data/dbd/killers.json';

export const prerender = false;

export const GET: RequestHandler = () => {
	if (killers.length === 0) {
		return new Response('No killers available.', {
			status: 503,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-store'
			}
		});
	}

	const randomIndex = Math.floor(Math.random() * killers.length);
	const killer = killers[randomIndex];

	return new Response(killer.name, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store, max-age=0',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
