<script lang="ts">
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { faTwitch } from '@fortawesome/free-brands-svg-icons';
	import {
		faArrowLeft,
		faEye,
		faPlay,
		faUpRightFromSquare,
		faStar
	} from '@fortawesome/free-solid-svg-icons';

	import { twitch } from '$lib/config/twitch';
	import type { TwitchClip } from '$lib/types/twitch';

	let clips = $state<TwitchClip[]>([]);
	let selectedClip = $state<TwitchClip | null>(null);
	let canEmbed = $state(false);
	let hostname = $state('');

	const viewFormatter = new Intl.NumberFormat('en-US', {
		notation: 'compact',
		maximumFractionDigits: 1
	});

	function formatViews(views: number) {
		return `${viewFormatter.format(views)} views`;
	}

	async function loadClips() {
		try {
			const response = await fetch('/api/twitch/clips', {
				headers: {
					Accept: 'application/json'
				}
			});

			if (!response.ok) {
				return;
			}

			const result = (await response.json()) as {
				clips: TwitchClip[];
			};

			clips = result.clips;
		} catch (error) {
			console.error('[Twitch] Failed to load clips:', error);
		}
	}

	onMount(() => {
		hostname = window.location.hostname;

		const mediaQuery = window.matchMedia('(min-width: 440px)');

		function updateEmbedAvailability() {
			canEmbed = mediaQuery.matches;

			if (!canEmbed) {
				selectedClip = null;
			}
		}

		updateEmbedAvailability();
		mediaQuery.addEventListener('change', updateEmbedAvailability);

		void loadClips();

		return () => {
			mediaQuery.removeEventListener('change', updateEmbedAvailability);
		};
	});
</script>

