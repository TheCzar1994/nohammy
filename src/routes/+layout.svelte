<script lang="ts">
	import '../app.scss';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="nohammheart.webp" />
</svelte:head>

{@render children()}
