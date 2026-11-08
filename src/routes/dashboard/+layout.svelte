<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';
	import logo from '$lib/assets/light.svg';
	import {
		LayoutGrid,
		Users,
		Receipt,
		BadgeCheck,
		UserCog,
		BookOpen,
		ExternalLink,
		LogOut,
		BuildingComplex,
		CloudUpload,
		PanelLeft,
		Shield,
		ChevronDown,
		RotateCcwIcon,
		X
	} from '@lucide/svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const user = $derived(data.user);

	let isSidebarOpen = $state(true);
	let showProfileMenu = $state(false);

	const initials = $derived(
		user.nama_lengkap
			? user.nama_lengkap
					.split(' ')
					.map((n: string) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'U'
	);

	const roleDisplay = $derived(user.role === 'ADMINISTRASI' ? 'Admin LPH' : 'Bendahara LPH');

	interface NavItem {
		name: string;
		href: string;
		icon: Component;
		role: string[];
		badge?: string;
	}

	const navigation: NavItem[] = [
		{
			name: 'Rekap Data',
			href: '/dashboard',
			icon: LayoutGrid,
			role: ['ADMINISTRASI', 'BENDAHARA']
		},
		{
			name: 'Pelaku Usaha',
			href: '/dashboard/pelaku-usaha',
			icon: BuildingComplex,
			role: ['ADMINISTRASI']
		},
		{ name: 'Penugasan Tim', href: '/dashboard/penugasan', icon: Users, role: ['ADMINISTRASI'] },
		{
			name: 'Biaya Audit',
			href: '/dashboard/keuangan/tagihan',
			icon: Receipt,
			role: ['BENDAHARA']
		},
		{
			name: 'Verifikasi Biaya',
			href: '/dashboard/keuangan/konfirmasi',
			icon: BadgeCheck,
			role: ['BENDAHARA']
		},
		{
			name: 'Impor Histori',
			href: '/dashboard/migrasi',
			icon: CloudUpload,
			role: ['ADMINISTRASI']
		},
		{
			name: 'Log Arsip',
			href: '/dashboard/arsip',
			icon: RotateCcwIcon,
			role: ['ADMINISTRASI', 'BENDAHARA']
		},
		{ name: 'Manajemen Akun', href: '/dashboard/petugas', icon: UserCog, role: ['ADMINISTRASI'] }
	];
</script>

<svelte:head>
	<title>SIM LPH - Sistem Internal</title>
</svelte:head>

<div class="relative flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-800">
	{#if isSidebarOpen}
		<button
			type="button"
			aria-label="Tutup Sidebar"
			onclick={() => (isSidebarOpen = false)}
			class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
		></button>
	{/if}

	<aside
		class="fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col justify-between overflow-y-auto bg-white transition-all duration-300 ease-in-out lg:static lg:z-auto {isSidebarOpen
			? 'w-72 translate-x-0 border-r border-slate-200/70 p-6 opacity-100'
			: 'pointer-events-none w-0 -translate-x-full border-none p-0 opacity-0 lg:translate-x-0'}"
	>
		<div class="w-60 space-y-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<img src={logo} alt="Logo Uinsa" class="h-9" />
					<div>
						<h1 class="text-lg leading-tight font-bold tracking-tight text-slate-900">
							SIM LPH UINSA
						</h1>
						<p class="text-xs font-medium text-slate-400">Sistem Internal</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => (isSidebarOpen = false)}
					class="rounded-xl p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-2">
				<div class="px-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
					Menu Utama
				</div>
				<nav class="space-y-1">
					{#each navigation as item (item.href)}
						{#if item.role.includes(user.role)}
							{@const isActive = page.url.pathname === item.href}
							{@const IconComponent = item.icon}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={item.href}
								onclick={() => {
									if (window.innerWidth < 1024) isSidebarOpen = false;
								}}
								class="flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition-all duration-150 {isActive
									? 'bg-[#D1FAE5] text-[#059669]'
									: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
							>
								<div class="flex items-center gap-3.5">
									<IconComponent
										class="h-5 w-5 shrink-0 {isActive ? 'text-[#059669]' : 'text-slate-400'}"
									/>
									<span>{item.name}</span>
								</div>
								{#if item.badge}
									<span
										class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#059669]"
									>
										{item.badge}
									</span>
								{/if}
							</a>
						{/if}
					{/each}
				</nav>
			</div>
		</div>

		<div class="w-60 space-y-6 pt-6">
			<div class="space-y-3 rounded-2xl border border-blue-100/60 bg-blue-50/60 p-4">
				<div class="flex items-center gap-2 text-[#2563EB]">
					<BookOpen class="h-5 w-5" />
				</div>
				<div class="space-y-1">
					<h3 class="text-xs font-bold text-slate-900">Butuh panduan?</h3>
					<p class="text-[11px] leading-relaxed text-slate-500">
						Pelajari alur pemeriksaan dan administrasi halal.
					</p>
				</div>
				<a
					href="#panduan"
					class="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
				>
					<span>Buka panduan</span>
					<ExternalLink class="h-3.5 w-3.5" />
				</a>
			</div>

			<div class="space-y-1 border-t border-slate-100 pt-4">
				<p class="text-xs font-bold text-slate-600">KONSEP INTERNAL • v1.0</p>
				<p class="text-[11px] text-slate-400">Data ilustratif, bukan data institusi.</p>
			</div>
		</div>
	</aside>

	<div class="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
		<header
			class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white px-4 md:px-8"
		>
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (isSidebarOpen = !isSidebarOpen)}
					class="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
					aria-label="Toggle Sidebar"
				>
					<PanelLeft class="h-5 w-5" />
				</button>
				<span class="hidden text-sm font-medium text-slate-600 sm:inline-block">
					Lembaga Pemeriksa Halal / SIM Internal
				</span>
			</div>

			<div class="flex items-center gap-3 md:gap-5">
				<div
					class="hidden items-center gap-2 rounded-full bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-[#2563EB] sm:flex"
				>
					<Shield class="h-4 w-4" />
					<span>{roleDisplay}</span>
				</div>
				<div class="hidden h-6 w-px bg-slate-200 sm:block"></div>

				<div class="relative">
					<button
						type="button"
						onclick={() => (showProfileMenu = !showProfileMenu)}
						class="flex items-center gap-2.5 text-left focus:outline-none"
					>
						<div
							class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100/70 text-xs font-bold text-[#2563EB]"
						>
							{initials}
						</div>
						<div class="hidden md:block">
							<p class="text-sm leading-tight font-semibold text-slate-900">{user.nama_lengkap}</p>
							<p class="text-[11px] font-medium text-slate-400">Akun internal</p>
						</div>
						<ChevronDown class="h-4 w-4 text-slate-500" />
					</button>

					{#if showProfileMenu}
						<div
							class="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-lg"
						>
							<form action="/api/logout" method="POST">
								<button
									type="submit"
									class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50"
								>
									<LogOut class="h-4 w-4" />
									<span>Keluar Aplikasi</span>
								</button>
							</form>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto p-4 md:p-8">
			{@render children()}
		</main>
	</div>
</div>
