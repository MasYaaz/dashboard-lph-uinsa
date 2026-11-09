<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import {
		Plus,
		Search,
		Pencil,
		Trash,
		CircleCheck,
		TriangleAlert,
		BuildingComplex
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state('');

	const filteredList = $derived(
		data.pelakuUsahaList.filter(
			(item) =>
				item.id_daftar.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.nama_pelaku_usaha.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.kontak_penyelia.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Daftar Pelaku Usaha - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header & Action -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Daftar Pelaku Usaha</h1>
			<p class="mt-1 text-xs text-slate-500">
				Kelola seluruh data badan usaha yang terdaftar dalam sistem pemeriksaan halal LPH.
			</p>
		</div>

		<div>
			<a
				href={resolve(`/dashboard/pelaku-usaha/new`)}
				class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
			>
				<Plus class="h-4 w-4" />
				<span>Tambah Pelaku Usaha</span>
			</a>
		</div>
	</div>

	<!-- Alert Feedback Success / Error -->
	{#if form?.success}
		<div
			class="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-900"
		>
			<CircleCheck class="h-5 w-5 shrink-0 text-[#059669]" />
			<span>{form.message}</span>
		</div>
	{/if}

	{#if form?.error}
		<div
			class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-900"
		>
			<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- TABEL REKAP DATA TERDAFTAR -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
		<div
			class="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between"
		>
			<div>
				<h2 class="text-base font-bold text-slate-900">Data Pelaku Usaha Terdaftar</h2>
				<p class="text-xs text-slate-400">
					Menampilkan {filteredList.length} dari total {data.pelakuUsahaList.length} entri
				</p>
			</div>
			<div class="relative w-full sm:w-72">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari ID, nama usaha, penyelia..."
					class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-9 text-xs placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:outline-none"
				/>
				<Search class="absolute top-3 right-3 h-4 w-4 text-slate-400" />
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
						<th class="px-6 py-3.5">Scope Audit</th>
						<th class="px-6 py-3.5">Jarak LPH</th>
						<th class="px-6 py-3.5">Kontak Penyelia</th>
						<th class="px-6 py-3.5 text-center">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-medium text-slate-700">
					{#each filteredList as item (item.id_daftar)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-4 font-bold text-[#2563EB]">{item.id_daftar}</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									<BuildingComplex class="h-4 w-4 shrink-0 text-slate-400" />
									<span class="font-bold text-slate-900">{item.nama_pelaku_usaha}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-slate-600">
								{item.jumlah_produk} Produk / {item.jumlah_outlet} Outlet
							</td>
							<td class="px-6 py-4 font-semibold text-slate-900">{item.jarak_dari_pusat_kota} km</td
							>
							<td class="px-6 py-4 text-slate-600">{item.kontak_penyelia}</td>
							<td class="px-6 py-4 text-center">
								<div class="flex items-center justify-center gap-2">
									<!-- Tombol Edit -->
									<a
										href={resolve(`/dashboard/pelaku-usaha/[id]/edit`, {
											id: String(item.id_daftar)
										})}
										class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-[#059669]"
										title="Edit Data"
									>
										<Pencil class="h-3.5 w-3.5" />
									</a>

									<!-- Tombol Delete Form -->
									<form
										method="POST"
										action="?/delete"
										onsubmit={(e) => {
											if (
												!confirm(
													`Apakah Anda yakin ingin menghapus data "${item.nama_pelaku_usaha}" (${item.id_daftar})?`
												)
											) {
												e.preventDefault();
											}
										}}
									>
										<input type="hidden" name="id_daftar" value={item.id_daftar} />
										<button
											type="submit"
											class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
											title="Hapus Data"
										>
											<Trash class="h-3.5 w-3.5" />
										</button>
									</form>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="py-12 text-center text-xs text-slate-400">
								{searchQuery
									? 'Tidak ada data yang cocok dengan kata kunci pencarian.'
									: 'Belum ada data pelaku usaha yang tersimpan.'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
