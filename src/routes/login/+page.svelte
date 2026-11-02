<script lang="ts">
	import { ShieldCheck, LogIn, Lock, Eye, EyeOff, TriangleAlert } from '@lucide/svelte';
	import type { ActionData } from './$types';
	import logo from '#lib/assets/light.svg';

	let { form }: { form: ActionData } = $props();

	let showPassword = $state(false);
	let rememberMe = $state(false);
</script>

<svelte:head>
	<title>Masuk ke SIM LPH - Sistem Internal</title>
</svelte:head>

<div
	class="flex min-h-screen w-full flex-col justify-between bg-[#F8FAFC] p-6 font-sans text-slate-800 sm:p-10"
>
	<!-- Top Navigation Header -->
	<header class="mx-auto flex w-full max-w-7xl items-center justify-between">
		<div class="flex items-center gap-3">
			<img src={logo} alt="Logo UINSA" class="h-10" />
			<div>
				<h1 class="text-base leading-tight font-bold tracking-tight text-slate-900">
					SIM LPH UINSA
				</h1>
				<p class="text-xs font-medium text-slate-400">Sistem Internal</p>
			</div>
		</div>

		<div
			class="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-2xs backdrop-blur"
		>
			<Lock class="h-3.5 w-3.5 text-slate-400" />
			<span>Akses internal Lembaga Pemeriksa Halal</span>
		</div>
	</header>

	<!-- Main Content Card Area -->
	<main class="mx-auto my-8 w-full max-w-md space-y-6">
		<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
			<!-- Icon Header Badge -->
			<div
				class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669]"
			>
				<LogIn class="h-5 w-5" />
			</div>

			<!-- Header Title -->
			<div class="space-y-2">
				<h2 class="text-2xl font-bold tracking-tight text-slate-900">Masuk ke SIM LPH</h2>
				<p class="text-xs leading-relaxed text-slate-500">
					Gunakan akun internal untuk mengakses ruang kerja pemeriksaan dan administrasi halal.
				</p>
			</div>

			<!-- Form Inputs -->
			<form method="POST" class="space-y-4">
				<!-- Email Input -->
				<div class="space-y-1.5">
					<label for="username" class="block text-xs font-semibold text-slate-700">Email</label>
					<input
						type="text"
						id="username"
						name="username"
						value={form?.username ?? ''}
						placeholder="nama@contoh.id"
						required
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:border-[#059669] focus:ring-1 focus:ring-[#059669] focus:outline-none"
					/>
				</div>

				<!-- Password Input -->
				<div class="space-y-1.5">
					<label for="password" class="block text-xs font-semibold text-slate-700">Kata sandi</label
					>
					<div class="relative flex items-center">
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							name="password"
							placeholder="••••••••••••"
							required
							class="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-4 text-sm transition-all placeholder:text-slate-400 focus:border-[#059669] focus:ring-1 focus:ring-[#059669] focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3.5 text-slate-400 transition-colors hover:text-slate-600"
							aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Options: Remember Me & Forgot Password -->
				<div class="flex items-center justify-between pt-1">
					<label class="flex cursor-pointer items-center gap-2 select-none">
						<input
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 rounded border-slate-300 text-[#059669] transition-all focus:ring-[#059669]"
						/>
						<span class="text-xs font-medium text-slate-600">Ingat saya</span>
					</label>
					<a href="#lupa-sandi" class="text-xs font-semibold text-[#059669] hover:underline">
						Lupa kata sandi?
					</a>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					class="mt-2 w-full rounded-full bg-[#059669] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#047857]"
				>
					Masuk
				</button>
			</form>

			<!-- Footer Info Badge Inside Card -->
			<div class="space-y-3 border-t border-slate-100 pt-4">
				<div class="flex items-start gap-2.5 text-xs leading-relaxed text-slate-500">
					<ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
					<span>Jaga kerahasiaan kata sandi. Jangan bagikan akses akun Anda kepada pihak lain.</span
					>
				</div>
				<p class="text-center text-xs font-medium text-slate-500">
					Belum memiliki akses? <a
						href="#hubungi-admin"
						class="font-bold text-[#059669] hover:underline">Hubungi Admin LPH</a
					>
				</p>
			</div>
		</div>

		<!-- State Alternatif: Error Toast Notification Box -->
		{#if form?.error}
			<div class="space-y-1 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs">
				<div class="flex items-center gap-2 font-bold text-rose-700">
					<TriangleAlert class="h-4 w-4 shrink-0" />
					<span>Tidak dapat masuk</span>
				</div>
				<p class="pl-6 text-rose-600">{form.error}</p>
			</div>
		{/if}
	</main>

	<!-- Bottom Footer Info -->
	<footer
		class="mx-auto flex w-full max-w-7xl items-center justify-between text-[11px] font-medium text-slate-400"
	>
		<div>SIM Internal LPH • Ruang kerja operasional</div>
		<div>KONSEP INTERNAL • v1.0 • Data ilustratif</div>
	</footer>
</div>
