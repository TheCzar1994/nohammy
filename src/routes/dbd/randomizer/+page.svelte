<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

	import perkData from '$lib/data/dbd/perks.json';
	import { getCharacterIcon } from '$lib/data/dbd/character-icons';
	import type { DbdPerk, DbdRole } from '$lib/types/dbd';

	const STORAGE_KEY = 'nohammy:dbd-randomizer';

	const perks = perkData as DbdPerk[];

	let role = $state<DbdRole>('survivor');

	let selections = $state<Record<DbdRole, string[]>>({
		survivor: [],
		killer: []
	});

	let includeUniversal = $state(true);
	let perkCount = $state(4);
	let build = $state<DbdPerk[]>([]);
	let characterSearch = $state('');
	let hydrated = $state(false);
	let copied = $state(false);

	const rolePerks = $derived(perks.filter((perk) => perk.role === role));

	const characters = $derived(
		[
			...new Set(rolePerks.map((perk) => perk.character).filter((character) => character !== 'All'))
		].sort((a, b) => a.localeCompare(b))
	);

	const selectedCharacters = $derived(selections[role]);

	const filteredCharacters = $derived(
		characters.filter((character) =>
			character.toLowerCase().includes(characterSearch.trim().toLowerCase())
		)
	);

	const eligiblePerks = $derived(
		rolePerks.filter((perk) => {
			if (perk.character === 'All') {
				return includeUniversal;
			}

			if (selectedCharacters.length === 0) {
				return true;
			}

			return selectedCharacters.includes(perk.character);
		})
	);

	const canGenerate = $derived(eligiblePerks.length >= perkCount);

	function setPerkCount(count: number) {
		perkCount = count;
		build = [];
	}

	onMount(() => {
		const saved = localStorage.getItem(STORAGE_KEY);

		if (saved) {
			try {
				const parsed = JSON.parse(saved);

				if (Array.isArray(parsed?.selections?.survivor)) {
					selections.survivor = parsed.selections.survivor;
				}

				if (Array.isArray(parsed?.selections?.killer)) {
					selections.killer = parsed.selections.killer;
				}

				if (typeof parsed?.includeUniversal === 'boolean') {
					includeUniversal = parsed.includeUniversal;
				}
			} catch {
				// Ignore invalid saved state.
			}
		}

		hydrated = true;
	});

	$effect(() => {
		if (!browser || !hydrated) {
			return;
		}

		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				selections,
				includeUniversal
			})
		);
	});

	function setRole(nextRole: DbdRole) {
		if (role === nextRole) {
			return;
		}

		role = nextRole;
		characterSearch = '';
		build = [];
	}

	function toggleCharacter(character: string) {
		const selected = selections[role];

		if (selected.includes(character)) {
			selections[role] = selected.filter((entry) => entry !== character);
		} else {
			selections[role] = [...selected, character];
		}

		build = [];
	}

	function selectAllCharacters() {
		selections[role] = [...characters];
		build = [];
	}

	function clearCharacters() {
		selections[role] = [];
		build = [];
	}

	function toggleUniversal() {
		includeUniversal = !includeUniversal;
		build = [];
	}

	function shuffle<T>(items: T[]) {
		const result = [...items];

		for (let index = result.length - 1; index > 0; index -= 1) {
			const randomIndex = Math.floor(Math.random() * (index + 1));

			[result[index], result[randomIndex]] = [result[randomIndex], result[index]];
		}

		return result;
	}

	function generateBuild() {
		if (!canGenerate) {
			return;
		}

		build = shuffle(eligiblePerks).slice(0, perkCount);
		copied = false;
	}

	function rerollPerk(index: number) {
		const usedIds = new Set(
			build.filter((_, buildIndex) => buildIndex !== index).map((perk) => perk.id)
		);

		const candidates = eligiblePerks.filter((perk) => !usedIds.has(perk.id));

		if (candidates.length === 0) {
			return;
		}

		const replacement = candidates[Math.floor(Math.random() * candidates.length)];

		build[index] = replacement;
		build = [...build];
		copied = false;
	}

	async function copyBuild() {
		if (!browser || build.length === 0) {
			return;
		}

		const text = [
			'Nohammy DBD Randomizer',
			'',
			...build.map((perk, index) => `${index + 1}. ${perk.name}`)
		].join('\n');

		await navigator.clipboard.writeText(text);

		copied = true;

		window.setTimeout(() => {
			copied = false;
		}, 1800);
	}

	function getInitials(character: string) {
		return character
			.replace(/^The\s+/i, '')
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part.charAt(0))
			.join('')
			.toUpperCase();
	}
