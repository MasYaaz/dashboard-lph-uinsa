<script lang="ts">
	import { ShieldCheck, Eye, EyeOff, TriangleAlert, LogIn } from '@lucide/svelte';
	import type { ActionData } from './$types';
	import logo from '#lib/assets/light.svg';

	let { form }: { form: ActionData } = $props();

	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Masuk ke SIM LPH - Sistem Internal</title>
</svelte:head>

<div
	class="flex min-h-screen w-full flex-col justify-center bg-[#F8FAFC] p-6 font-sans text-slate-800 sm:p-10"
>
	<!-- Main Content Card Area -->
	<main class="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
		<div class="w-full max-w-md space-y-4">
			<!-- Main Login Card -->
			<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
				<!-- Icon Header & Identity Badge -->
				<div class="flex items-center gap-3.5">
					<img src={logo} alt="Logo UINSA" class="h-12 w-auto shrink-0 object-contain" />
					<div class="space-y-0.5">
						<h1 class="text-base leading-none font-bold tracking-tight text-slate-900">
							SIM LPH UINSA
						</h1>
						<p class="text-xs font-medium text-slate-400">Sistem Internal</p>
					</div>
				</div>

				<!-- Header Title -->
				<div class="flex flex-col gap-2">
					<LogIn class="text-[#059669]" size="26" />
					<h2 class="text-xl font-bold tracking-tight text-slate-900">Masuk ke Sistem</h2>
				</div>

				<!-- Form Inputs -->
				<form method="POST" class="space-y-4">
					<!-- Username/Email Input -->
					<div class="space-y-1.5">
						<label for="username" class="block text-xs font-semibold text-slate-700">Username</label
						>
						<input
							type="text"
							id="username"
							name="username"
							value={form?.username ?? ''}
							placeholder="admin / bendahara"
							required
							autocomplete="username"
							class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:ring-2 focus:ring-[#059669]/20 focus:outline-none sm:text-sm"
						/>
					</div>

					<!-- Password Input -->
					<div class="space-y-1.5">
						<label for="password" class="block text-xs font-semibold text-slate-700"
							>Kata Sandi</label
						>
						<div class="relative flex items-center">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								placeholder="••••••••••••"
								required
								autocomplete="current-password"
								class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pr-11 pl-4 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:ring-2 focus:ring-[#059669]/20 focus:outline-none sm:text-sm"
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
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

					<!-- Submit Button -->
					<button
						type="submit"
						class="mt-2 flex w-full cursor-pointer items-center justify-center rounded-full bg-[#059669] px-4 py-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#047857] focus:ring-2 focus:ring-[#059669]/40 focus:outline-none active:scale-[0.99] sm:text-sm"
					>
						Masuk Aplikasi
					</button>
				</form>

				<!-- Footer Info Badge Inside Card -->
				<div class="space-y-3 border-t border-slate-100 pt-5">
					<div
						class="flex items-start gap-2.5 rounded-2xl bg-emerald-50/50 p-3 text-xs leading-relaxed text-slate-600"
					>
						<ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
						<span
							>Jaga kerahasiaan kata sandi. Jangan bagikan akses akun Anda kepada pihak lain.</span
						>
					</div>
					<p class="text-center text-xs font-medium text-slate-500">
						Belum memiliki akses?
						<a href="#hubungi-admin" class="font-bold text-[#059669] hover:underline">
							Hubungi Admin LPH
						</a>
					</p>
				</div>
			</div>

			<!-- State Alternatif: Error Toast Notification Box -->
			{#if form?.error}
				<div
					class="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs shadow-xs transition-all"
				>
					<TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
					<div class="space-y-0.5">
						<p class="font-bold text-rose-800">Tidak dapat masuk</p>
						<p class="leading-relaxed text-rose-600">{form.error}</p>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
