<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import {
		Calendar,
		CircleCheck,
		TriangleAlert,
		Plus,
		Trash,
		ArrowLeft,
		UserCheck,
		ShieldCheck,
		Lock
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const detail = $derived(data.penugasanDetail);
	const auditorList = $derived(data.auditorList);
	const dewanSyariahList = $derived(data.dewanSyariahList);

	// State Form lokal dinamis
	let selectedAuditors = $derived<string[]>([...data.existingAuditorIds]);
	let selectedDewanSyariah = $derived<string[]>([...data.existingDewanIds]);

	// Hitung total personil tim valid yang dipilih
	const totalTimTerpilih = $derived(
		selectedAuditors.filter(Boolean).length + selectedDewanSyariah.filter(Boolean).length
	);

	function tambahAuditor() {
		selectedAuditors = [...selectedAuditors, ''];
	}

	function hapusAuditor(index: number) {
		if (selectedAuditors.length > 1) {
			selectedAuditors = selectedAuditors.filter((_, i) => i !== index);
		}
	}

	function tambahDewanSyariah() {
		selectedDewanSyariah = [...selectedDewanSyariah, ''];
	}

	function hapusDewanSyariah(index: number) {
		if (selectedDewanSyariah.length > 1) {
			selectedDewanSyariah = selectedDewanSyariah.filter((_, i) => i !== index);
		}
	}
</script>

<svelte:head>
	<title>Edit Penugasan Tim #{detail.id_penugasan} - SIM LPH</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8">
	<!-- HEADER TITLE & BACK BUTTON -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a
				href={resolve('/dashboard/penugasan')}
				class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900"
				aria-label="Kembali ke Riwayat Penugasan"
			>
				<ArrowLeft class="h-4 w-4" />
			</a>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">
					Edit Penugasan Tim (#{detail.id_penugasan})
				</h1>
				<p class="mt-1 text-xs text-slate-500">
					Perbarui alokasi Auditor Field dan Dewan Syariah untuk permohonan {detail.id_daftar}.
				</p>
			</div>
		</div>
	</div>

	<!-- ALERT NOTIFIKASI ERROR -->
	{#if form?.error}
		<div
			class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs"
		>
			<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
			<p class="font-bold text-rose-900">{form.error}</p>
		</div>
	{/if}

	<!-- FORM CONTAINER CARD -->
	<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
		<div>
			<span class="text-[11px] font-bold tracking-wider text-[#059669] uppercase"
				>Edit Komposisi Tim</span
			>
			<h2 class="text-lg font-bold text-slate-900">Perbarui Anggota Tim Field</h2>
		</div>

		<!-- RINGKASAN DATA PERMOHONAN -->
		<div class="space-y-1.5">
			<label for="id_daftar_display" class="block text-xs font-semibold text-slate-700">
				Permohonan Audit Target (Locked)
			</label>
			<div class="relative flex items-center">
				<input
					type="text"
					id="id_daftar_display"
					value={`${detail.id_daftar} - ${detail.nama_pu}`}
					disabled
					class="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500"
				/>
				<Lock class="absolute right-3.5 h-4 w-4 text-slate-400" />
			</div>

			<div
				class="mt-3 grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs md:grid-cols-3"
			>
				<div class="space-y-0.5">
					<p class="text-[11px] font-medium text-slate-400">Nama Pelaku Usaha</p>
					<p class="font-bold text-slate-900">{detail.nama_pu}</p>
					<p class="text-[11px] font-semibold text-[#2563EB]">{detail.id_daftar}</p>
				</div>
				<div class="space-y-0.5">
					<p class="text-[11px] font-medium text-slate-400">Scope & Lokasi</p>
					<p class="font-semibold text-slate-700">
						{detail.jumlah_produk} Produk • {detail.jumlah_outlet} Outlet
					</p>
					<p class="truncate text-[11px] text-slate-500">{detail.alamat_outlet}</p>
				</div>
				<div class="space-y-0.5">
					<p class="text-[11px] font-medium text-slate-400">Jarak dari LPH (UINSA 1)</p>
					<p class="font-bold text-[#2563EB]">{detail.jarak_dari_pusat_kota} km</p>
					<div class="flex items-center gap-1 pt-0.5 text-[11px] text-slate-500">
						<Calendar class="h-3 w-3 text-slate-400" />
						<span>Tanggal: {detail.tanggal_permohonan}</span>
					</div>
				</div>
			</div>
		</div>

		<form id="form-edit-penugasan" method="POST" action="?/update" class="space-y-6">
			<!-- SECTION 1: PEMILIHAN MULTI-AUDITOR FIELD -->
			<div class="space-y-4 border-t border-slate-100 pt-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<UserCheck class="h-4 w-4 text-[#059669]" />
						<h3 class="text-xs font-bold tracking-wider text-slate-700 uppercase">
							1. Tim Auditor Field (Minimal 1)
						</h3>
					</div>
					<button
						type="button"
						onclick={tambahAuditor}
						class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
					>
						<Plus class="h-3.5 w-3.5" />
						<span>Tambah Auditor</span>
					</button>
				</div>

				<div class="space-y-3">
					{#each selectedAuditors as auditorId, idx (idx)}
						<div class="flex items-center gap-3">
							<div class="relative w-full">
								<select
									name="id_auditor"
									bind:value={selectedAuditors[idx]}
									required
									class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
								>
									<option value="" disabled
										>-- Pilih Auditor {idx === 0 ? '(Utama)' : `Anggota #${idx}`} --</option
									>
									{#each auditorList as a (a.id_petugas)}
										{#if !selectedAuditors.includes(String(a.id_petugas)) || auditorId === String(a.id_petugas)}
											<option value={a.id_petugas}>{a.nama_petugas} (Auditor)</option>
										{/if}
									{/each}
								</select>
							</div>
							{#if selectedAuditors.length > 1}
								<button
									type="button"
									onclick={() => hapusAuditor(idx)}
									class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
									title="Hapus Auditor"
								>
									<Trash class="h-4 w-4" />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- SECTION 2: PEMILIHAN MULTI-DEWAN SYARIAH -->
			<div class="space-y-4 border-t border-slate-100 pt-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<ShieldCheck class="h-4 w-4 text-[#2563EB]" />
						<h3 class="text-xs font-bold tracking-wider text-slate-700 uppercase">
							2. Dewan Syariah (Minimal 1)
						</h3>
					</div>
					<button
						type="button"
						onclick={tambahDewanSyariah}
						class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB] transition-all hover:bg-blue-100"
					>
						<Plus class="h-3.5 w-3.5" />
						<span>Tambah Dewan Syariah</span>
					</button>
				</div>

				<div class="space-y-3">
					{#each selectedDewanSyariah as dewanId, idx (idx)}
						<div class="flex items-center gap-3">
							<div class="relative w-full">
								<select
									name="id_dewan_syariah"
									bind:value={selectedDewanSyariah[idx]}
									required
									class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#2563EB] focus:outline-none"
								>
									<option value="" disabled>-- Pilih Dewan Syariah #{idx + 1} --</option>
									{#each dewanSyariahList as d (d.id_petugas)}
										{#if !selectedDewanSyariah.includes(String(d.id_petugas)) || dewanId === String(d.id_petugas)}
											<option value={d.id_petugas}>{d.nama_petugas} (Dewan Syariah)</option>
										{/if}
									{/each}
								</select>
							</div>
							{#if selectedDewanSyariah.length > 1}
								<button
									type="button"
									onclick={() => hapusDewanSyariah(idx)}
									class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
									title="Hapus Dewan Syariah"
								>
									<Trash class="h-4 w-4" />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- ACTION SUBMIT BUTTON FOOTER -->
			<div class="flex items-center justify-between border-t border-slate-100 pt-4">
				<span class="text-xs font-medium text-slate-500">
					{totalTimTerpilih} personil petugas dialokasikan
				</span>
				<div class="flex items-center gap-3">
					<a
						href={resolve('/dashboard/penugasan')}
						class="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
					>
						Batal
					</a>
					<button
						type="submit"
						disabled={selectedAuditors.some((id) => !id) || selectedDewanSyariah.some((id) => !id)}
						class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-8 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-40"
					>
						<CircleCheck class="h-4 w-4" />
						<span>Simpan Perubahan</span>
					</button>
				</div>
			</div>
		</form>
	</div>
</div>
