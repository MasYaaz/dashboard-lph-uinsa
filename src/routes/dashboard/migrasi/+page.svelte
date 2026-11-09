<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import {
		CircleCheck,
		TriangleAlert,
		Upload,
		Download,
		FileSpreadsheet,
		Table,
		Database,
		Trash,
		Plus,
		ArrowRight
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const daftarPetugas = $derived(data.referensi?.petugas ?? []);
	const daftarPermohonan = $derived(data.referensi?.permohonan ?? []);

	let selectedTable = $state('pelaku_usaha');
	let selectedFiles = $state<File[]>([]);
	let isPreviewing = $state(false);
	let isImporting = $state(false);

	let editableHeaders = $state<string[]>([]);
	let editableRows = $state<Record<string, string>[]>([]);

	$effect(() => {
		if (form?.previewSuccess && form?.rows && form?.headers) {
			editableHeaders = [...form.headers];
			editableRows = JSON.parse(JSON.stringify(form.rows));
		}
	});

	$effect(() => {
		if (form?.success && form?.importedTable) {
			refreshAll();
			editableRows = [];
			selectedFiles = [];

			const sequence = [
				'pelaku_usaha',
				'permohonan_audit',
				'penugasan',
				'detail_penugasan_petugas',
				'keuangan_audit'
			];
			const nextIdx = sequence.indexOf(form.importedTable) + 1;
			if (nextIdx < sequence.length) {
				selectedTable = sequence[nextIdx];
			}
		}
	});

	const opsiTabel = [
		{ value: 'pelaku_usaha', label: '1. Pelaku Usaha (pelaku_usaha)' },
		{ value: 'permohonan_audit', label: '2. Permohonan Audit (permohonan_audit)' },
		{ value: 'penugasan', label: '3. Penugasan Tim (penugasan)' },
		{ value: 'detail_penugasan_petugas', label: '4. Detail Petugas (detail_penugasan_petugas)' },
		{ value: 'keuangan_audit', label: '5. Keuangan Audit (keuangan_audit)' }
	];

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			selectedFiles = Array.from(input.files);
		}
	}

	function hapusBaris(rowIdx: number) {
		editableRows = editableRows.filter((_, i) => i !== rowIdx);
	}

	function tambahBaris() {
		const barisBaru: Record<string, string> = { _row_idx: String(editableRows.length + 2) };
		editableHeaders.forEach((h) => (barisBaru[h] = ''));
		editableRows = [...editableRows, barisBaru];
	}
</script>

