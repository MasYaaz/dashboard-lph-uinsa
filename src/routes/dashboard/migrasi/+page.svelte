<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const importLogs = $derived(data.importLogs);

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
	<title>Migrasi Excel - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">Batch Import Data Excel</h1>
		<p class="mt-1 text-sm text-slate-500">
			Migrasi massal data Pelaku Usaha & Permohonan Audit dari berkas spreadsheet (UC-06).
		</p>
	</div>

	<!-- Toast Notification -->
	{#if form?.success}
		<div
			class="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-[#108981]"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			<span>{form.message}</span>
		</div>
	{/if}

	{#if form?.error}
		<div
			class="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#F43F5E]"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- UPLOAD CARD CONTAINER -->
	<div class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
		<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h2 class="text-base font-bold text-[#0F172A]">Unggah Berkas Spreadsheet (.xlsx / .csv)</h2>
				<p class="text-xs text-slate-500">
					Pastikan format kolom sesuai dengan template standar sistem LPH
				</p>
			</div>

			<a
				href={resolve('/api/template-excel')}
				download="Template_Migrasi_Pelaku_Usaha_LPH.csv"
				class="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				<span>Unduh Template Format</span>
			</a>
		</div>

		<form method="POST" action="?/uploadExcel" enctype="multipart/form-data" class="space-y-6">
			<!-- File Drop Area -->
			<label
				class="flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 transition-all hover:border-[#059669] hover:bg-emerald-50/30"
			>
				<div class="flex flex-col items-center justify-center px-4 pt-5 pb-6 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mb-3 h-10 w-10 text-[#059669]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					{#if selectedFile}
						<p class="text-xs font-bold text-[#0F172A]">{selectedFile.name}</p>
						<p class="mt-0.5 text-[11px] text-slate-400">
							{(selectedFile.size / 1024).toFixed(1)} KB - siap diunggah
						</p>
					{:else}
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
					class="flex h-11 items-center justify-center gap-2 rounded-full bg-[#059669] px-8 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
				>
					<span>Jalankan Proses Import</span>
				</button>
			</div>
		</form>
	</div>

	<!-- IMPORT ERROR LOGS TABLE -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
		<div class="border-b border-slate-100 p-6">
			<h2 class="text-base font-bold text-[#0F172A]">Riwayat & Catatan Error Import (Log)</h2>
			<p class="text-xs text-slate-500">
				Daftar baris spreadsheet yang gagal diimpor akibat duplikasi atau format tidak valid
			</p>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-500"
					>
						<th class="px-6 py-3.5">Waktu Log</th>
						<th class="px-6 py-3.5">Nama Berkas</th>
						<th class="px-6 py-3.5">Baris Excel</th>
						<th class="px-6 py-3.5">ID Daftar Input</th>
						<th class="px-6 py-3.5">Jenis Error</th>
						<th class="px-6 py-3.5">Pesan Kendala</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-normal text-[#0F172A]">
					{#each importLogs as log (log.id_log)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-3.5 whitespace-nowrap text-slate-500">{log.tgl_log}</td>
							<td class="px-6 py-3.5 font-medium text-slate-700">{log.nama_berkas}</td>
							<td class="px-6 py-3.5 font-bold text-[#0F172A]">Baris #{log.baris_ke}</td>
							<td class="px-6 py-3.5 font-semibold text-[#059669]">{log.id_daftar_input}</td>
							<td class="px-6 py-3.5">
								<span
									class="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-[#F43F5E]"
								>
									{log.jenis_error}
								</span>
							</td>
							<td class="max-w-xs truncate px-6 py-3.5 text-slate-600">{log.pesan_error}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="py-12 text-center text-xs text-slate-400">
								Belum ada catatan error import log.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
