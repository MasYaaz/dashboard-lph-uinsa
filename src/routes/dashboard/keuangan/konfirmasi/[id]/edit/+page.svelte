<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import { Save, ArrowLeft, TriangleAlert } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const tagihan = $derived(data.tagihan);

	let transport = $derived(tagihan.biaya_transportasi);
	let uh = $derived(tagihan.uang_harian);
	let penginapan = $derived(tagihan.penginapan);
	let catatan = $derived(tagihan.catatan_perhitungan);

	const totalBaru = $derived(Number(transport || 0) + Number(uh || 0) + Number(penginapan || 0));

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Edit Invoice {tagihan.no_invoice} - SIM LPH</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Edit Rincian Biaya Invoice</h1>
			<p class="mt-1 text-xs text-slate-500">
				{tagihan.no_invoice} • {tagihan.nama_pu} ({tagihan.id_daftar})
			</p>
		</div>

		<a
			href={resolve('/dashboard/keuangan/konfirmasi')}
			class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>Batal</span>
		</a>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-bold text-rose-900"
		>
			<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
			<p>{form.error}</p>
		</div>
	{/if}

	<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
		<form method="POST" class="space-y-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="space-y-1.5">
					<label for="biaya_transportasi" class="block text-xs font-semibold text-slate-700"
						>Transportasi (Rp) *</label
					>
					<input
						type="number"
						id="biaya_transportasi"
						name="biaya_transportasi"
						bind:value={transport}
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="uang_harian" class="block text-xs font-semibold text-slate-700"
						>Uang Harian (Rp) *</label
					>
					<input
						type="number"
						id="uang_harian"
						name="uang_harian"
						bind:value={uh}
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="penginapan" class="block text-xs font-semibold text-slate-700"
						>Penginapan (Rp) *</label
					>
					<input
						type="number"
						id="penginapan"
						name="penginapan"
						bind:value={penginapan}
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
					bind:value={catatan}
					class="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 focus:border-[#059669] focus:outline-none"
				></textarea>
			</div>

			<div class="flex items-center justify-between border-t border-slate-100 pt-6">
				<div>
					<p class="text-[11px] text-slate-400">Total Invoice Baru:</p>
					<p class="text-lg font-extrabold text-[#059669]">{formatRupiah(totalBaru)}</p>
				</div>

				<button
					type="submit"
					class="inline-flex h-11 items-center gap-2 rounded-full bg-[#059669] px-8 text-xs font-bold text-white shadow-sm hover:bg-[#047857]"
				>
					<Save class="h-4 w-4" />
					<span>Simpan Perubahan</span>
				</button>
			</div>
		</form>
	</div>
</div>
