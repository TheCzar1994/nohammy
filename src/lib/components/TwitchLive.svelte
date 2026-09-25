<script lang="ts">
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { faTwitch } from '@fortawesome/free-brands-svg-icons';
	import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

	import TwitchEmbed from '$lib/components/TwitchEmbed.svelte';
	import TwitchClips from '$lib/components/TwitchClips.svelte';
	import { twitch } from '$lib/config/twitch';
	import type { TwitchStream } from '$lib/types/twitch';

	let stream = $state<TwitchStream | null>(null);
	let loaded = $state(false);
	let canEmbed = $state(true);

	async function refreshStream() {
		try {
			const response = await fetch('/api/twitch/status', {
				headers: {
					Accept: 'application/json'
				}
			});

			// If Twitch itself is temporarily unavailable, preserve whatever
			// state we already have instead of incorrectly showing offline.
			if (!response.ok) {
				return;
			}

			const result = (await response.json()) as {
				stream: TwitchStream | null;
			};

			stream = result.stream;
			loaded = true;
		} catch (error) {
			console.error('[Twitch] Failed to refresh stream status:', error);
		}
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(min-width: 440px)');

		function updateEmbedAvailability() {
			canEmbed = mediaQuery.matches;
		}

		updateEmbedAvailability();
		mediaQuery.addEventListener('change', updateEmbedAvailability);

		void refreshStream();

		const interval = window.setInterval(refreshStream, twitch.pollIntervalMs);

		return () => {
			window.clearInterval(interval);
			mediaQuery.removeEventListener('change', updateEmbedAvailability);
		};
	});
</script>

{#if loaded && stream}
	<article class="twitch-live" aria-live="polite">
		<header class="twitch-live__header">
			<div class="twitch-live__heading">
				<div class="twitch-live__status">
					<span class="twitch-live__dot" aria-hidden="true"></span>
					Live now
				</div>

				<div>
					<h2>nohammy is live</h2>

					<p class="twitch-live__meta">
						{stream.gameName}
						<span aria-hidden="true">•</span>
						{stream.viewerCount.toLocaleString()} watching
					</p>
				</div>
			</div>

			<a class="twitch-live__button" href={twitch.url} target="_blank" rel="noreferrer">
				<Fa icon={faTwitch} />
				Open Twitch
				<Fa icon={faUpRightFromSquare} />
			</a>
		</header>

		<p class="twitch-live__title">{stream.title}</p>

		{#if canEmbed}
			<div class="twitch-live__player">
				<TwitchEmbed channel={twitch.channel} />
			</div>
		{:else}
			<a class="twitch-live__mobile" href={twitch.url} target="_blank" rel="noreferrer">
				<Fa icon={faTwitch} />
				Watch live on Twitch
			</a>
		{/if}
	</article>
{:else if loaded}
	<TwitchClips />
{/if}

<style lang="scss">
	.twitch-live {
		margin-bottom: 0.8rem;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--accent) 38%, var(--border));
		border-radius: 1.1rem;
		background: var(--surface);
		backdrop-filter: blur(16px);
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
	}

	.twitch-live__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.3rem 1.5rem 0;
	}

	.twitch-live__heading {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 0;
	}

	.twitch-live__status {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.65rem;
		border-radius: 999px;
		background: rgba(239, 68, 68, 0.13);
		color: #ff7373;
		font-size: 0.7rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.twitch-live__dot {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 0 0.2rem rgba(255, 115, 115, 0.12);
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.twitch-live__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0.3rem 0 0;
		color: var(--text-muted);
		font-size: 0.82rem;
	}

	.twitch-live__button,
	.twitch-live__mobile {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		border-radius: 0.8rem;
		background: var(--accent);
		color: #fff;
		font-weight: 750;
		text-decoration: none;
		transition:
			filter 150ms ease,
			transform 150ms ease;
	}

	.twitch-live__button {
		flex-shrink: 0;
		padding: 0.75rem 0.9rem;
		font-size: 0.85rem;
	}

	.twitch-live__button:hover,
	.twitch-live__mobile:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.twitch-live__title {
		margin: 1rem 1.5rem 1.25rem;
		color: var(--text);
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.twitch-live__player {
		overflow: hidden;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		background: #000;
	}

	.twitch-live__follow-note {
		margin: 0;
		padding: 0.8rem 1.5rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		text-align: center;
	}

	.twitch-live__mobile {
		margin: 0 1.5rem 1.5rem;
		padding: 0.9rem 1rem;
	}

	@media (max-width: 700px) {
		.twitch-live__header {
			align-items: stretch;
			flex-direction: column;
			gap: 1rem;
			padding: 1.25rem 1.25rem 0;
		}

		.twitch-live__heading {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.7rem;
		}

		.twitch-live__button {
			width: 100%;
		}

		.twitch-live__title {
			margin: 1rem 1.25rem 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.twitch-live__button,
		.twitch-live__mobile {
			transition: none;
		}
	}
</style>
