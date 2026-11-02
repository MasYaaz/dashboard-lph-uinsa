<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import {
		Plus,
		Clock,
		Calendar,
		Search,
		FileSpreadsheet,
		ChevronRight,
		CircleCheck,
		CircleAlert,
		Funnel,
		BuildingComplex
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const stats = $derived(data.stats);
	const pelakuUsahaList = $derived(data.pelakuUsahaList);
	const userRole = $derived(data.userRole);

	// State Filter UI
	let searchQuery = $state('');
	let selectedStatus = $state('');

	// Trigger Auto Download CSV jika Server Action Export Berhasil
	$effect(() => {
		if (form?.success && form?.fileData && form?.fileName) {
			const blob = new Blob([form.fileData], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.setAttribute('href', url);
			link.setAttribute('download', form.fileName);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	});

	function formatRupiah(amount: number | null): string {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Rekap Data & Export - SIM LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Top Bar Action & Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Rekap Data & Export</h1>
			<p class="mt-1 text-xs text-slate-500">
				Pantau pemeriksaan, status verifikasi, dan biaya final dalam satu tampilan.
			</p>
		</div>

		{#if userRole === 'ADMINISTRASI'}
			<a
				href={resolve(`/dashboard/pelaku-usaha`)}
				class="inline-flex h-11 items-center gap-2 rounded-full bg-[#059669] px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
			>
				<Plus class="h-4 w-4" />
				<span>Tambah Data</span>
			</a>
		{/if}
	</div>

	<!-- 4 TOP STATS CARDS -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Card 1: Total Pelaku Usaha -->
		<div class="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
			<div class="flex items-center justify-between text-slate-400">
				<span class="text-xs font-semibold">Total pelaku usaha</span>
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
					<BuildingComplex class="h-4 w-4" />
				</div>
			</div>
			<div>
				<p class="text-3xl font-bold text-slate-900">{stats.totalPu}</p>
				<p class="mt-1 text-[11px] font-medium text-slate-400">+12 data bulan ini</p>
			</div>
		</div>

		<!-- Card 2: Menunggu Verifikasi -->
		<div class="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
			<div class="flex items-center justify-between text-slate-400">
				<span class="text-xs font-semibold">Menunggu verifikasi</span>
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
					<Clock class="h-4 w-4" />
				</div>
			</div>
			<div>
				<p class="text-3xl font-bold text-slate-900">
					{String(stats.menungguVerifikasi).padStart(2, '0')}
				</p>
				<p class="mt-1 text-[11px] font-medium text-amber-600">Perlu ditindaklanjuti</p>
			</div>
		</div>

		<!-- Card 3: Terverifikasi -->
		<div class="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
			<div class="flex items-center justify-between text-slate-400">
				<span class="text-xs font-semibold">Terverifikasi</span>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]"
				>
					<CircleCheck class="h-4 w-4" />
				</div>
			</div>
			<div>
				<p class="text-3xl font-bold text-slate-900">{stats.terverifikasi}</p>
				<p class="mt-1 text-[11px] font-medium text-slate-400">89,2% dari seluruh data</p>
			</div>
		</div>

		<!-- Card 4: Perlu Revisi -->
		<div class="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
			<div class="flex items-center justify-between text-slate-400">
				<span class="text-xs font-semibold">Perlu revisi</span>
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
					<CircleAlert class="h-4 w-4" />
				</div>
			</div>
			<div>
				<p class="text-3xl font-bold text-slate-900">
					{String(stats.perluRevisi).padStart(2, '0')}
				</p>
				<p class="mt-1 text-[11px] font-medium text-slate-400">Menunggu perbaikan admin</p>
			</div>
		</div>
	</div>

	<!-- FILTER DATA CARD -->
	<div class="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
		<div>
			<h2 class="text-base font-bold text-slate-900">Filter data</h2>
			<p class="text-xs text-slate-400">
				Sesuaikan kriteria untuk melihat dan mengekspor data yang relevan.
			</p>
		</div>

		<form method="GET" class="space-y-4">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<!-- Date Range -->
				<div class="space-y-1.5">
					<label for="rentang_tanggal" class="block text-xs font-semibold text-slate-700"
						>Rentang tanggal pendaftaran</label
					>
					<div class="relative flex items-center">
						<input
							type="text"
							id="rentang_tanggal"
							readonly
							value="01 Okt 2026 — 31 Okt 2026"
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 focus:outline-none"
						/>
						<Calendar class="absolute right-3.5 h-4 w-4 text-slate-400" />
					</div>
				</div>

				<!-- Multi-Select Status -->
				<div class="space-y-1.5">
					<label for="status_filter" class="block text-xs font-semibold text-slate-700"
						>Status • Select</label
					>
					<select
						id="status_filter"
						name="status"
						bind:value={selectedStatus}
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
					>
						<option value="">Semua Status (Pending, Terverifikasi, Revisi)</option>
						<option value="PENDING">• Pending</option>
						<option value="TERVERIFIKASI">• Terverifikasi</option>
						<option value="REVISI">• Revisi</option>
					</select>
				</div>

				<!-- Search Input -->
				<div class="space-y-1.5">
					<label for="cari_pu" class="block text-xs font-semibold text-slate-700"
						>Cari pelaku usaha</label
					>
					<div class="relative flex items-center">
						<input
							type="text"
							id="cari_pu"
							name="q"
							bind:value={searchQuery}
							placeholder="No ID / Nama pelaku usaha"
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-xs placeholder:text-slate-400 focus:outline-none"
						/>
						<Search class="absolute right-3.5 h-4 w-4 text-slate-400" />
					</div>
				</div>
			</div>

			<div class="flex items-center justify-between pt-2">
				<div class="flex items-center gap-3">
					<button
						type="submit"
						class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#047857]"
					>
						<Funnel class="h-3.5 w-3.5" />
						<span>Terapkan Filter</span>
					</button>

					<a
						href={resolve(`/dashboard`)}
						class="text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
					>
						Reset Filter
					</a>
				</div>

				<span class="text-xs font-medium text-slate-400">Periode aktif: Oktober 2026</span>
			</div>
		</form>
	</div>

	<!-- DATA TABLE & EXPORT CONTAINER -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
		<!-- Table Header Bar -->
		<div class="flex items-center justify-between border-b border-slate-100 p-6">
			<div class="flex items-center gap-3">
				<h2 class="text-base font-bold text-slate-900">Daftar pelaku usaha</h2>
				<span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563EB]">
					• {pelakuUsahaList.length} data
				</span>
			</div>

			<!-- SERVER ACTION EXPORT EXCEL BUTTON -->
			<form method="POST" action="?/exportExcel">
				<button
					type="submit"
					class="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/60 px-4 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
				>
					<FileSpreadsheet class="h-4 w-4" />
					<span>Export to Excel ({userRole})</span>
				</button>
			</form>
		</div>

		<!-- Table Element -->
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-400"
					>
						<th class="px-6 py-3.5">ID Daftar</th>
						<th class="px-6 py-3.5">Nama Pelaku Usaha</th>
						<th class="px-6 py-3.5">Tim Auditor</th>
						<th class="px-6 py-3.5">Total Biaya Final</th>
						<th class="px-6 py-3.5">Status</th>
						<th class="px-6 py-3.5 text-right">Akses Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-medium text-slate-700">
					{#each pelakuUsahaList as item (item.idDaftar)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-4 font-bold text-[#2563EB]">{item.idDaftar}</td>
							<td class="px-6 py-4 font-bold text-slate-900">{item.namaPu}</td>
							<td class="px-6 py-4 text-slate-600">{item.timAuditor}</td>
							<td class="px-6 py-4 font-bold text-slate-900">{formatRupiah(item.totalBiaya)}</td>
							<td class="px-6 py-4">
								{#if item.status === 'TERVERIFIKASI'}
									<span class="inline-flex items-center gap-1 text-xs font-bold text-[#059669]">
										• Terverifikasi
									</span>
								{:else if item.status === 'PENDING'}
									<span class="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
										• Pending
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
										• Revisi
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-right">
								{#if item.status === 'PENDING'}
									<a
										href={resolve(`/dashboard/penugasan`)}
										class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
									>
										<span>Lengkapi data</span>
										<ChevronRight class="h-3.5 w-3.5" />
									</a>
								{:else if item.status === 'REVISI'}
									<a
										href={resolve(`/dashboard/keuangan/konfirmasi`)}
										class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
									>
										<span>Tinjau revisi</span>
										<ChevronRight class="h-3.5 w-3.5" />
									</a>
								{:else}
									<a
										href={resolve(`/dashboard/rekap`)}
										class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
									>
										<span>Lihat detail</span>
										<ChevronRight class="h-3.5 w-3.5" />
									</a>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="py-12 text-center text-xs text-slate-400">
								Tidak ada data pelaku usaha yang sesuai kriteria filter.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Table Pagination Footer -->
		<div
			class="flex items-center justify-between border-t border-slate-100 p-6 text-xs font-medium text-slate-400"
		>
			<div>Menampilkan 1-{pelakuUsahaList.length} dari {stats.totalPu} data</div>
			<div class="flex items-center gap-4">
				<span>Baris per halaman: 6</span>
				<div class="flex items-center gap-1 font-bold text-slate-700">
					<button type="button" class="rounded-lg bg-emerald-50 px-2.5 py-1 text-[#059669]"
						>1</button
					>
					<button type="button" class="rounded-lg px-2.5 py-1 hover:bg-slate-100">2</button>
					<button type="button" class="rounded-lg px-2.5 py-1 hover:bg-slate-100">3</button>
				</div>
			</div>
		</div>
	</div>
</div>
