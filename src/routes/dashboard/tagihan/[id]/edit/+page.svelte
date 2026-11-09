<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import type { JenisTransaksiEnum } from '#lib/types.ts';
	import { TriangleAlert, Save, Plus, Trash, ArrowLeft, Lock } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const detail = $derived(data.detailTagihan);

	interface ItemTransaksi {
		id: string;
		jenis_transaksi: JenisTransaksiEnum;
		jumlah_uang: number;
		catatan: string;
	}

	// Inisialisasi state array dinamis yang dapat di-edit langsung
	let itemsTransaksi = $derived<ItemTransaksi[]>(
		(data.itemsTagihan ?? []).map((item) => ({
			id: crypto.randomUUID(),
			jenis_transaksi: item.jenis_transaksi,
			jumlah_uang: item.jumlah_uang,
			catatan: item.catatan ?? ''
		}))
	);

	const opsiJenisTransaksi: { value: JenisTransaksiEnum; label: string }[] = [
		{ value: 'TRANSPORT_TALANGAN', label: 'Transport Talangan' },
		{ value: 'UH_PENGINAPAN', label: 'Uang Harian & Penginapan' },
		{ value: 'BIAYA_LPH', label: 'Biaya Perhitungan LPH' },
		{ value: 'INPUT_SISTEM', label: 'Biaya Input Sistem' },
		{ value: 'TENTATIVE_LAPANGAN', label: 'Biaya Tentative Lapangan' },
		{ value: 'TAGIHAN_FINAL', label: 'Tagihan Final Paket Audit' },
		{ value: 'BIAYA_LAIN', label: 'Biaya Lain-lain' }
	];

	const totalNominalUang = $derived(
		itemsTransaksi.reduce((sum, item) => sum + (Number(item.jumlah_uang) || 0), 0)
	);

	function tambahItem() {
		itemsTransaksi = [
			...itemsTransaksi,
			{ id: crypto.randomUUID(), jenis_transaksi: 'BIAYA_LAIN', jumlah_uang: 0, catatan: '' }
		];
	}

	function hapusItem(id: string) {
		if (itemsTransaksi.length > 1) {
			itemsTransaksi = itemsTransaksi.filter((item) => item.id !== id);
		}
	}

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount || 0);
	}

	function getLabelTransaksi(val: string): string {
		return opsiJenisTransaksi.find((o) => o.value === val)?.label ?? val;
	}
</script>

