<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';
	import { CircleCheck, TriangleAlert, Upload, Download, FileSpreadsheet } from '@lucide/svelte';

	let { form }: { form: ActionData } = $props();

	let selectedFile = $state<File | null>(null);
	let isUploading = $state(false);

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
		}
	}
</script>

<svelte:head>
	<title>Migrasi Data - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">Migrasi Data Lama</h1>
		<p class="mt-1 text-sm text-slate-500">
			Migrasi massal data Pelaku Usaha, Permohonan Audit, Keuangan, dan Tim Petugas dari berkas
			spreadsheet.
		</p>
	</div>

	<!-- Toast Notification -->
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

	<!-- UPLOAD CARD CONTAINER -->
	<div class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
		<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h2 class="text-base font-bold text-[#0F172A]">Unggah Berkas Spreadsheet (.xlsx / .csv)</h2>
				<p class="text-xs text-slate-500">
					Pastikan format kolom sesuai dengan template standar sistem SIM LPH.
				</p>
			</div>
			<a
				href={resolve('/api/template-excel')}
				download="Template_Migrasi_Pelaku_Usaha_LPH.csv"
				class="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
			>
				<Download class="h-4 w-4" />
				<span>Unduh Template Format</span>
			</a>
		</div>

		<form
			method="POST"
			action="?/uploadExcel"
			enctype="multipart/form-data"
			onsubmit={() => (isUploading = true)}
			class="space-y-6"
		>
			<!-- File Drop Area dengan Accessibility Label Binding -->
			<label
				for="excel_file"
				class="flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 transition-all hover:border-[#059669] hover:bg-emerald-50/30"
			>
				<div class="flex flex-col items-center justify-center px-4 pt-5 pb-6 text-center">
					{#if selectedFile}
						<FileSpreadsheet class="mb-3 h-10 w-10 text-[#059669]" />
						<p class="text-xs font-bold text-[#0F172A]">{selectedFile.name}</p>
						<p class="mt-0.5 text-[11px] text-slate-400">
							{(selectedFile.size / 1024).toFixed(1)} KB - siap diunggah
						</p>
					{:else}
						<Upload class="mb-3 h-10 w-10 text-[#059669]" />
						<p class="mb-1 text-xs font-semibold text-slate-600">
							Klik untuk memilih berkas atau seret ke area ini
						</p>
						<p class="text-[11px] text-slate-400">
							Format yang didukung: XLSX, XLS, CSV (Maksimal 10MB)
						</p>
					{/if}
				</div>
				<input
					type="file"
					id="excel_file"
					name="excel_file"
					accept=".xlsx, .xls, .csv"
					onchange={handleFileSelect}
					class="hidden"
					required
				/>
			</label>

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={!selectedFile || isUploading}
					class="flex h-11 items-center justify-center gap-2 rounded-full bg-[#059669] px-8 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-40"
				>
					<span>{isUploading ? 'Memproses Import Data...' : 'Jalankan Proses Import'}</span>
				</button>
			</div>
		</form>
	</div>
</div>
