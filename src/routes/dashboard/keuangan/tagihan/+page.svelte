<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { CircleCheck, TriangleAlert, Save } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const permohonanSiapTagih = $derived(data.permohonanSiapTagih);

	let selectedIdDaftar = $state('');
	let noInvoiceInput = $state('');
	let biayaTransportasi = $state<number>(1200000);
	let uangHarian = $state<number>(1500000);
	let penginapan = $state<number>(900000);
	let catatanPerhitungan = $state('');

	const selectedPermohonan = $derived(
		permohonanSiapTagih.find((p) => p.id_daftar === selectedIdDaftar) ?? permohonanSiapTagih[0]
	);

	$effect(() => {
		if (selectedPermohonan) {
			const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
			const currentYear = new Date().getFullYear();
			const suffix = Math.floor(100 + Math.random() * 900);
			noInvoiceInput = `INV/LPH/${currentMonth}/${currentYear}/${suffix}`;
		}
	});

	const totalBiayaOperasional = $derived(
		Number(biayaTransportasi || 0) + Number(uangHarian || 0) + Number(penginapan || 0)
	);

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Rincian Biaya Audit - SIM LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER TITLE & ACTION -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Rincian Biaya Audit</h1>
			<p class="mt-1 text-xs text-slate-500">
				Susun biaya operasional audit terperinci dan terbitkan invoice tagihan baru.
			</p>
		</div>

		<button
			type="submit"
			form="form-terbit-tagihan"
			disabled={!selectedIdDaftar || totalBiayaOperasional <= 0}
			class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-40"
		>
			<Save class="h-4 w-4" />
			<span>Simpan Rincian Biaya</span>
		</button>
	</div>

	<!-- ALERT TOAST -->
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

	<!-- MAIN WORKSPACE -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<div class="space-y-6 lg:col-span-7">
			<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
				<h2 class="text-base font-bold text-slate-900">Komponen biaya operasional</h2>

				<form id="form-terbit-tagihan" method="POST" action="?/terbitkanTagihan" class="space-y-6">
					<div class="space-y-1.5">
						<label for="id_daftar" class="block text-xs font-semibold text-slate-700"
							>Permohonan Audit Target *</label
						>
						<select
							id="id_daftar"
							name="id_daftar"
							bind:value={selectedIdDaftar}
							required
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
						>
							<option value="" disabled>-- Pilih Permohonan Audit --</option>
							{#each permohonanSiapTagih as item (item.id_daftar)}
								<option value={item.id_daftar}
									>{item.id_daftar} - {item.nama_pu} ({item.skala_usaha})</option
								>
							{/each}
						</select>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-1.5">
							<label for="biaya_transportasi" class="block text-xs font-semibold text-slate-700"
								>Biaya Transportasi *</label
							>
							<input
								type="number"
								id="biaya_transportasi"
								name="biaya_transportasi"
								bind:value={biayaTransportasi}
								min="0"
								required
								class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="uang_harian" class="block text-xs font-semibold text-slate-700"
								>Uang Harian (UH) *</label
							>
							<input
								type="number"
								id="uang_harian"
								name="uang_harian"
								bind:value={uangHarian}
								min="0"
								required
								class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-1.5">
							<label for="penginapan" class="block text-xs font-semibold text-slate-700"
								>Penginapan *</label
							>
							<input
								type="number"
								id="penginapan"
								name="penginapan"
								bind:value={penginapan}
								min="0"
								required
								class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="no_invoice" class="block text-xs font-semibold text-slate-700"
								>Nomor Invoice *</label
							>
							<input
								type="text"
								id="no_invoice"
								name="no_invoice"
								bind:value={noInvoiceInput}
								required
								class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="catatan_perhitungan" class="block text-xs font-semibold text-slate-700"
							>Catatan Perhitungan</label
						>
						<textarea
							id="catatan_perhitungan"
							name="catatan_perhitungan"
							rows="3"
							bind:value={catatanPerhitungan}
							placeholder="Audit lokasi, rincian perjalanan & penginapan."
							class="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 focus:border-[#059669] focus:outline-none"
						></textarea>
					</div>
				</form>
			</div>
		</div>

		<div class="space-y-6 lg:col-span-5">
			<div class="space-y-6 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-2xs">
				<h2 class="text-sm font-bold text-slate-900">Ringkasan biaya</h2>

				<div class="space-y-3 border-b border-emerald-100 pb-4 text-xs">
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Transportasi</span>
						<span class="font-bold text-slate-900">{formatRupiah(biayaTransportasi || 0)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Uang Harian</span>
						<span class="font-bold text-slate-900">{formatRupiah(uangHarian || 0)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Penginapan</span>
						<span class="font-bold text-slate-900">{formatRupiah(penginapan || 0)}</span>
					</div>
				</div>

				<div class="space-y-1">
					<span class="text-[11px] font-bold tracking-wider text-[#059669] uppercase"
						>Total Biaya Operasional</span
					>
					<p class="text-3xl font-extrabold text-[#059669]">
						{formatRupiah(totalBiayaOperasional)}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