</script>

<svelte:head>
	<title>DBD Randomizer | nohammy</title>

	<meta
		name="description"
		content="Randomize Dead by Daylight perks from the Survivors and Killers you choose."
	/>
</svelte:head>

<main class="randomizer-page">
	<div class="page-glow"></div>

	<header class="page-header">
		<Fa icon={faArrowLeft} class="back-link-icon" />
		<a class="back-link" href="/">nohammy.tv</a>

		<p class="eyebrow">Dead by Daylight</p>

		<h1>Perk Randomizer</h1>

		<p class="intro">Pick the characters you want in the pool, then let fate decide your build.</p>
	</header>

	<section class="randomizer">
		<div class="role-switcher" aria-label="Choose role">
			<button
				type="button"
				class:active={role === 'survivor'}
				aria-pressed={role === 'survivor'}
				onclick={() => setRole('survivor')}
			>
				Survivor
			</button>

			<button
				type="button"
				class:active={role === 'killer'}
				aria-pressed={role === 'killer'}
				onclick={() => setRole('killer')}
			>
				Killer
			</button>
		</div>

		<div class="panel">
			<div class="panel-heading">
				<div>
					<p class="step-label">Character pool</p>

					<h2>
						Choose your {role === 'survivor' ? 'Survivors' : 'Killers'}
					</h2>

					<p>
						{#if selectedCharacters.length === 0}
							No characters selected - all {role === 'survivor' ? 'Survivors' : 'Killers'} are currently
							included.
						{:else}
							{selectedCharacters.length}
							{selectedCharacters.length === 1 ? 'character' : 'characters'} selected.
						{/if}
					</p>
				</div>

				<div class="selection-actions">
					<button type="button" onclick={selectAllCharacters}>Select all</button>
					<button type="button" onclick={clearCharacters}>Clear</button>
				</div>
			</div>

			<label class="search">
				<span class="sr-only">Search characters</span>

				<input type="search" placeholder="Search characters..." bind:value={characterSearch} />
			</label>

			<div class="character-grid">
				{#each filteredCharacters as character (character)}
					{@const iconUrl = getCharacterIcon(character)}

					<button
						type="button"
						class="character"
						class:selected={selectedCharacters.includes(character)}
						aria-pressed={selectedCharacters.includes(character)}
						onclick={() => toggleCharacter(character)}
					>
						<span class="character__portrait">
							{#if iconUrl}
								<img src={iconUrl} alt="" loading="lazy" />
							{:else}
								<span class="character__initials">
									{getInitials(character)}
								</span>
							{/if}
						</span>

						<span class="character__name">{character}</span>
					</button>
				{/each}
			</div>

			{#if filteredCharacters.length === 0}
				<p class="empty-message">No characters match that search.</p>
			{/if}
		</div>

		<div class="settings-row">
			<button
				type="button"
				class="universal-toggle"
				class:active={includeUniversal}
				aria-pressed={includeUniversal}
				onclick={toggleUniversal}
			>
				<span class="toggle-indicator"></span>

				<span>
					<strong>Universal perks</strong>
					<small>{includeUniversal ? 'Included' : 'Excluded'}</small>
				</span>
			</button>

			<div class="perk-count-setting">
				<span class="perk-count-setting__label">Perks</span>

				<div class="perk-count-options" aria-label="Number of perks">
					{#each [1, 2, 3, 4] as count}
						<button
							type="button"
							class:active={perkCount === count}
							aria-pressed={perkCount === count}
							onclick={() => setPerkCount(count)}
						>
							{count}
						</button>
					{/each}
				</div>
			</div>

			<div class="pool-count">
				<strong>{eligiblePerks.length}</strong>
				<span>eligible perks</span>
			</div>
		</div>

		<div class="generate-area">
			<button type="button" class="generate-button" disabled={!canGenerate} onclick={generateBuild}>
				🎲 Randomize {perkCount}
				{perkCount === 1 ? 'Perk' : 'Perks'}
			</button>

			{#if !canGenerate}
				<p>
					You need at least {perkCount} eligible {perkCount === 1 ? 'perk' : 'perks'}. Select
					another character or enable Universal perks.
				</p>
			{/if}
		</div>

		{#if build.length > 0}
			<section class="result" aria-labelledby="build-heading">
				<div class="result-heading">
					<div>
						<h2 id="build-heading">Your Build:</h2>
					</div>

					<div class="result-actions">
						<button type="button" onclick={copyBuild}>
							{copied ? 'Copied!' : 'Copy perk names'}
						</button>

						<button type="button" onclick={generateBuild}>Reroll all</button>
					</div>
				</div>

				<div class="perk-grid">
					{#each build as perk, index (perk.id)}
						<article class="perk-card">
							<button
								type="button"
								class="reroll-button"
								aria-label={`Reroll ${perk.name}`}
								title={`Reroll ${perk.name}`}
								onclick={() => rerollPerk(index)}
							>
								↻
							</button>

							<div class="perk-icon">
								<img src={perk.iconUrl} alt="" referrerpolicy="no-referrer" />
							</div>

							<div class="perk-info">
								<h3>{perk.name}</h3>

								<p class="perk-character">
									{perk.character === 'All' ? 'Universal' : perk.character}
								</p>

								<p class="perk-description">
									{perk.description}
								</p>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}
	</section>
</main>

<style lang="scss">
	.randomizer-page {
		position: relative;
		min-height: 100svh;
		overflow: hidden;
		padding: 3rem 1rem 5rem;
		background:
			radial-gradient(circle at 50% 0%, rgba(169, 112, 255, 0.14), transparent 35rem),
			linear-gradient(180deg, var(--background-secondary), var(--background));
	}

	.page-glow {
		position: absolute;
		top: 4rem;
		left: 50%;
		width: min(70vw, 800px);
		height: 300px;
		border-radius: 50%;
		background: var(--accent);
		filter: blur(180px);
		opacity: 0.05;
		transform: translateX(-50%);
		pointer-events: none;
	}

	.page-header,
	.randomizer {
		position: relative;
		z-index: 1;
		width: min(100%, 1120px);
		margin-inline: auto;
	}

	.page-header {
		margin-bottom: 2.5rem;
		text-align: center;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 3rem;
		color: var(--text-muted);
		font-size: 0.9rem;
		text-decoration: none;
		transition: color 150ms ease;
	}

	.back-link:hover {
		color: var(--text);
	}

	.eyebrow,
	.step-label {
		margin: 0 0 0.65rem;
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.8rem, 8vw, 5.8rem);
		font-weight: 900;
		letter-spacing: -0.055em;
		line-height: 0.95;
	}

	.intro {
		max-width: 600px;
		margin: 1.25rem auto 0;
		color: var(--text-muted);
		font-size: 1.05rem;
		line-height: 1.6;
	}

	.role-switcher {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		width: min(100%, 480px);
		padding: 0.35rem;
		margin: 0 auto 1rem;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: rgba(0, 0, 0, 0.2);
	}

	.role-switcher button {
		padding: 0.9rem 1rem;
		border: 0;
		border-radius: 0.7rem;
		color: var(--text-muted);
		background: transparent;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	.role-switcher button.active {
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 22%, transparent);
	}

	.panel {
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: 1.35rem;
		background: var(--surface);
		backdrop-filter: blur(16px);
	}

	.panel-heading,
	.result-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.panel-heading h2,
	.result-heading h2 {
		margin: 0;
		font-size: clamp(1.35rem, 3vw, 1.8rem);
	}

	.panel-heading p:not(.step-label) {
		margin: 0.45rem 0 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	.selection-actions,
	.result-actions {
		display: flex;
		gap: 0.55rem;
	}

	.selection-actions button,
	.result-actions button {
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: 0.7rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.03);
		cursor: pointer;
		transition:
			border-color 150ms ease,
			color 150ms ease,
			background 150ms ease;
	}

	.selection-actions button:hover,
	.result-actions button:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		color: var(--text);
		background: var(--surface-hover);
	}

	.search {
		display: block;
		margin-bottom: 1rem;
	}

	.search input {
		width: 100%;
		padding: 0.9rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.8rem;
		outline: none;
		color: var(--text);
		background: rgba(0, 0, 0, 0.2);
		font: inherit;
	}

	.search input:focus {
		border-color: color-mix(in srgb, var(--accent) 65%, transparent);
	}

	.character-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
		gap: 0.65rem;
		max-height: 430px;
		padding-right: 0.5rem;
		overflow-y: auto;
		padding-top: 12px;

		scrollbar-width: thin;
		scrollbar-color: color-mix(in srgb, var(--accent) 45%, transparent) rgba(255, 255, 255, 0.04);
	}

	.character-grid::-webkit-scrollbar {
		width: 8px;
	}

	.character-grid::-webkit-scrollbar-track {
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.04);
	}

	.character-grid::-webkit-scrollbar-thumb {
		border: 2px solid transparent;
		border-radius: 999px;
		background: linear-gradient(
				color-mix(in srgb, var(--accent) 55%, transparent),
				color-mix(in srgb, var(--accent) 35%, transparent)
			)
			padding-box;
	}

	.character-grid::-webkit-scrollbar-thumb:hover {
		background: linear-gradient(
				color-mix(in srgb, var(--accent) 75%, transparent),
				color-mix(in srgb, var(--accent) 50%, transparent)
			)
			padding-box;
	}

	.character {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		align-items: center;
		min-width: 0;
		padding: 0.75rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.9rem;
		color: var(--text);
		background: rgba(0, 0, 0, 0.16);
		cursor: pointer;
		transition:
			border-color 150ms ease,
			background 150ms ease,
			transform 150ms ease;
	}

	.character:hover {
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
		background: var(--surface-hover);
		transform: translateY(-1px);
	}

	.character.selected {
		border-color: color-mix(in srgb, var(--accent) 75%, transparent);
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.character__portrait {
		display: grid;
		width: 64px;
		aspect-ratio: 1;
		place-items: center;
		overflow: hidden;
		border-radius: 0.7rem;
		background: rgba(255, 255, 255, 0.055);
	}

	.character__portrait img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.character__initials {
		color: var(--text-muted);
		font-size: 1rem;
		font-weight: 800;
	}

	.character__name {
		width: 100%;
		overflow: hidden;
		font-size: 0.78rem;
		font-weight: 700;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty-message {
		margin: 2rem 0;
		color: var(--text-muted);
		text-align: center;
	}

	.settings-row {
		display: flex;
		align-items: stretch;
		gap: 0.8rem;
		margin-top: 0.8rem;
	}

	.universal-toggle,
	.pool-count {
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: var(--surface);
	}

	.universal-toggle {
		display: flex;
		flex: 1;
		gap: 0.8rem;
		align-items: center;
		padding: 1rem 1.1rem;
		color: var(--text);
		text-align: left;
		cursor: pointer;
	}

	.toggle-indicator {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		transition: background 150ms ease;
	}

	.universal-toggle.active .toggle-indicator {
		background: var(--accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 65%, transparent);
	}

	.universal-toggle span:last-child {
		display: flex;
		flex-direction: column;
	}

	.universal-toggle small {
		margin-top: 0.15rem;
		color: var(--text-muted);
	}

	.pool-count {
		display: flex;
		min-width: 150px;
		flex-direction: column;
		justify-content: center;
		padding: 0.8rem 1.1rem;
		text-align: center;
	}

	.pool-count strong {
		font-size: 1.4rem;
	}

	.pool-count span {
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.generate-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 2rem 0 0;
	}

	.generate-button {
		min-width: min(100%, 320px);
		padding: 1rem 1.5rem;
		border: 1px solid color-mix(in srgb, var(--accent) 65%, transparent);
		border-radius: 0.9rem;
		color: white;
		background: color-mix(in srgb, var(--accent) 28%, #17121f);
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			transform 150ms ease,
			background 150ms ease;
	}

	.generate-button:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 38%, #17121f);
		transform: translateY(-2px);
	}

	.generate-button:disabled {
		cursor: not-allowed;
		opacity: 0.4;
	}

	.generate-area p {
		margin: 0.8rem 0 0;
		color: var(--text-muted);
		font-size: 0.8rem;
		text-align: center;
	}

	.result {
		margin-top: 3rem;
	}

	.perk-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.perk-card {
		position: relative;
		min-width: 0;
		padding: 1.1rem;
		border: 1px solid var(--border);
		border-radius: 1.1rem;
		background: var(--surface);
	}

	.reroll-button {
		position: absolute;
		top: 0.65rem;
		right: 0.65rem;
		z-index: 2;
		display: grid;
		width: 32px;
		height: 32px;
		place-items: center;
		border: 1px solid var(--border);
		border-radius: 50%;
		color: var(--text-muted);
		background: rgba(0, 0, 0, 0.45);
		cursor: pointer;
	}

	.reroll-button:hover {
		color: var(--text);
		border-color: var(--accent);
	}

	.perk-icon {
		display: grid;
		width: min(100%, 150px);
		aspect-ratio: 1;
		place-items: center;
		margin: 0 auto 1rem;
	}

	.perk-icon img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.perk-info h3 {
		margin: 0;
		font-size: 1rem;
		text-align: center;
	}

	.perk-character {
		margin: 0.35rem 0 0.9rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		text-align: center;
	}

	.perk-description {
		padding-top: 0.75rem;
		margin: 0.75rem 0 0;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.78rem;
		line-height: 1.55;
		white-space: pre-line;
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

	.perk-count-setting {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.8rem 1rem;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: var(--surface);
	}

	.perk-count-setting__label {
		color: var(--text-muted);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.perk-count-options {
		display: flex;
		gap: 0.35rem;
	}

	.perk-count-options button {
		display: grid;
		width: 32px;
		height: 32px;
		place-items: center;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 0.55rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.03);
		font-weight: 700;
		cursor: pointer;
		transition:
			border-color 150ms ease,
			background 150ms ease,
			color 150ms ease;
	}

	.perk-count-options button:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		color: var(--text);
	}

	.perk-count-options button.active {
		border-color: color-mix(in srgb, var(--accent) 70%, transparent);
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 20%, transparent);
	}

	@media (max-width: 850px) {
		.perk-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 650px) {
		.randomizer-page {
			padding-top: 1.5rem;
		}

		.back-link {
			margin-bottom: 2rem;
		}

		.panel {
			padding: 1rem;
		}

		.panel-heading,
		.result-heading {
			align-items: stretch;
			flex-direction: column;
		}

		.selection-actions,
		.result-actions {
			width: 100%;
		}

		.selection-actions button,
		.result-actions button {
			flex: 1;
		}

		.character-grid {
			grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
			max-height: 390px;
		}

		.character__portrait {
			width: 56px;
		}

		.settings-row {
			flex-direction: column;
		}

		.perk-count-options {
			justify-content: center;
		}

		.pool-count {
			min-width: 0;
		}

		.perk-grid {
			grid-template-columns: 1fr;
		}

		.perk-card {
			display: grid;
			grid-template-columns: 90px minmax(0, 1fr);
			gap: 1rem;
			align-items: center;
		}

		.perk-icon {
			width: 90px;
			margin: 0;
		}

		.perk-info h3,
		.perk-character {
			text-align: left;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.character,
		.generate-button,
		.back-link {
			transition: none;
		}
	}
</style>
