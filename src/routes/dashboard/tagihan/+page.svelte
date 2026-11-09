<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import type { JenisTransaksiEnum } from '#lib/types.ts';
	import {
		CircleCheck,
		TriangleAlert,
		Search,
		X,
		Trash,
		Plus,
		Pencil,
		ReceiptText
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const daftarTagihan = $derived(data?.daftarTagihan ?? []);

	let searchQuery = $state('');
	let statusFilter = $state('ALL');
	let selectedDeleteTagihan = $state<{ id: number; invoice: string } | null>(null);
	let selectedKonfirmasiTagihan = $state<{
		id: number;
		invoice: string;
		nama: string;
		total: number;
	} | null>(null);

	const mapLabelJenis: Record<JenisTransaksiEnum, string> = {
		TRANSPORT_TALANGAN: 'Transport Talangan',
		UH_PENGINAPAN: 'UH & Penginapan',
		BIAYA_LPH: 'Biaya LPH',
		INPUT_SISTEM: 'Input Sistem',
		TENTATIVE_LAPANGAN: 'Tentative Lapangan',
		TAGIHAN_FINAL: 'Tagihan Final Paket',
		BIAYA_LAIN: 'Biaya Lain'
	};

	const filteredTagihan = $derived(
		(daftarTagihan ?? []).filter((item) => {
			const matchSearch =
				item.no_invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.id_daftar.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.nama_pu.toLowerCase().includes(searchQuery.toLowerCase());

			const isDiterima = item.status_keuangan === 'DITERIMA';
			const matchStatus =
				statusFilter === 'ALL' ? true : statusFilter === 'DITERIMA' ? isDiterima : !isDiterima;

			return matchSearch && matchStatus;
		})
	);

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount || 0);
	}
</script>

<svelte:head>
	<title>Daftar Invoice Tagihan - SIM LPH</title>
</svelte:head>

