<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import type { JenisTransaksiEnum } from '#lib/types.ts';
	import { Save, ArrowLeft, TriangleAlert } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tagihan = $derived(data.tagihan);

	let jenisTransaksi = $derived<JenisTransaksiEnum>(tagihan.jenis_transaksi ?? 'TAGIHAN_FINAL');
	let jumlahUang = $derived<number>(tagihan.jumlah_uang ?? 0);
	let catatanPerhitungan = $derived<string>(tagihan.catatan_revisi ?? '');

	const opsiJenisTransaksi: { value: JenisTransaksiEnum; label: string }[] = [
		{ value: 'TRANSPORT_TALANGAN', label: 'Transport Talangan' },
		{ value: 'UH_PENGINAPAN', label: 'Uang Harian & Penginapan' },
		{ value: 'BIAYA_LPH', label: 'Biaya Perhitungan LPH' },
		{ value: 'INPUT_SISTEM', label: 'Biaya Input Sistem' },
		{ value: 'TENTATIVE_LAPANGAN', label: 'Biaya Tentative Lapangan' },
		{ value: 'TAGIHAN_FINAL', label: 'Tagihan Final Paket Audit' },
		{ value: 'BIAYA_LAIN', label: 'Biaya Lain-lain' }
	];

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount || 0);
	}
</script>

<svelte:head>
	<title>Edit Invoice {tagihan.no_invoice} - SIM LPH</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- HEADER TITLE & ACTION -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Edit Rincian Biaya Invoice</h1>
			<p class="mt-1 text-xs text-slate-500">
				{tagihan.no_invoice} • {tagihan.nama_pu}
			</p>
		</div>
		<a
			href={resolve(`/dashboard/keuangan/konfirmasi`)}
			class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>Batal</span>
		</a>
	</div>

	<!-- ALERT TOAST -->
	{#if form?.error}
		<div
			class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-bold text-rose-900"
		>
			<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
			<p>{form.error}</p>
		</div>
	{/if}

	<!-- FORM CARD -->
	<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-8">
		<form method="POST" class="space-y-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- Select Jenis Transaksi -->
				<div class="space-y-1.5">
					<label for="jenis_transaksi" class="block text-xs font-semibold text-slate-700"
						>Jenis Transaksi *</label
					>
					<select
						id="jenis_transaksi"
						name="jenis_transaksi"
						bind:value={jenisTransaksi}
						required
						class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:bg-white focus:outline-none"
					>
						{#each opsiJenisTransaksi as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Input Jumlah Uang -->
				<div class="space-y-1.5">
					<label for="jumlah_uang" class="block text-xs font-semibold text-slate-700"
						>Jumlah Uang (Rp) *</label
					>
					<input
						type="number"
						id="jumlah_uang"
						name="jumlah_uang"
						bind:value={jumlahUang}
						min="0"
						step="1000"
						required
						class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:bg-white focus:outline-none"
					/>
				</div>
			</div>

			<!-- Catatan -->
			<div class="space-y-1.5">
				<label for="catatan_perhitungan" class="block text-xs font-semibold text-slate-700"
					>Catatan Perhitungan / Revisi</label
				>
				<textarea
					id="catatan_perhitungan"
					name="catatan_perhitungan"
					rows="3"
					bind:value={catatanPerhitungan}
					placeholder="Audit lokasi, rincian perjalanan & penginapan."
					class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-900 focus:border-[#059669] focus:bg-white focus:outline-none"
				></textarea>
			</div>

			<!-- FOOTER TOTAL & SUBMIT -->
			<div class="flex items-center justify-between border-t border-slate-100 pt-6">
				<div>
					<p class="text-[11px] text-slate-400">Total Nominal Baru:</p>
					<p class="text-xl font-extrabold text-[#059669]">{formatRupiah(jumlahUang || 0)}</p>
				</div>
				<button
					type="submit"
					class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[#059669] px-8 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
				>
					<Save class="h-4 w-4" />
					<span>Simpan Perubahan</span>
				</button>
			</div>
		</form>
	</div>
</div>
