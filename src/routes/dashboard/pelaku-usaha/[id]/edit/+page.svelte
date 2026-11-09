<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import {
		Save,
		TriangleAlert,
		ExternalLink,
		MapPin,
		Phone,
		ArrowLeft,
		Lock
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Nilai default diambil dari data load atau kembalian form error jika ada
	let alamatInput = $derived(form?.values?.alamat_outlet ?? data.pelakuUsaha.alamat_outlet);

	function bukaGmapsRoute() {
		const asal = encodeURIComponent('UIN Sunan Ampel Surabaya Kampus 1');
		const tujuan = encodeURIComponent(alamatInput || 'Surabaya');
		window.open(`https://www.google.com/maps/dir/${asal}/${tujuan}`, '_blank');
	}
</script>

<svelte:head>
	<title>Edit Pelaku Usaha {data.pelakuUsaha.id_daftar} - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Top Navigation Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a
				href={resolve('/dashboard/pelaku-usaha')}
				class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900"
				aria-label="Kembali ke Daftar Pelaku Usaha"
			>
				<ArrowLeft class="h-4 w-4" />
			</a>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">
					Edit Pelaku Usaha ({data.pelakuUsaha.id_daftar})
				</h1>
				<p class="mt-1 text-xs text-slate-500">
					Perbarui informasi identitas badan usaha dan cakupan lokasi audit.
				</p>
			</div>
		</div>
	</div>

	<!-- ALERT NOTIFICATION ERROR -->
	{#if form?.error}
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
			<h2 class="text-base font-bold text-slate-900">Perbarui Identitas Pelaku Usaha</h2>
			<p class="text-xs text-slate-400">
				Lengkapi seluruh kolom wajib (*). Perubahan data akan langsung tersimpan ke database.
			</p>
		</div>

		<form id="form-edit-pelaku-usaha" method="POST" action="?/update" class="space-y-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- No ID-Daftar (ReadOnly/Disabled karena Primary Key) -->
				<div class="space-y-1.5">
					<label for="id_daftar_display" class="block text-xs font-semibold text-slate-700">
						No ID-Daftar (Locked)
					</label>
					<div class="relative flex items-center">
						<input
							type="text"
							id="id_daftar_display"
							value={data.pelakuUsaha.id_daftar}
							disabled
							class="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500"
						/>
						<Lock class="absolute right-3.5 h-4 w-4 text-slate-400" />
					</div>
					<p class="text-[11px] text-slate-400">Nomor registrasi utama tidak dapat diubah.</p>
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
						value={form?.values?.nama_pu ?? data.pelakuUsaha.nama_pelaku_usaha}
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
						value={form?.values?.jumlah_produk ?? data.pelakuUsaha.jumlah_produk}
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
						value={form?.values?.jumlah_outlet ?? data.pelakuUsaha.jumlah_outlet}
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
							value={form?.values?.jarak ?? data.pelakuUsaha.jarak_dari_pusat_kota}
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
							value={form?.values?.kontak_penyelia ?? data.pelakuUsaha.kontak_penyelia}
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
			<div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
				<a
					href={resolve('/dashboard/pelaku-usaha')}
					class="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
				>
					Batal
				</a>
				<button
					type="submit"
					class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
				>
					<Save class="h-4 w-4" />
					<span>Simpan Perubahan</span>
				</button>
			</div>
		</form>
	</div>
</div>