{#if clips.length > 0}
	<section class="twitch-clips" aria-labelledby="clips-heading">
		{#if selectedClip && canEmbed}
			<div class="clip-player">
				<div class="clip-player__header">
					<button type="button" class="clip-player__back" onclick={() => (selectedClip = null)}>
						<Fa icon={faArrowLeft} />
						Back to clips
					</button>

					<a class="clip-player__twitch" href={selectedClip.url} target="_blank" rel="noreferrer">
						Open on Twitch
						<Fa icon={faUpRightFromSquare} />
					</a>
				</div>

				<div class="clip-player__frame">
					<iframe
						src={`https://clips.twitch.tv/embed?clip=${encodeURIComponent(
							selectedClip.id
						)}&parent=${encodeURIComponent(hostname)}&autoplay=true`}
						title={selectedClip.title}
						allow="autoplay; fullscreen"
						allowfullscreen
					></iframe>
				</div>

				<div class="clip-player__details">
					{#if selectedClip.isFeatured}
						<span class="clip-player__featured"> ★ Featured by nohammy </span>
					{/if}

					<strong>{selectedClip.title}</strong>

					<span>
						Clipped by {selectedClip.creatorName}
						<span aria-hidden="true">•</span>
						{formatViews(selectedClip.viewCount)}
					</span>
				</div>
			</div>
		{:else}
			<div class="twitch-clips__header">
				<div>
					<div class="twitch-clips__eyebrow">
						<Fa icon={faTwitch} />
						Twitch
					</div>

					<h2 id="clips-heading">Clips from nohammy</h2>
					<p>Randomized featured favorites and recent clips while nohammy is offline</p>
				</div>

				<a class="twitch-clips__channel" href={twitch.url} target="_blank" rel="noreferrer">
					Visit Twitch
					<Fa icon={faUpRightFromSquare} />
				</a>
			</div>

			<div class="clip-grid">
				{#each clips as clip}
					{#if canEmbed}
						<button type="button" class="clip-card" onclick={() => (selectedClip = clip)}>
							<span class="clip-card__thumbnail">
								<img src={clip.thumbnailUrl} alt="" loading="lazy" />

								{#if clip.isFeatured}
									<span
										class="clip-card__featured"
										aria-label="Featured by nohammy"
										title="Featured by nohammy"
									>
										<span aria-hidden="true"><Fa icon={faStar} />&nbsp;</span>
										<span class="clip-card__featured-text">Featured by nohammy</span>
									</span>
								{/if}

								<span class="clip-card__play" aria-hidden="true">
									<Fa icon={faPlay} />
								</span>
							</span>

							<span class="clip-card__content">
								<strong>{clip.title}</strong>

								<span class="clip-card__meta">
									<span>Clipped by {clip.creatorName}</span>

									<span class="clip-card__views">
										<Fa icon={faEye} />
										{formatViews(clip.viewCount)}
									</span>
								</span>
							</span>
						</button>
					{:else}
						<a class="clip-card" href={clip.url} target="_blank" rel="noreferrer">
							<span class="clip-card__thumbnail">
								<img src={clip.thumbnailUrl} alt="" loading="lazy" />

								{#if clip.isFeatured}
									<span
										class="clip-card__featured"
										aria-label="Featured by nohammy"
										title="Featured by nohammy"
									>
										<span aria-hidden="true"><Fa icon={faStar} />&nbsp;</span>
										<span class="clip-card__featured-text">Featured by nohammy</span>
									</span>
								{/if}

								<span class="clip-card__play" aria-hidden="true">
									<Fa icon={faPlay} />
								</span>
							</span>

							<span class="clip-card__content">
								<strong>{clip.title}</strong>

								<span class="clip-card__meta">
									<span>Clipped by {clip.creatorName}</span>

									<span class="clip-card__views">
										<Fa icon={faEye} />
										{formatViews(clip.viewCount)}
									</span>
								</span>
							</span>
						</a>
					{/if}
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style lang="scss">
	.twitch-clips {
		margin-bottom: 0.8rem;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: 1.1rem;
		background: var(--surface);
		backdrop-filter: blur(16px);
	}

	.twitch-clips__header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1.25rem;
	}

	.twitch-clips__eyebrow {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 0.45rem;
		color: var(--accent);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: 1.4rem;
		letter-spacing: -0.025em;
	}

	.twitch-clips__header p {
		margin: 0.35rem 0 0;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.twitch-clips__channel,
	.clip-player__twitch {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.45rem;
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 700;
		text-decoration: none;
		transition: color 150ms ease;
	}

	.twitch-clips__channel:hover,
	.clip-player__twitch:hover {
		color: var(--accent);
	}

	.clip-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.clip-card {
		display: flex;
		min-width: 0;
		padding: 0;
		overflow: hidden;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: 0.9rem;
		background: rgba(255, 255, 255, 0.035);
		color: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			transform 150ms ease;
	}

	.clip-card:hover {
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
		background: var(--surface-hover);
		transform: translateY(-2px);
	}

	.clip-card__thumbnail {
		position: relative;
		display: block;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		background: #000;
	}

	.clip-card__featured {
		position: absolute;
		top: 0.65rem;
		left: 0.65rem;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.55rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 88%, #000);
		color: #fff;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.025em;
	}

	.clip-card__thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 200ms ease;
	}

	.clip-card:hover .clip-card__thumbnail img {
		transform: scale(1.025);
	}

	.clip-card__thumbnail::after {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent 55%);
		content: '';
	}

	.clip-card__play {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 1;
		display: grid;
		width: 2.6rem;
		height: 2.6rem;
		place-items: center;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.72);
		color: #fff;
		font-size: 0.8rem;
		transform: translate(-50%, -50%);
		transition:
			background 150ms ease,
			transform 150ms ease;
	}

	.clip-card:hover .clip-card__play {
		background: var(--accent);
		transform: translate(-50%, -50%) scale(1.08);
	}

	.clip-card__content {
		display: flex;
		flex: 1;
		padding: 0.9rem;
		flex-direction: column;
		gap: 0.65rem;
	}

	.clip-card__content strong {
		display: -webkit-box;
		overflow: hidden;
		font-size: 0.9rem;
		line-height: 1.35;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.clip-card__meta {
		display: flex;
		margin-top: auto;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		color: var(--text-muted);
		font-size: 0.7rem;
	}

	.clip-card__views {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.3rem;
	}

	.clip-player__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.clip-player__back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--text);
		font-weight: 700;
		cursor: pointer;
	}

	.clip-player__back:hover {
		color: var(--accent);
	}

	.clip-player__frame {
		position: relative;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		border-radius: 0.9rem;
		background: #000;
	}

	.clip-player__frame iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.clip-player__details {
		display: flex;
		padding-top: 1rem;
		flex-direction: column;
		gap: 0.35rem;
	}

	.clip-player__featured {
		align-self: flex-start;
		margin-bottom: 0.2rem;
		padding: 0.35rem 0.55rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 88%, #000);
		color: #fff !important;
		font-size: 0.65rem !important;
		font-weight: 800;
		letter-spacing: 0.025em;
	}

	.clip-player__details strong {
		font-size: 1rem;
	}

	.clip-player__details span {
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	@media (max-width: 760px) {
		.clip-grid {
			grid-template-columns: 1fr;
		}

		.clip-card {
			display: grid;
			grid-template-columns: minmax(120px, 42%) 1fr;
		}

		.clip-card__thumbnail {
			height: 100%;
			aspect-ratio: auto;
		}

		.clip-card__meta {
			align-items: flex-start;
			flex-direction: column;
		}
		.clip-card__featured {
			width: 2rem;
			height: 2rem;
			padding: 0;
			justify-content: center;
			border-radius: 50%;
			font-size: 0.8rem;
		}

		.clip-card__featured-text {
			display: none;
		}
	}

	@media (max-width: 500px) {
		.twitch-clips {
			padding: 1.25rem;
		}

		.twitch-clips__header {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.8rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clip-card,
		.clip-card__thumbnail img,
		.clip-card__play,
		.twitch-clips__channel,
		.clip-player__twitch {
			transition: none;
		}
	}
</style>
