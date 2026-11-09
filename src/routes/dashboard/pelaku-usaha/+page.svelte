<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import {
		MapPin,
		Phone,
		Save,
		ArrowRight,
		Search,
		Sparkles,
		ExternalLink,
		TriangleAlert,
		CircleCheck
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const pelakuUsahaList = $derived(data.pelakuUsahaList);
	const recommendedId = $derived(data.recommendedId);

	// 1. Inisialisasi State lokal dengan string kosong
	let idDaftarInput = $state('');
	let alamatInput = $state('');
	let searchQuery = $state('');

	// 2. Gunakan $effect untuk menyinkronkan state lokal saat form / recommendedId diperbarui
	$effect(() => {
		idDaftarInput = form?.values?.id_daftar ?? recommendedId ?? '';
		alamatInput = form?.values?.alamat_outlet ?? '';
	});

	// Function untuk membuka rute Google Maps dari UINSA Kampus 1 Surabaya ke Alamat Outlet
	function bukaGmapsRoute() {
		const uinsaCoords = 'Jl.+Ahmad+Yani+No.+117,+Surabaya';
		const destination = encodeURIComponent(alamatInput || 'Surabaya');
		const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${uinsaCoords}&destination=${destination}&travelmode=driving`;
		window.open(gmapsUrl, '_blank');
	}

	// Filter data tabel
	const filteredList = $derived(
		pelakuUsahaList.filter(
			(item) =>
				item.id_daftar.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.nama_pelaku_usaha.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.alamat_outlet.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Tambah Data Pelaku Usaha - SIM LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Top Navigation Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Form Pelaku Usaha</h1>
			<p class="mt-1 text-xs text-slate-500">
				Daftarkan identitas usaha sebagai langkah awal proses pemeriksaan halal LPH.
			</p>
		</div>
	</div>

	<!-- ALERT NOTIFICATION SUCCESS -->
	{#if form?.success}
		<div
			class="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs"
		>
			<div class="flex items-center gap-3">
				<CircleCheck class="h-5 w-5 shrink-0 text-[#059669]" />
				<p class="font-bold text-emerald-900">{form.message}</p>
			</div>
		</div>
	{/if}

	<!-- ALERT NOTIFICATION: DUPLIKAT ID-DAFTAR / GENERAL ERROR -->
	{#if form?.duplicateError}
		<div
			class="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs"
		>
			<div class="flex items-start gap-3">
				<TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
				<div class="space-y-1">
					<p class="font-bold text-amber-900">Periksa kembali No ID-Daftar</p>
					<p class="text-amber-700">
						Nomor yang dimasukkan sudah terdaftar. Gunakan nomor baru atau buka data yang sudah ada.
					</p>
				</div>
			</div>
			<a
				href={resolve(`/dashboard`)}
				class="inline-flex shrink-0 items-center gap-1 font-bold text-amber-900 hover:underline"
			>
				<span>Buka rekap data</span>
				<ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>
	{:else if form?.error}
		<div
			class="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs"
		>
			<div class="flex items-center gap-3">
				<TriangleAlert class="h-5 w-5 shrink-0 text-rose-600" />
				<p class="font-bold text-rose-900">{form.error}</p>
			</div>
		</div>
	{/if}

	<!-- FORM CONTAINER CARD -->
	<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
		<div>
			<h2 class="text-base font-bold text-slate-900">Identitas pelaku usaha</h2>
			<p class="text-xs text-slate-400">
				Lengkapi seluruh kolom wajib (*). Data dapat diperbarui sewaktu-waktu oleh Staf Administrasi.
			</p>
		</div>

		<form id="form-pelaku-usaha" method="POST" action="?/tambah" class="space-y-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- No ID-Daftar -->
				<div class="space-y-1.5">
					<label for="id_daftar" class="block text-xs font-semibold text-slate-700">
						No ID-Daftar *
					</label>
					<div class="relative flex items-center">
						<input
							type="text"
							id="id_daftar"
							name="id_daftar"
							bind:value={idDaftarInput}
							placeholder="REG-2026-XXXX"
							required
							class="w-full rounded-2xl border px-4 py-3 text-xs font-semibold transition-all focus:outline-none {form?.fieldError?.id_daftar
								? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
								: 'border-slate-200 bg-white text-slate-900 focus:border-[#059669]'}"
						/>
						{#if form?.fieldError?.id_daftar}
							<TriangleAlert class="absolute right-3.5 h-4 w-4 text-rose-500" />
						{/if}
					</div>
					{#if form?.fieldError?.id_daftar}
						<p class="text-[11px] font-semibold text-rose-600">{form.fieldError.id_daftar}</p>
					{/if}
					{#if form?.suggestedId}
						<button
							type="button"
							onclick={() => (idDaftarInput = form?.suggestedId ?? '')}
							class="inline-flex items-center gap-1 pt-0.5 text-[11px] font-bold text-[#059669] hover:underline"
						>
							<Sparkles class="h-3 w-3" />
							<span>Gunakan nomor tersedia: {form.suggestedId}</span>
						</button>
					{/if}
				</div>

				<!-- Nama Pelaku Usaha -->
				<div class="space-y-1.5">
					<label for="nama_pu" class="block text-xs font-semibold text-slate-700">
						Nama Pelaku Usaha *
					</label>
					<input
						type="text"
						id="nama_pu"
						name="nama_pu"
						value={form?.values?.nama_pu ?? ''}
						placeholder="CV Dapur Rasa Nusantara"
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none"
					/>
					<p class="text-[11px] text-slate-400">Nama badan usaha sesuai dokumen pendaftaran.</p>
				</div>

				<!-- Scope Jumlah Produk -->
				<div class="space-y-1.5">
					<label for="jumlah_produk" class="block text-xs font-semibold text-slate-700">
						Jumlah Varian Produk *
					</label>
					<input
						type="number"
						id="jumlah_produk"
						name="jumlah_produk"
						min="1"
						value={form?.values?.jumlah_produk ?? 1}
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					/>
					<p class="text-[11px] text-slate-400">Jumlah produk yang akan diaudit halal.</p>
				</div>

				<!-- Scope Jumlah Outlet -->
				<div class="space-y-1.5">
					<label for="jumlah_outlet" class="block text-xs font-semibold text-slate-700">
						Jumlah Outlet / Pabrik *
					</label>
					<input
						type="number"
						id="jumlah_outlet"
						name="jumlah_outlet"
						min="1"
						value={form?.values?.jumlah_outlet ?? 1}
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					/>
					<p class="text-[11px] text-slate-400">Jumlah titik lokasi fasilitas produksi/outlet.</p>
				</div>

				<!-- Alamat Lengkap Outlet -->
				<div class="space-y-1.5 md:col-span-1">
					<label for="alamat_outlet" class="block text-xs font-semibold text-slate-700">
						Alamat Lengkap Outlet *
					</label>
					<textarea
						id="alamat_outlet"
						name="alamat_outlet"
						rows="3"
						bind:value={alamatInput}
						placeholder="Jl. Raya Darmo No. 123, Surabaya, Jawa Timur"
						required
						class="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none"
					></textarea>
					<p class="text-[11px] text-slate-400">
						Cantumkan lokasi outlet utama yang akan diperiksa.
					</p>
				</div>

				<!-- Jarak (km) dari UINSA Kampus 1 Surabaya -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<label for="jarak" class="block text-xs font-semibold text-slate-700">
							Jarak dari LPH (km) *
						</label>
						<button
							type="button"
							onclick={bukaGmapsRoute}
							class="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
						>
							<span>Hitung dari UINSA Kampus 1</span>
							<ExternalLink class="h-3 w-3" />
						</button>
					</div>
					<div class="relative flex items-center">
						<input
							type="number"
							step="0.1"
							id="jarak"
							name="jarak"
							value={form?.values?.jarak ?? ''}
							placeholder="35"
							required
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
						/>
						<MapPin class="absolute right-3.5 h-4 w-4 text-slate-400" />
					</div>
					<p class="text-[11px] text-slate-400">
						Jarak satu arah dari kantor LPH (UINSA Kampus 1) ke lokasi audit.
					</p>
				</div>

				<!-- Nomor Kontak Penyelia Halal -->
				<div class="space-y-1.5 md:col-span-2">
					<label for="kontak_penyelia" class="block text-xs font-semibold text-slate-700">
						Nomor Kontak / WhatsApp Penyelia Halal *
					</label>
					<div class="relative flex items-center">
						<input
							type="text"
							id="kontak_penyelia"
							name="kontak_penyelia"
							value={form?.values?.kontak_penyelia ?? ''}
							placeholder="Ibu Rina (0812 3456 7890)"
							required
							class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
						/>
						<Phone class="absolute right-3.5 h-4 w-4 text-slate-400" />
					</div>
					<p class="text-[11px] text-slate-400">
						Gunakan nomor aktif penyelia halal atau penanggung jawab usaha.
					</p>
				</div>
			</div>

			<!-- Action Buttons Footer -->
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
				<a
					href={resolve(`/dashboard`)}
					class="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
				>
					Batal
				</a>
				<button
					type="submit"
					class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
				>
					<Save class="h-4 w-4" />
					<span>Simpan Data</span>
				</button>
			</div>
		</form>
	</div>

	<!-- TABEL REKAP DATA TERDAFTAR -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
		<div class="flex items-center justify-between border-b border-slate-100 p-6">
			<div>
				<h2 class="text-base font-bold text-slate-900">Daftar Pelaku Usaha Terdaftar</h2>
				<p class="text-xs text-slate-400">Total {filteredList.length} Pelaku Usaha dalam sistem</p>
			</div>
			<div class="relative w-64">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari ID / Nama..."
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
						<th class="px-6 py-3.5">Scope Audit</th>
						<th class="px-6 py-3.5">Jarak (UINSA 1)</th>
						<th class="px-6 py-3.5">Kontak Penyelia</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-medium text-slate-700">
					{#each filteredList as item (item.id_daftar)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-4 font-bold text-[#2563EB]">{item.id_daftar}</td>
							<td class="px-6 py-4 font-bold text-slate-900">{item.nama_pelaku_usaha}</td>
							<td class="px-6 py-4 text-slate-600">
								{item.jumlah_produk} Produk / {item.jumlah_outlet} Outlet
							</td>
							<td class="px-6 py-4 font-semibold text-slate-900">{item.jarak_dari_pusat_kota} km</td>
							<td class="px-6 py-4 text-slate-600">{item.nama_kontak_penyelia}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="py-12 text-center text-xs text-slate-400">
								Belum ada data pelaku usaha yang tersimpan.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
