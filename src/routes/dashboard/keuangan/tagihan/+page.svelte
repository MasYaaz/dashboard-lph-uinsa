<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { JenisTransaksiEnum } from '#lib/types.ts';
	import { CircleCheck, TriangleAlert, Save, Plus, Trash } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const permohonanSiapTagih = $derived(data.permohonanSiapTagih);

	let selectedIdDaftar = $state('');
	let noInvoiceInput = $state('');

	// Tipe items transaksi dinamis
	interface ItemTransaksi {
		id: string;
		jenis_transaksi: JenisTransaksiEnum;
		jumlah_uang: number;
		catatan: string;
	}

	// Dynamic array items
	let itemsTransaksi = $state<ItemTransaksi[]>([
		{
			id: crypto.randomUUID(),
			jenis_transaksi: 'TAGIHAN_FINAL',
			jumlah_uang: 3600000,
			catatan: ''
		}
	]);

	const opsiJenisTransaksi: { value: JenisTransaksiEnum; label: string }[] = [
		{ value: 'TRANSPORT_TALANGAN', label: 'Transport Talangan' },
		{ value: 'UH_PENGINAPAN', label: 'Uang Harian & Penginapan' },
		{ value: 'BIAYA_LPH', label: 'Biaya Perhitungan LPH' },
		{ value: 'INPUT_SISTEM', label: 'Biaya Input Sistem' },
		{ value: 'TENTATIVE_LAPANGAN', label: 'Biaya Tentative Lapangan' },
		{ value: 'TAGIHAN_FINAL', label: 'Tagihan Final Paket Audit' },
		{ value: 'BIAYA_LAIN', label: 'Biaya Lain-lain' }
	];

	// Hitung total nominal uang secara kumulatif
	const totalNominalUang = $derived(
		itemsTransaksi.reduce((sum, item) => sum + (Number(item.jumlah_uang) || 0), 0)
	);

	$effect(() => {
		if (selectedIdDaftar) {
			const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
			const currentYear = new Date().getFullYear();
			const suffix = Math.floor(100 + Math.random() * 900);
			noInvoiceInput = `INV/LPH/${currentMonth}/${currentYear}/${suffix}`;
		}
	});

	function tambahItem() {
		itemsTransaksi.push({
			id: crypto.randomUUID(),
			jenis_transaksi: 'BIAYA_LAIN',
			jumlah_uang: 0,
			catatan: ''
		});
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
		}).format(amount);
	}

	function getLabelTransaksi(val: string): string {
		return opsiJenisTransaksi.find((o) => o.value === val)?.label ?? val;
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
				Catat rincian komponen transaksi biaya operasional audit dan terbitkan invoice tagihan baru.
			</p>
		</div>
		<button
			type="submit"
			form="form-terbit-tagihan"
			disabled={!selectedIdDaftar || totalNominalUang <= 0}
			class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-40"
		>
			<Save class="h-4 w-4" />
			<span>Simpan Seluruh Transaksi</span>
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
		<!-- INPUT FORM MAIN -->
		<div class="space-y-6 lg:col-span-7">
			<form
				id="form-terbit-tagihan"
				method="POST"
				action="?/terbitkanTagihan"
				class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8"
			>
				<h2 class="text-base font-bold text-slate-900">Data Permohonan & Invoice</h2>

				<!-- Hidden Payload JSON untuk Multi Items -->
				<input type="hidden" name="items_json" value={JSON.stringify(itemsTransaksi)} />

				<!-- Selection Permohonan -->
				<div class="space-y-1.5">
					<label for="id_daftar" class="block text-xs font-semibold text-slate-700">
						Permohonan Audit Target *
					</label>
					<select
						id="id_daftar"
						name="id_daftar"
						bind:value={selectedIdDaftar}
						required
						class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:bg-white focus:outline-none"
					>
						<option value="" disabled>-- Pilih Permohonan Audit --</option>
						{#each permohonanSiapTagih as item (item.id_daftar)}
							<option value={item.id_daftar}>
								{item.id_daftar} - {item.nama_pu} ({item.skala_usaha})
							</option>
						{/each}
					</select>
				</div>

				<!-- No Invoice -->
				<div class="space-y-1.5">
					<label for="no_invoice" class="block text-xs font-semibold text-slate-700">
						Nomor Invoice *
					</label>
					<input
						type="text"
						id="no_invoice"
						name="no_invoice"
						bind:value={noInvoiceInput}
						required
						class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:bg-white focus:outline-none"
					/>
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
				class="sticky top-6 space-y-6 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-xs"
			>
				<h2 class="text-sm font-bold text-slate-900">Ringkasan Total Invoice</h2>

				<div class="space-y-3 border-b border-emerald-100 pb-4 text-xs">
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Nomor Invoice</span>
						<span class="font-mono font-bold text-slate-900">{noInvoiceInput || '-'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Jumlah Komponen</span>
						<span class="font-bold text-slate-900">{itemsTransaksi.length} Item</span>
					</div>
				</div>

				<!-- Itemized Breakdown List -->
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
