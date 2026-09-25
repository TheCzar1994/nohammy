import { env } from '$env/dynamic/private';
import { twitch } from '$lib/config/twitch';
import type { TwitchClip, TwitchStream } from '$lib/types/twitch';

type TwitchTokenResponse = {
	access_token: string;
	expires_in: number;
	token_type: string;
};

type TwitchHelixStream = {
	id: string;
	title: string;
	game_name: string;
	viewer_count: number;
	started_at: string;
};

type TwitchStreamsResponse = {
	data: TwitchHelixStream[];
};

type TwitchHelixUser = {
	id: string;
	login: string;
	display_name: string;
};

type TwitchUsersResponse = {
	data: TwitchHelixUser[];
};

type TwitchHelixClip = {
	id: string;
	url: string;
	embed_url: string;
	broadcaster_id: string;
	broadcaster_name: string;
	creator_id: string;
	creator_name: string;
	video_id: string;
	game_id: string;
	language: string;
	title: string;
	view_count: number;
	created_at: string;
	thumbnail_url: string;
	duration: number;
	vod_offset: number | null;
	is_featured: boolean;
};

type TwitchClipsResponse = {
	data: TwitchHelixClip[];
	pagination: {
		cursor?: string;
	};
};

type CachedToken = {
	accessToken: string;
	expiresAt: number;
};

let cachedToken: CachedToken | null = null;
let cachedBroadcasterId: string | null = null;

function getCredentials() {
	const clientId = env.TWITCH_CLIENT_ID;
	const clientSecret = env.TWITCH_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('Twitch credentials are not configured');
	}

	return {
		clientId,
		clientSecret
	};
}

async function getAppAccessToken(fetchFn: typeof fetch): Promise<string> {
	const now = Date.now();

	if (cachedToken && cachedToken.expiresAt > now) {
		return cachedToken.accessToken;
	}

	const { clientId, clientSecret } = getCredentials();

	const response = await fetchFn('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'client_credentials'
		})
	});

	if (!response.ok) {
		throw new Error(`Failed to get Twitch access token: ${response.status}`);
	}

	const token = (await response.json()) as TwitchTokenResponse;

	cachedToken = {
		accessToken: token.access_token,
		expiresAt: now + Math.max(token.expires_in - 300, 60) * 1000
	};

	return cachedToken.accessToken;
}

async function twitchGet<T>(
	fetchFn: typeof fetch,
	path: string,
	retryOnUnauthorized = true
): Promise<T> {
	const { clientId } = getCredentials();
	const accessToken = await getAppAccessToken(fetchFn);

	const response = await fetchFn(`https://api.twitch.tv/helix/${path}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Client-Id': clientId
		}
	});

	if (response.status === 401 && retryOnUnauthorized) {
		cachedToken = null;
		return twitchGet<T>(fetchFn, path, false);
	}

	if (!response.ok) {
		throw new Error(`Twitch API request failed: ${response.status}`);
	}

	return (await response.json()) as T;
}

async function getBroadcasterId(fetchFn: typeof fetch): Promise<string> {
	if (cachedBroadcasterId) {
		return cachedBroadcasterId;
	}

	const params = new URLSearchParams({
		login: twitch.channel
	});

	const result = await twitchGet<TwitchUsersResponse>(fetchFn, `users?${params.toString()}`);

	const user = result.data[0];

	if (!user) {
		throw new Error(`Twitch user "${twitch.channel}" was not found`);
	}

	cachedBroadcasterId = user.id;

	return cachedBroadcasterId;
}

async function getFeaturedClips(
	fetchFn: typeof fetch,
	broadcasterId: string,
	first: number
): Promise<TwitchHelixClip[]> {
	const params = new URLSearchParams({
		broadcaster_id: broadcasterId,
		first: String(first),
		is_featured: 'true'
	});

	const result = await twitchGet<TwitchClipsResponse>(fetchFn, `clips?${params.toString()}`);

	return result.data;
}

function shuffle<T>(items: T[]): T[] {
	const shuffled = [...items];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
}

async function getClipsForWindow(
	fetchFn: typeof fetch,
	broadcasterId: string,
	days: number,
	first: number
): Promise<TwitchHelixClip[]> {
	const endedAt = new Date();
	const startedAt = new Date(endedAt.getTime() - days * 24 * 60 * 60 * 1000);

	const params = new URLSearchParams({
		broadcaster_id: broadcasterId,
		first: String(first),
		started_at: startedAt.toISOString(),
		ended_at: endedAt.toISOString(),
		is_featured: 'false'
	});

	const result = await twitchGet<TwitchClipsResponse>(fetchFn, `clips?${params.toString()}`);

	return result.data;
}

export async function getTwitchStream(fetchFn: typeof fetch): Promise<TwitchStream | null> {
	const params = new URLSearchParams({
		user_login: twitch.channel
	});

	const result = await twitchGet<TwitchStreamsResponse>(fetchFn, `streams?${params.toString()}`);

	const stream = result.data[0];

	if (!stream) {
		return null;
	}

	return {
		id: stream.id,
		title: stream.title,
		gameName: stream.game_name,
		viewerCount: stream.viewer_count,
		startedAt: stream.started_at
	};
}

export async function getTwitchClips(fetchFn: typeof fetch): Promise<TwitchClip[]> {
	const broadcasterId = await getBroadcasterId(fetchFn);

	// Featured clips are intentionally not restricted by age.
	// Pull a larger pool so different featured clips can be shown over time.
	const featuredClips = await getFeaturedClips(fetchFn, broadcasterId, 20);

	let clips = shuffle(featuredClips).slice(0, twitch.clips.count);

	// Fill any remaining slots with recent, non-featured clips.
	if (clips.length < twitch.clips.count) {
		const recentClips = await getClipsForWindow(
			fetchFn,
			broadcasterId,
			twitch.clips.windowDays,
			twitch.clips.count
		);

		clips = [...clips, ...recentClips].slice(0, twitch.clips.count);
	}

	// If we still do not have enough clips, widen the automatic
	// fallback window while avoiding duplicates.
	if (clips.length < twitch.clips.count) {
		const fallbackClips = await getClipsForWindow(
			fetchFn,
			broadcasterId,
			twitch.clips.fallbackWindowDays,
			10
		);

		const existingIds = new Set(clips.map((clip) => clip.id));

		const additionalClips = fallbackClips.filter((clip) => !existingIds.has(clip.id));

		clips = [...clips, ...additionalClips].slice(0, twitch.clips.count);
	}

	return clips.map((clip) => ({
		id: clip.id,
		url: clip.url,
		title: clip.title,
		creatorName: clip.creator_name,
		viewCount: clip.view_count,
		createdAt: clip.created_at,
		thumbnailUrl: clip.thumbnail_url,
		isFeatured: clip.is_featured
	}));
}
