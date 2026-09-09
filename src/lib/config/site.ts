import { faDiscord, faTiktok, faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';

type SocialIcon = typeof faTwitch;

export type SocialLink = {
	label: string;
	handle: string;
	href: string;
	icon: SocialIcon;
};

export type Emote = {
	src: string;
	x: number;
	y: number;
	size: number;
	rotation: number;
	opacity?: number;
	hideOnMobile?: boolean;
};

export type SiteConfig = {
	name: string;
	tagline?: string;
	kicker?: string;
	description: string;
	socials: SocialLink[];
	emotes: Emote[];
};

export const site: SiteConfig = {
	name: 'nohammy',
	kicker: 'STREAMER • DBD • OLLIE',
	tagline: "Addicted to DBD and making it everyone's problem",
	description: 'Official website for nohammy',

	socials: [
		{
			label: 'Twitch',
			handle: '@nohammy',
			href: 'https://twitch.tv/nohammy',
			icon: faTwitch
		},
		{
			label: 'YouTube',
			handle: '@nohammy',
			href: 'https://youtube.com/@nohammy',
			icon: faYoutube
		},
		{
			label: 'TikTok',
			handle: '@nohammy4',
			href: 'https://tiktok.com/@nohammy4',
			icon: faTiktok
		},
		{
			label: 'Discord',
			handle: 'Join nohammy by daylight',
			href: 'https://discord.gg/Ff9W25Apn',
			icon: faDiscord
		}
	],

	emotes: [
		{
			src: '/emotes/nohammaccuse.webp',
			x: 12,
			y: 27,
			size: 120,
			rotation: -12
		},
		{
			src: '/emotes/nohammheart.webp',
			x: 27,
			y: 72,
			size: 105,
			rotation: 8
		},
		{
			src: '/emotes/nohammyfried.webp',
			x: 85,
			y: 25,
			size: 130,
			rotation: 10
		},
		{
			src: '/emotes/olliejustagirl.webp',
			x: 76,
			y: 76,
			size: 110,
			rotation: -8
		}
	]
};
