<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import { Calendar, CircleCheck, Search, TriangleAlert } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const permohonanPending = $derived(data.permohonanPending);
	const auditorList = $derived(data.auditorList);
	const dewanSyariahList = $derived(data.dewanSyariahList);
	const riwayatPenugasan = $derived(data.riwayatPenugasan);

	// State Form lokal
	let selectedIdDaftar = $state('');
	let idAuditorUtama = $state('');
	let idAuditorAnggota = $state('');
	let idDewanSyariah = $state('');
	let searchQuery = $state('');

	// Reaktif sync saat permohonan pending dimuat atau form berubah
	$effect(() => {
		if (!selectedIdDaftar && permohonanPending.length > 0) {
			selectedIdDaftar = permohonanPending[0].id_daftar;
		}
	});

	// Permohonan Terpilih Detail
	const selectedPermohonan = $derived(
		permohonanPending.find((p) => p.id_daftar === selectedIdDaftar) ?? permohonanPending[0]
	);

	// Hitung total personil tim terpilih
	const totalTimTerpilih = $derived(
		(idAuditorUtama ? 1 : 0) + (idAuditorAnggota ? 1 : 0) + (idDewanSyariah ? 1 : 0)
	);

	// Filter Riwayat Penugasan
	const filteredRiwayat = $derived(
		riwayatPenugasan.filter(
			(r) =>
				r.id_daftar.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.nama_pu.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.tim_petugas.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Penugasan Tim Field - SIM LPH</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8">
	<!-- HEADER TITLE -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Penugasan Tim Field</h1>
			<p class="mt-1 text-xs text-slate-500">
				Atur komposisi tim auditor & Dewan Syariah sesuai kebutuhan dan ketersediaan petugas.
			</p>
		</div>

		<a
			href={resolve('/dashboard')}
			class="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
		>
			Kembali ke Rekap
		</a>
	</div>

	<!-- ALERT NOTIFIKASI -->
	{#if form?.success}
		<div
			class="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs"
		>
			<CircleCheck class="h-5 w-5 shrink-0 text-[#059669]" />
			<p class="font-bold text-emerald-900">{form.message}</p>
		</div>
	{/if}

	{#if form?.error}
		<div
			class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs"
		>
			<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
			<p class="font-bold text-rose-900">{form.error}</p>
		</div>
	{/if}

	<!-- FORM CONTAINER CARD (SINGLE-COLUMN FULL WIDTH) -->
	<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
		<div>
			<span class="text-[11px] font-bold tracking-wider text-[#059669] uppercase"
				>Panel Penugasan</span
			>
			<h2 class="text-lg font-bold text-slate-900">Penugasan Tim Auditor & Dewan Syariah</h2>
		</div>

		<form id="form-penugasan" method="POST" action="?/tugaskan" class="space-y-6">
			<!-- SELECT PERMOHONAN & RINGKASAN RINGKAS -->
			<div class="space-y-3">
				<label for="id_daftar" class="block text-xs font-semibold text-slate-700">
					Permohonan Audit Target *
				</label>
				<select
					id="id_daftar"
					name="id_daftar"
					bind:value={selectedIdDaftar}
					required
					class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
				>
					<option value="" disabled>-- Pilih Permohonan Audit --</option>
					{#each permohonanPending as p (p.id_daftar)}
						<option value={p.id_daftar}>
							{p.id_daftar} - {p.nama_pu}
						</option>
					{/each}
				</select>

				<!-- QUICK INFO PERMOHONAN TERPILIH -->
				{#if selectedPermohonan}
					<div
						class="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs md:grid-cols-3"
					>
						<div class="space-y-0.5">
							<p class="text-[11px] font-medium text-slate-400">Nama Pelaku Usaha</p>
							<p class="font-bold text-slate-900">{selectedPermohonan.nama_pu}</p>
							<p class="text-[11px] font-semibold text-[#2563EB]">{selectedPermohonan.id_daftar}</p>
						</div>
						<div class="space-y-0.5">
							<p class="text-[11px] font-medium text-slate-400">Scope & Lokasi</p>
							<p class="font-semibold text-slate-700">
								{selectedPermohonan.jumlah_produk ?? 1} Produk • {selectedPermohonan.jumlah_outlet ??
									1} Outlet
							</p>
							<p class="truncate text-[11px] text-slate-500">
								{selectedPermohonan.alamat_outlet ?? '-'}
							</p>
						</div>
						<div class="space-y-0.5">
							<p class="text-[11px] font-medium text-slate-400">Jarak dari LPH (UINSA 1)</p>
							<p class="font-bold text-[#2563EB]">
								{selectedPermohonan.jarak_dari_pusat_kota ?? 0} km
							</p>
							<div class="flex items-center gap-1 pt-0.5 text-[11px] text-slate-500">
								<Calendar class="h-3 w-3 text-slate-400" />
								<span
									>Tanggal: {selectedPermohonan.tanggal_permohonan ??
										selectedPermohonan.tanggal_permohonan}</span
								>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- SECTION: PEMILIHAN AUDITOR -->
			<div class="space-y-4 border-t border-slate-100 pt-2">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
						1. Tim Auditor Field
					</h3>
					<span class="text-[11px] font-semibold text-slate-500"
						>Pilih 1 Utama & Opsional 1 Anggota</span
					>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Auditor Utama -->
					<div class="space-y-1.5">
						<label for="id_auditor_utama" class="block text-xs font-semibold text-slate-700">
							Auditor Utama *
						</label>
						<select
							id="id_auditor_utama"
							name="id_auditor_utama"
							bind:value={idAuditorUtama}
							required
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
						>
							<option value="" disabled>-- Pilih Auditor Utama --</option>
							{#each auditorList as a (a.id_petugas)}
								<option value={a.id_petugas}>{a.nama_petugas} (Auditor)</option>
							{/each}
						</select>
					</div>

					<!-- Auditor Anggota -->
					<div class="space-y-1.5">
						<label for="id_auditor_anggota" class="block text-xs font-semibold text-slate-700">
							Auditor Anggota (Opsional)
						</label>
						<select
							id="id_auditor_anggota"
							name="id_auditor_anggota"
							bind:value={idAuditorAnggota}
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
						>
							<option value="">-- Tanpa Auditor Anggota --</option>
							{#each auditorList as a (a.id_petugas)}
								{#if String(a.id_petugas) !== idAuditorUtama}
									<option value={a.id_petugas}>{a.nama_petugas} (Auditor)</option>
								{/if}
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- SECTION: PEMILIHAN DEWAN SYARIAH -->
			<div class="space-y-4 border-t border-slate-100 pt-2">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
						2. Dewan Syariah
					</h3>
					<span class="text-[11px] font-semibold text-slate-500">Wajib 1 Personil</span>
				</div>

				<div class="space-y-1.5">
					<label for="id_dewan_syariah" class="block text-xs font-semibold text-slate-700">
						Dewan Syariah *
					</label>
					<select
						id="id_dewan_syariah"
						name="id_dewan_syariah"
						bind:value={idDewanSyariah}
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					>
						<option value="" disabled>-- Pilih Dewan Syariah --</option>
						{#each dewanSyariahList as d (d.id_petugas)}
							<option value={d.id_petugas}>{d.nama_petugas} (Dewan Syariah)</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- ACTION SUBMIT BUTTON -->
			<div class="flex items-center justify-between border-t border-slate-100 pt-4">
				<span class="text-xs text-slate-400">{totalTimTerpilih} petugas siap ditugaskan</span>
				<button
					type="submit"
					disabled={!selectedIdDaftar || !idAuditorUtama || !idDewanSyariah}
					class="inline-flex h-11 items-center gap-2 rounded-full bg-[#059669] px-8 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-40"
				>
					<CircleCheck class="h-4 w-4" />
					<span>Simpan Penugasan</span>
				</button>
			</div>
		</form>
	</div>

	<!-- TABEL RIWAYAT PENUGASAN -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
		<div class="flex items-center justify-between border-b border-slate-100 p-6">
			<div>
				<h2 class="text-base font-bold text-slate-900">Riwayat Penugasan Tim Field</h2>
				<p class="text-xs text-slate-400">
					Daftar penugasan tim auditor yang telah resmi disetujui
				</p>
			</div>

			<div class="relative w-64">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari ID / Tim..."
					class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pr-9 text-xs placeholder:text-slate-400 focus:border-[#059669] focus:outline-none"
				/>
				<Search class="absolute top-2.5 right-3 h-4 w-4 text-slate-400" />
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-400"
					>
						<th class="px-6 py-3.5">ID Daftar</th>
						<th class="px-6 py-3.5">Nama Pelaku Usaha</th>
						<th class="px-6 py-3.5">Tim Petugas Ditugaskan</th>
						<th class="px-6 py-3.5">Tanggal Plotting</th>
						<th class="px-6 py-3.5">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-medium text-slate-700">
					{#each filteredRiwayat as r (r.id_penugasan)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-4 font-bold text-[#2563EB]">{r.id_daftar}</td>
							<td class="px-6 py-4 font-bold text-slate-900">{r.nama_pu}</td>
							<td class="max-w-xs truncate px-6 py-4 text-slate-600">{r.tim_petugas}</td>
							<td class="px-6 py-4 text-slate-500">{r.tgl_penugasan}</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#059669]"
								>
									• {r.status_penugasan}
								</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="py-12 text-center text-xs text-slate-400">
								Belum ada riwayat penugasan tim.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