<svelte:head>
	<title>Migrasi Data Bertahap - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">Migrasi Data Bertahap</h1>
			<p class="mt-1 text-sm text-slate-500">
				Unggah berkas CSV secara berurutan. Step 4 & Step 5 mendukung resolusi otomatis via No
				Registrasi (id_daftar).
			</p>
		</div>

		<a
			href={resolve(`/api/template-excel?table=${selectedTable}`)}
			download={`Template_Migrasi_${selectedTable.toUpperCase()}_LPH.csv`}
			class="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
		>
			<Download class="h-4 w-4" />
			<span>Unduh Template ({selectedTable})</span>
		</a>
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
	<div class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-8">
		<form
			method="POST"
			action="?/previewFile"
			enctype="multipart/form-data"
			onsubmit={() => (isPreviewing = true)}
			class="space-y-6"
		>
			<div class="space-y-1.5">
				<label for="target_table" class="block text-xs font-bold text-slate-700">
					Target Tabel Saat Ini *
				</label>
				<select
					id="target_table"
					name="target_table"
					bind:value={selectedTable}
					required
					class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-900 focus:border-[#059669] focus:bg-white focus:outline-none"
				>
					{#each opsiTabel as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-1.5">
				<label for="excel_file" class="block text-xs font-bold text-slate-700">
					Unggah Berkas CSV ({selectedTable}) *
				</label>
				<label
					for="excel_file"
					class="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 transition-all hover:border-[#059669] hover:bg-emerald-50/30"
				>
					<div class="flex flex-col items-center justify-center px-4 text-center">
						{#if selectedFiles.length > 0}
							<FileSpreadsheet class="mb-2 h-8 w-8 text-[#059669]" />
							<p class="text-xs font-bold text-[#0F172A]">{selectedFiles[0].name}</p>
							<p class="mt-0.5 text-[11px] text-slate-400">
								{(selectedFiles[0].size / 1024).toFixed(1)} KB - Siap Diproses
							</p>
						{:else}
							<Upload class="mb-2 h-8 w-8 text-[#059669]" />
							<p class="mb-1 text-xs font-semibold text-slate-600">
								Klik untuk memilih berkas CSV untuk {selectedTable}
							</p>
							<p class="text-[11px] text-slate-400">Format yang didukung: CSV (Maksimal 10MB)</p>
						{/if}
					</div>
					<input
						type="file"
						id="excel_file"
						name="excel_file"
						accept=".csv"
						onchange={handleFileSelect}
						class="hidden"
						required
					/>
				</label>
			</div>

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={selectedFiles.length === 0 || isPreviewing}
					class="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-8 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 disabled:opacity-40"
				>
					<Table class="h-4 w-4" />
					<span>{isPreviewing ? 'Membaca Berkas...' : `Muat Pratinjau ${selectedTable}`}</span>
				</button>
			</div>
		</form>
	</div>

	<!-- TABEL PREVIEW DATA -->
	{#if form?.previewSuccess && editableRows.length > 0}
		<div class="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-8">
			<div
				class="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center"
			>
				<div>
					<span class="text-[11px] font-bold tracking-wider text-[#059669] uppercase"
						>Pratinjau Impor Tabel</span
					>
					<h2 class="text-base font-bold text-slate-900">
						Tabel: <code class="rounded bg-slate-100 px-2 py-0.5 text-xs text-[#2563EB]"
							>{form.targetTable}</code
						>
						({editableRows.length} Baris Siap Diimpor)
					</h2>
					<p class="text-xs text-slate-400">
						Periksa dan sesuaikan data di bawah ini sebelum menyimpan ke database.
					</p>
				</div>

				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={tambahBaris}
						class="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
					>
						<Plus class="h-4 w-4" />
						<span>Tambah Baris</span>
					</button>

					<form method="POST" action="?/executeImport" onsubmit={() => (isImporting = true)}>
						<input type="hidden" name="target_table" value={form.targetTable} />
						<input type="hidden" name="payload_json" value={JSON.stringify(editableRows)} />
						<button
							type="submit"
							disabled={isImporting || editableRows.length === 0}
							class="inline-flex h-11 items-center gap-2 rounded-full bg-[#059669] px-8 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-40"
						>
							<Database class="h-4 w-4" />
							<span>{isImporting ? 'Menyimpan...' : `Simpan ${form.targetTable} & Lanjut`}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					</form>
				</div>
			</div>

			<!-- EDITABLE TABLE CONTENT -->
			<div class="overflow-x-auto rounded-2xl border border-slate-100">
				<table class="w-full border-collapse text-left">
					<thead>
						<tr
							class="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase"
						>
							<th class="px-4 py-3 text-center">#</th>
							{#each editableHeaders as header (header)}
								<th class="px-4 py-3">
									{#if header === 'id_petugas'}
										Nama Petugas (id_petugas)
									{:else if form.targetTable === 'detail_penugasan_petugas' && (header === 'id_daftar' || header === 'id_penugasan')}
										No. Registrasi / PU (id_daftar)
									{:else if form.targetTable === 'keuangan_audit' && (header === 'id_daftar' || header === 'id_permohonan')}
										Permohonan / No Registrasi (id_daftar)
									{:else if header === 'id_permohonan'}
										Permohonan / PU (id_permohonan)
									{:else}
										{header}
									{/if}
								</th>
							{/each}
							<th class="px-4 py-3 text-center">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-700">
						{#each editableRows as row, rIdx (row._row_idx ?? rIdx)}
							<tr class="hover:bg-slate-50/80">
								<td class="px-4 py-3 text-center font-mono text-slate-400">{rIdx + 1}</td>
								{#each editableHeaders as header (header)}
									<td class="px-2 py-2">
										{#if header === 'id_petugas'}
											<!-- Dropdown Nama Petugas -->
											<select
												bind:value={row[header]}
												class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#059669] focus:border-[#059669] focus:outline-none"
											>
												<option value="">-- Pilih Nama Petugas --</option>
												{#each daftarPetugas as pet (pet.id_petugas)}
													<option value={String(pet.id_petugas)}>
														{pet.nama_petugas} ({pet.peran})
													</option>
												{/each}
											</select>
										{:else if form.targetTable === 'detail_penugasan_petugas' && (header === 'id_daftar' || header === 'id_penugasan')}
											<!-- STEP 4: Dropdown No. Registrasi PU -->
											<select
												bind:value={row[header]}
												class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#2563EB] focus:border-[#059669] focus:outline-none"
											>
												<option value="">-- Pilih No. Registrasi --</option>
												{#each daftarPermohonan as perm (perm.id_permohonan)}
													<option value={perm.id_daftar}>
														{perm.id_daftar} - {perm.nama_pelaku_usaha}
													</option>
												{/each}
											</select>
										{:else if form.targetTable === 'keuangan_audit' && (header === 'id_daftar' || header === 'id_permohonan')}
											<!-- STEP 5: Dropdown Permohonan / No Registrasi -->
											<select
												bind:value={row[header]}
												class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#2563EB] focus:border-[#059669] focus:outline-none"
											>
												<option value="">-- Pilih Permohonan --</option>
												{#each daftarPermohonan as perm (perm.id_permohonan)}
													<option value={perm.id_daftar}>
														{perm.id_daftar} - {perm.nama_pelaku_usaha} (ID #{perm.id_permohonan})
													</option>
												{/each}
											</select>
										{:else if header === 'id_permohonan'}
											<!-- Dropdown Permohonan Standard (Step 3) -->
											<select
												bind:value={row[header]}
												class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#2563EB] focus:border-[#059669] focus:outline-none"
											>
												<option value="">-- Pilih Permohonan --</option>
												{#each daftarPermohonan as perm (perm.id_permohonan)}
													<option value={String(perm.id_permohonan)}>
														ID #{perm.id_permohonan} - {perm.nama_pelaku_usaha} ({perm.id_daftar})
													</option>
												{/each}
											</select>
										{:else}
											<input
												type="text"
												bind:value={row[header]}
												class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-[#059669] focus:outline-none"
											/>
										{/if}
									</td>
								{/each}
								<td class="px-4 py-3 text-center">
									<button
										type="button"
										onclick={() => hapusBaris(rIdx)}
										class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
										title="Hapus Baris Ini"
									>
										<Trash class="h-3.5 w-3.5" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
