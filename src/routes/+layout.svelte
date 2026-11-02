<script lang="ts">
	import './layout.css';
	import darkFavicon from '#lib/assets/dark.svg';
	import lightFavicon from '#lib/assets/light.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<!-- Favicon Otomatis Mode Light (saat OS/Desktop pengguna Mode Terang) -->
	<link rel="icon" type="image/svg+xml" href={lightFavicon} media="(prefers-color-scheme: light)" />

	<!-- Favicon Otomatis Mode Dark (saat OS/Desktop pengguna Mode Gelap) -->
	<link rel="icon" type="image/svg+xml" href={darkFavicon} media="(prefers-color-scheme: dark)" />
</svelte:head>

{@render children()}