<div class="space-y-6">
	<!-- HEADER TITLE & NAVIGATION -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">
				Verifikasi & Konfirmasi Pembayaran
			</h1>
			<p class="mt-1 text-xs text-slate-500">
				Kelola konfirmasi pembayaran invoice audit, rincian komponen transaksi, dan verifikasi
				tagihan.
			</p>
		</div>
		<a
			href={resolve('/dashboard/tagihan/new')}
			class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
		>
			<Plus class="h-4 w-4" />
			<span>Terbitkan Invoice Baru</span>
		</a>
	</div>

	<!-- ALERT TOAST SUCCESS / ERROR -->
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

	<!-- TABEL REKAP & FILTER -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
		<div
			class="flex flex-col items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-6 md:flex-row"
		>
			<div>
				<h2 class="text-sm font-bold text-slate-900">Daftar Invoice Penagihan Header-Detail</h2>
				<p class="text-xs text-slate-400">Total {filteredTagihan.length} invoice ditemukan</p>
			</div>
			<div class="flex w-full items-center gap-3 md:w-auto">
				<select
					bind:value={statusFilter}
					class="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
				>
					<option value="ALL">Semua Status</option>
					<option value="SIAP_VERIFIKASI">Siap Verifikasi</option>
					<option value="DITERIMA">Diterima / Lunas</option>
				</select>

				<div class="relative w-full md:w-64">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari No Invoice / PU..."
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-xs placeholder:text-slate-400 focus:border-[#059669] focus:outline-none"
					/>
					<Search class="absolute top-3 right-3 h-4 w-4 text-slate-400" />
				</div>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-400"
					>
						<th class="px-6 py-3.5">No Invoice</th>
						<th class="px-6 py-3.5">Pelaku Usaha</th>
						<th class="px-6 py-3.5">Rincian Komponen Biaya</th>
						<th class="px-6 py-3.5">Total Tagihan</th>
						<th class="px-6 py-3.5">Tanggal</th>
						<th class="px-6 py-3.5">Status</th>
						<th class="px-6 py-3.5 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-medium text-slate-700">
					{#each filteredTagihan as t (t.id_keuangan)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-4 font-mono font-bold text-[#059669]">
								<div class="flex items-center gap-1.5">
									<ReceiptText class="h-4 w-4 text-emerald-600" />
									<span>{t.no_invoice}</span>
								</div>
							</td>
							<td class="px-6 py-4">
								<p class="font-bold text-slate-900">{t.nama_pu}</p>
								<p class="text-[11px] text-slate-400">{t.id_daftar}</p>
							</td>
							<td class="px-6 py-4">
								<div class="flex max-w-xs flex-wrap gap-1">
									{#each t.items as item (item.id_detail_keuangan)}
										<span
											class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700"
										>
											{mapLabelJenis[item.jenis_transaksi] ?? item.jenis_transaksi} ({formatRupiah(
												item.jumlah_uang
											)})
										</span>
									{:else}
										<span class="text-[11px] text-slate-400 italic">Belum ada rincian</span>
									{/each}
								</div>
							</td>
							<td class="px-6 py-4 font-extrabold text-slate-900">
								{formatRupiah(t.total_tagihan)}
							</td>
							<td class="px-6 py-4 text-slate-500">{t.tgl_diterbitkan}</td>
							<td class="px-6 py-4">
								{#if t.status_keuangan === 'DITERIMA'}
									<span
										class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#059669]"
									>
										• DITERIMA / LUNAS
									</span>
								{:else if t.status_keuangan === 'REVISI'}
									<span
										class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700"
									>
										• REVISI
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#2563EB]"
									>
										• SIAP VERIFIKASI
									</span>
								{/if}
							</td>
							<td class="space-x-1.5 px-6 py-4 text-right">
								{#if t.status_keuangan !== 'DITERIMA'}
									<!-- Tombol Konfirmasi -->
									<button
										type="button"
										onclick={() =>
											(selectedKonfirmasiTagihan = {
												id: t.id_keuangan,
												invoice: t.no_invoice,
												nama: t.nama_pu,
												total: t.total_tagihan
											})}
										class="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
									>
										<CircleCheck class="h-3.5 w-3.5" />
										<span>Konfirmasi</span>
									</button>

									<!-- Tombol Edit (Mengarahkan ke rute tagihan edit) -->
									<a
										href={resolve('/dashboard/tagihan/[id]/edit', { id: String(t.id_keuangan) })}
										class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50"
										title="Edit Invoice"
									>
										<Pencil class="h-3 w-3" />
										<span>Edit</span>
									</a>

									<!-- Tombol Hapus -->
									<button
										type="button"
										onclick={() =>
											(selectedDeleteTagihan = { id: t.id_keuangan, invoice: t.no_invoice })}
										class="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50"
									>
										<Trash class="h-3.5 w-3.5" />
										<span>Hapus</span>
									</button>
								{:else}
									<span class="text-[11px] font-medium text-slate-400 italic">
										Terverifikasi (Diterima)
									</span>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="py-12 text-center text-xs text-slate-400">
								Belum ada tagihan keuangan yang perlu dikonfirmasi.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- MODAL KONFIRMASI PEMBAYARAN -->
{#if selectedKonfirmasiTagihan}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="text-sm font-bold text-slate-900">Konfirmasi Pembayaran</h3>
				<button
					type="button"
					onclick={() => (selectedKonfirmasiTagihan = null)}
					class="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-1 text-xs">
				<p class="text-slate-500">Nomor Invoice:</p>
				<p class="font-mono font-bold text-[#059669]">{selectedKonfirmasiTagihan.invoice}</p>
				<p class="pt-1 text-slate-500">
					Pelaku Usaha: <strong class="text-slate-900">{selectedKonfirmasiTagihan.nama}</strong>
				</p>
				<p class="text-slate-500">
					Total Pembayaran: <strong class="text-slate-900"
						>{formatRupiah(selectedKonfirmasiTagihan.total)}</strong
					>
				</p>
			</div>

			<p class="text-[11px] leading-relaxed text-slate-400">
				Tindakan ini akan mengonfirmasi bahwa seluruh rincian dana pada invoice ini telah diterima
				dan mengubah status menjadi <strong>DITERIMA</strong> (Terkunci).
			</p>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					onclick={() => (selectedKonfirmasiTagihan = null)}
					class="h-9 cursor-pointer rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
				>
					Batal
				</button>

				<form method="POST" action="?/konfirmasiPembayaran">
					<input type="hidden" name="id_keuangan" value={selectedKonfirmasiTagihan.id} />
					<button
						type="submit"
						class="h-9 cursor-pointer rounded-full bg-[#059669] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#047857]"
					>
						Konfirmasi DITERIMA
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL HAPUS TAGIHAN -->
{#if selectedDeleteTagihan}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="text-sm font-bold text-slate-900">Hapus Invoice Tagihan?</h3>
				<button
					type="button"
					onclick={() => (selectedDeleteTagihan = null)}
					class="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<p class="text-xs leading-relaxed text-slate-600">
				Apakah Anda yakin ingin menghapus invoice <strong class="font-mono text-slate-900"
					>{selectedDeleteTagihan.invoice}</strong
				> beserta seluruh rincian komponen biayanya?
			</p>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					onclick={() => (selectedDeleteTagihan = null)}
					class="h-9 cursor-pointer rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
				>
					Batal
				</button>

				<form method="POST" action="?/hapusTagihan">
					<input type="hidden" name="id_keuangan" value={selectedDeleteTagihan.id} />
					<button
						type="submit"
						class="h-9 cursor-pointer rounded-full bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
					>
						Ya, Hapus
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
