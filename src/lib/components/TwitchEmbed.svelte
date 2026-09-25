<script lang="ts">
	import { onMount } from 'svelte';

	let { channel }: { channel: string } = $props();

	const EMBED_SCRIPT = 'https://embed.twitch.tv/embed/v1.js';
	const EMBED_ID = 'twitch-live-embed';

	type TwitchWindow = Window & {
		Twitch?: {
			Embed: new (
				elementId: string,
				options: {
					width: string;
					height: string;
					channel: string;
					layout: string;
					autoplay: boolean;
					muted: boolean;
					theme: string;
					parent: string[];
				}
			) => unknown;
		};
	};

	function loadTwitchScript(): Promise<void> {
		const twitchWindow = window as TwitchWindow;

		if (twitchWindow.Twitch?.Embed) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SCRIPT}"]`);

			if (existing) {
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener(
					'error',
					() => reject(new Error('Failed to load Twitch embed script')),
					{ once: true }
				);

				return;
			}

			const script = document.createElement('script');

			script.src = EMBED_SCRIPT;
			script.async = true;

			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener(
				'error',
				() => reject(new Error('Failed to load Twitch embed script')),
				{ once: true }
			);

			document.head.appendChild(script);
		});
	}

	onMount(() => {
		let cancelled = false;

		async function createEmbed() {
			try {
				await loadTwitchScript();

				if (cancelled) return;

				const twitchWindow = window as TwitchWindow;

				if (!twitchWindow.Twitch?.Embed) {
					throw new Error('Twitch embed API is unavailable');
				}

				new twitchWindow.Twitch.Embed(EMBED_ID, {
					width: '100%',
					height: '100%',
					channel,
					layout: 'video',
					autoplay: false,
					muted: false,
					theme: 'dark',
					parent: [window.location.hostname]
				});
			} catch (error) {
				console.error('[Twitch] Failed to create embed:', error);
			}
		}

		void createEmbed();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="twitch-embed">
	<div id={EMBED_ID}></div>
</div>

<style lang="scss">
	.twitch-embed {
		position: relative;
		width: 100%;
		min-height: 300px;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #000;
	}

	#twitch-live-embed {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	:global(#twitch-live-embed iframe) {
		width: 100% !important;
		height: 100% !important;
		border: 0;
	}
</style>