<svelte:head>
	<title>Edit Invoice {detail.no_invoice} - SIM LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER TITLE & NAVIGATION -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a
				href={resolve('/dashboard/tagihan')}
				class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900"
				aria-label="Kembali ke Daftar Tagihan"
			>
				<ArrowLeft class="h-4 w-4" />
			</a>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">
					Edit Invoice ({detail.no_invoice})
				</h1>
				<p class="mt-1 text-xs text-slate-500">
					Perbarui komponen dan rincian transaksi tagihan biaya operasional audit.
				</p>
			</div>
		</div>
		<button
			type="submit"
			form="form-edit-tagihan"
			disabled={totalNominalUang <= 0}
			class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-40"
		>
			<Save class="h-4 w-4" />
			<span>Simpan Perubahan</span>
		</button>
	</div>

	<!-- ALERT ERROR -->
	{#if form?.error}
		<div
			class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-900"
		>
			<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- MAIN WORKSPACE -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<!-- INPUT FORM MAIN -->
		<div class="space-y-6 lg:col-span-7">
			<form
				id="form-edit-tagihan"
				method="POST"
				action="?/updateTagihan"
				class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-8"
			>
				<h2 class="text-base font-bold text-slate-900">Data Permohonan & Invoice</h2>
				<input type="hidden" name="items_json" value={JSON.stringify(itemsTransaksi)} />

				<!-- Target Permohonan (Locked) -->
				<div class="space-y-1.5">
					<label for="id_daftar_display" class="block text-xs font-semibold text-slate-700">
						Pelaku Usaha Target (Locked)
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
				</div>

				<!-- No Invoice (Locked) -->
				<div class="space-y-1.5">
					<label for="no_invoice_display" class="block text-xs font-semibold text-slate-700">
						Nomor Invoice (Locked)
					</label>
					<div class="relative flex items-center">
						<input
							type="text"
							id="no_invoice_display"
							value={detail.no_invoice}
							disabled
							class="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-mono text-xs font-bold text-slate-500"
						/>
						<Lock class="absolute right-3.5 h-4 w-4 text-slate-400" />
					</div>
				</div>

				<hr class="border-slate-100" />

				<!-- KOMPONEN TRANSAKSI MULTI-ITEM -->
				<div class="flex items-center justify-between pt-2">
					<h3 class="text-sm font-bold text-slate-900">Rincian Komponen Biaya</h3>
					<button
						type="button"
						onclick={tambahItem}
						class="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#059669] hover:underline"
					>
						<Plus class="h-4 w-4" />
						<span>Tambah Komponen</span>
					</button>
				</div>

				<div class="space-y-4">
					{#each itemsTransaksi as item, index (item.id)}
						<div
							class="relative space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300"
						>
							<div class="flex items-center justify-between">
								<span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
									Item #{index + 1}
								</span>
								{#if itemsTransaksi.length > 1}
									<button
										type="button"
										onclick={() => hapusItem(item.id)}
										class="cursor-pointer text-slate-400 hover:text-rose-600"
										title="Hapus Komponen"
									>
										<Trash class="h-4 w-4" />
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
								<!-- Jenis Transaksi -->
								<div class="space-y-1">
									<label
										for="jenis_transaksi_{item.id}"
										class="block text-[11px] font-medium text-slate-600"
									>
										Jenis Transaksi
									</label>
									<select
										id="jenis_transaksi_{item.id}"
										bind:value={item.jenis_transaksi}
										class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
									>
										{#each opsiJenisTransaksi as opt (opt.value)}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
								</div>

								<!-- Jumlah Uang -->
								<div class="space-y-1">
									<label
										for="jumlah_uang_{item.id}"
										class="block text-[11px] font-medium text-slate-600"
									>
										Jumlah Uang (Rp)
									</label>
									<input
										id="jumlah_uang_{item.id}"
										type="number"
										bind:value={item.jumlah_uang}
										min="0"
										step="1000"
										class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
									/>
								</div>
							</div>

							<!-- Catatan -->
							<div class="space-y-1">
								<input
									type="text"
									bind:value={item.catatan}
									placeholder="Catatan rincian biaya (opsional)..."
									class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#059669] focus:outline-none"
								/>
							</div>
						</div>
					{/each}
				</div>
			</form>
		</div>

		<!-- RINGKASAN SIDEBAR -->
		<div class="space-y-6 lg:col-span-5">
			<div
				class="sticky top-6 space-y-6 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-2xs"
			>
				<h2 class="text-sm font-bold text-slate-900">Ringkasan Total Invoice</h2>

				<div class="space-y-3 border-b border-emerald-100 pb-4 text-xs">
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Nomor Invoice</span>
						<span class="font-mono font-bold text-slate-900">{detail.no_invoice}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Jumlah Komponen</span>
						<span class="font-bold text-slate-900">{itemsTransaksi.length} Item</span>
					</div>
				</div>

				<div class="max-h-56 space-y-2.5 overflow-y-auto pr-1 text-xs">
					{#each itemsTransaksi as item (item.id)}
						<div class="flex items-start justify-between gap-2 border-b border-emerald-100/60 pb-2">
							<div>
								<p class="font-semibold text-slate-800">
									{getLabelTransaksi(item.jenis_transaksi)}
								</p>
								{#if item.catatan}
									<p class="text-[10px] text-slate-500">{item.catatan}</p>
								{/if}
							</div>
							<span class="font-mono font-bold text-slate-900">
								{formatRupiah(item.jumlah_uang || 0)}
							</span>
						</div>
					{/each}
				</div>

				<div class="space-y-1 border-t border-emerald-100 pt-4">
					<span class="text-[11px] font-bold tracking-wider text-[#059669] uppercase"
						>Total Akhir Tagihan</span
					>
					<p class="text-3xl font-extrabold text-[#059669]">
						{formatRupiah(totalNominalUang)}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
