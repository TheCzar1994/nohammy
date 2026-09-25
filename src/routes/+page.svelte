<script lang="ts">
	import { site } from '$lib/config/site';
	import TwitchLive from '$lib/components/TwitchLive.svelte';
	import Fa from 'svelte-fa';
	import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
</script>

<svelte:head>
	<title>{site.name}</title>

	<meta name="description" content={site.description} />

	<meta property="og:title" content={site.name} />
	<meta property="og:description" content={site.description} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="/banner.jpeg" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={site.name} />
	<meta name="twitter:description" content={site.description} />
	<meta name="twitter:image" content="/banner.jpeg" />
</svelte:head>

<main class="landing">
	<section class="hero">
		<div class="hero__glow"></div>

		<div class="emote-field" aria-hidden="true">
			{#each site.emotes as emote}
				<img
					class="emote"
					class:mobile-hidden={emote.hideOnMobile}
					src={emote.src}
					alt=""
					draggable="false"
					style={`
						--x: ${emote.x}%;
						--y: ${emote.y}%;
						--size: ${emote.size}px;
						--rotation: ${emote.rotation}deg;
						--opacity: ${emote.opacity ?? 1};
					`}
				/>
			{/each}
		</div>

		<div class="hero__content">
			{#if site.kicker}
				<p class="hero__kicker">{site.kicker}</p>
			{/if}

			<h1>{site.name}</h1>

			{#if site.tagline}
				<p class="hero__tagline">{site.tagline}</p>
			{/if}
		</div>
	</section>

	<div class="content-stack">
		<TwitchLive />

		<section class="socials" aria-labelledby="social-heading">
			<h2 id="social-heading" class="sr-only">Social links</h2>

			<nav class="social-grid">
				{#each site.socials as social}
					<a class="social-link" href={social.href} target="_blank" rel="noreferrer">
						<div class="social-link__content">
							<span class="social-link__platform"
								><Fa style="margin-right: 0.75rem;" icon={social.icon} />{social.label}</span
							>
							<span class="social-link__handle">{social.handle}</span>
						</div>

						<span class="social-link__arrow" aria-hidden="true"
							><Fa icon={faUpRightFromSquare} /></span
						>
					</a>
				{/each}
			</nav>
		</section>
	</div>
</main>

<style lang="scss">
	.landing {
		min-height: 100svh;
		overflow: hidden;
		background:
			radial-gradient(circle at 50% 20%, rgba(169, 112, 255, 0.12), transparent 35rem),
			linear-gradient(180deg, var(--background-secondary), var(--background));
	}

	.hero {
		position: relative;
		display: grid;
		min-height: min(62svh, 600px);
		place-items: center;
		overflow: hidden;
		padding: 5rem 2rem 7rem;
		isolation: isolate;
	}

	.hero::after {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 10rem;
		z-index: 1;
		background: linear-gradient(to bottom, transparent, var(--background));
		content: '';
		pointer-events: none;
	}

	.hero__glow {
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(70vw, 850px);
		aspect-ratio: 2 / 1;
		border-radius: 50%;
		background: var(--accent);
		filter: blur(160px);
		opacity: 0.08;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.emote-field {
		position: absolute;
		inset: 0;
		z-index: 0;
		width: min(100%, 1500px);
		margin-inline: auto;
		pointer-events: none;
	}

	.emote {
		position: absolute;
		top: var(--y);
		left: var(--x);
		width: var(--size);
		height: auto;
		opacity: var(--opacity);
		filter: drop-shadow(0 15px 20px rgba(0, 0, 0, 0.3));
		transform: translate(-50%, -50%) rotate(var(--rotation));
		user-select: none;
	}

	.hero__content {
		position: relative;
		z-index: 2;
		width: min(100%, 900px);
		text-align: center;
	}

	.hero__kicker {
		margin: 0 0 1rem;
		color: var(--accent);
		font-size: 0.8rem;
		font-weight: 800;
		letter-spacing: 0.28em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(3.5rem, 10vw, 8rem);
		font-weight: 900;
		letter-spacing: -0.06em;
		line-height: 0.9;
		text-wrap: balance;
	}

	.hero__tagline {
		max-width: 600px;
		margin: 1.75rem auto 0;
		color: var(--text-muted);
		font-size: clamp(1rem, 2vw, 1.2rem);
		line-height: 1.6;
	}

	.content-stack {
		position: relative;
		z-index: 3;
		width: min(100% - 2rem, 960px);
		margin: -2.5rem auto 2.5rem;
	}

	.socials {
		width: 100%;
	}

	.social-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.social-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 90px;
		padding: 1.25rem 1.5rem;
		border: 1px solid var(--border);
		border-radius: 1.1rem;
		background: var(--surface);
		text-decoration: none;
		backdrop-filter: blur(16px);
		transition:
			background 150ms ease,
			border-color 150ms ease,
			transform 150ms ease;
	}

	.social-link:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		background: var(--surface-hover);
		transform: translateY(-2px);
	}

	.social-link__content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.social-link__platform {
		font-size: 1.05rem;
		font-weight: 700;
	}

	.social-link__handle {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.social-link__arrow {
		color: var(--text-muted);
		font-size: 1.3rem;
		transition: color 150ms ease;
	}

	.social-link:hover .social-link__arrow {
		color: var(--accent);
	}

	footer {
		display: flex;
		justify-content: center;
		padding: 4rem 1rem 2rem;
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 700px) {
		.hero {
			min-height: 500px;
			padding: 4rem 1.25rem 6rem;
		}

		h1 {
			font-size: clamp(3.25rem, 18vw, 5.5rem);
		}

		.emote {
			width: calc(var(--size) * 0.7);
		}

		.emote.mobile-hidden {
			display: none;
		}

		.social-grid {
			grid-template-columns: 1fr;
		}

		.social-link {
			min-height: 78px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.social-link {
			transition: none;
		}
	}
</style>
