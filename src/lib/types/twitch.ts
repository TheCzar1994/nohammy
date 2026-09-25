export type TwitchStream = {
	id: string;
	title: string;
	gameName: string;
	viewerCount: number;
	startedAt: string;
};

export type TwitchClip = {
	id: string;
	url: string;
	title: string;
	creatorName: string;
	viewCount: number;
	createdAt: string;
	thumbnailUrl: string;
	isFeatured: boolean;
};
