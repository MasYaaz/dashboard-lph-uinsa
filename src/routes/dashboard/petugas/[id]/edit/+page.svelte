<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import { Save, ArrowLeft, TriangleAlert } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const petugas = $derived(data.petugas);
</script>

<svelte:head>
	<title>Edit Petugas #{petugas.id_petugas} - SIM LPH</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Edit Data Petugas</h1>
			<p class="mt-1 text-xs text-slate-500">
				Perbarui informasi personil petugas #{petugas.id_petugas}.
			</p>
		</div>

		<a
			href={resolve('/dashboard/petugas')}
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
			<div class="space-y-1.5">
				<label for="nama_petugas" class="block text-xs font-semibold text-slate-700"
					>Nama Lengkap Petugas *</label
				>
				<input
					type="text"
					id="nama_petugas"
					name="nama_petugas"
					value={petugas.nama_petugas}
					required
					class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="peran" class="block text-xs font-semibold text-slate-700">Peran Petugas *</label
				>
				<select
					id="peran"
					name="peran"
					required
					class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
				>
					<option value="AUDITOR" selected={petugas.peran === 'AUDITOR'}>AUDITOR</option>
					<option value="DEWAN_SYARIAH" selected={petugas.peran === 'DEWAN_SYARIAH'}
						>DEWAN SYARIAH</option
					>
				</select>
			</div>

			<div class="space-y-1.5">
				<label for="kontak" class="block text-xs font-semibold text-slate-700"
					>Nomor WhatsApp / Kontak</label
				>
				<input
					type="text"
					id="kontak"
					name="kontak"
					value={petugas.kontak ?? ''}
					class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
				/>
			</div>

			<div class="flex items-center justify-end border-t border-slate-100 pt-6">
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
