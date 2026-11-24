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
		ArrowRight,
		X
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const daftarPetugas = $derived(data.referensi?.petugas ?? []);
	const daftarPermohonan = $derived(data.referensi?.permohonan ?? []);

	let selectedTable = $state('pelaku_usaha_penugasan');
	let selectedFiles = $state<File[]>([]);
	let isPreviewing = $state(false);
	let isImporting = $state(false);

	let editableHeaders = $state<string[]>([]);
	let editableRows = $state<Record<string, string>[]>([]);

	$effect(() => {
		if (form?.previewSuccess && form?.rows && form?.headers) {
			isPreviewing = false;
			editableHeaders = [...form.headers];
			editableRows = JSON.parse(JSON.stringify(form.rows));
		}
		if (form?.error) {
			isPreviewing = false;
			isImporting = false;
		}
	});

	$effect(() => {
		if (form?.success && form?.importedTable) {
			isImporting = false;
			refreshAll();
			editableRows = [];
			selectedFiles = [];

			// Otomatis pindah dari CSV 1 ke CSV 2 setelah berhasil disimpan
			if (form.importedTable === 'pelaku_usaha_penugasan') {
				selectedTable = 'keuangan_audit';
			}
		}
	});

	const opsiTabel = [
		{
			value: 'pelaku_usaha_penugasan',
			label: '1. Pelaku Usaha, Permohonan & Tim Penugasan (CSV 1)'
		},
		{
			value: 'keuangan_audit',
			label: '2. Keuangan Audit & Rincian Biaya (CSV 2)'
		}
	];

	const opsiStatusPenugasan = [
		{ value: 'PENDING', label: 'PENDING (Menunggu)' },
		{ value: 'ASSIGNED', label: 'ASSIGNED (Ditugaskan)' },
		{ value: 'REASSIGNED', label: 'REASSIGNED (Penugasan Ulang)' }
	];

	const opsiStatusKeuangan = [
		{ value: 'DRAFT', label: 'DRAFT (Konsep)' },
		{ value: 'SIAP_VERIFIKASI', label: 'SIAP_VERIFIKASI' },
		{ value: 'DITERIMA', label: 'DITERIMA (Lunas)' },
		{ value: 'REVISI', label: 'REVISI (Perlu Perbaikan)' }
	];

	const opsiJenisTransaksi = [
		{ value: 'TRANSPORT_TALANGAN', label: 'Transport Talangan' },
		{ value: 'UH_PENGINAPAN', label: 'UH & Penginapan' },
		{ value: 'BIAYA_LPH', label: 'Biaya LPH' },
		{ value: 'INPUT_SISTEM', label: 'Input Sistem' },
		{ value: 'TENTATIVE_LAPANGAN', label: 'Tentative Lapangan' },
		{ value: 'TAGIHAN_FINAL', label: 'Tagihan Final' },
		{ value: 'BIAYA_LAIN', label: 'Biaya Lain' }
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
		const today = new Date().toISOString().split('T')[0];
		editableHeaders.forEach((h) => {
			if (h === 'status_penugasan') barisBaru[h] = 'ASSIGNED';
			else if (h === 'status_keuangan') barisBaru[h] = 'SIAP_VERIFIKASI';
			else if (h === 'jenis_transaksi') barisBaru[h] = 'BIAYA_LPH';
			else if (h === 'tanggal_permohonan' || h === 'tanggal_penugasan') barisBaru[h] = today;
			else barisBaru[h] = '';
		});
		editableRows = [...editableRows, barisBaru];
	}

	// Helper Multi-Petugas (disimpan sebagai string dipisah ';', misal "1;2;4")
	function getPetugasArray(rawVal: string | undefined): string[] {
		if (!rawVal) return [''];
		const list = rawVal.split(';');
		return list.length > 0 ? list : [''];
	}

	function updatePetugasAt(rowIdx: number, header: string, petIdx: number, newVal: string) {
		const list = getPetugasArray(editableRows[rowIdx][header]);
		list[petIdx] = newVal;
		editableRows[rowIdx][header] = list.join(';');
	}

	function tambahPetugasKeBaris(rowIdx: number, header: string) {
		const list = getPetugasArray(editableRows[rowIdx][header]);
		list.push('');
		editableRows[rowIdx][header] = list.join(';');
	}

	function hapusPetugasDariBaris(rowIdx: number, header: string, petIdx: number) {
		const list = getPetugasArray(editableRows[rowIdx][header]);
		if (list.length > 1) {
			list.splice(petIdx, 1);
			editableRows[rowIdx][header] = list.join(';');
		} else {
			editableRows[rowIdx][header] = '';
		}
	}
</script>

<svelte:head>
	<title>Migrasi Data Bertahap - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">Migrasi Data (2 Berkas CSV)</h1>
			<p class="mt-1 text-sm text-slate-500">
				Impor cukup dalam 2 langkah: (1) Pelaku Usaha & Tim Penugasan, lalu (2) Rincian Biaya Audit
				menggunakan <code class="font-semibold">id_daftar</code>.
			</p>
		</div>

		<a
			href={resolve(`/api/template-excel?table=${selectedTable}`)}
			download={`Template_Migrasi_${selectedTable.toUpperCase()}_LPH.csv`}
			class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
		>
			<Download class="h-4 w-4" />
			<span
				>Unduh Template ({selectedTable === 'pelaku_usaha_penugasan'
					? 'CSV 1: PU & Tim'
					: 'CSV 2: Rincian Biaya'})</span
			>
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
					Pilih Berkas Migrasi *
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
					Unggah Berkas CSV *
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
								Klik untuk memilih berkas CSV ({selectedTable === 'pelaku_usaha_penugasan'
									? 'Pelaku Usaha & Penugasan'
									: 'Keuangan & Rincian Biaya'})
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
					<span>{isPreviewing ? 'Membaca Berkas...' : 'Muat Pratinjau Data'}</span>
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
						>Pratinjau Impor Data</span
					>
					<h2 class="text-base font-bold text-slate-900">
						Berkas: <code class="rounded bg-slate-100 px-2 py-0.5 text-xs text-[#2563EB]"
							>{form.fileName}</code
						>
						({editableRows.length} Baris Siap Diimpor)
					</h2>
					<p class="text-xs text-slate-400">
						{#if form.targetTable === 'pelaku_usaha_penugasan'}
							Atur daftar petugas (Auditor & Dewan Syariah) per pelaku usaha sebelum menyimpan.
						{:else}
							Baris dengan <code>no_invoice</code> yang sama otomatis digabung menjadi satu tagihan.
						{/if}
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
							<span>
								{isImporting
									? 'Menyimpan...'
									: form.targetTable === 'pelaku_usaha_penugasan'
										? 'Simpan & Lanjut ke Rincian Biaya'
										: 'Simpan Rincian Biaya'}
							</span>
							{#if form.targetTable === 'pelaku_usaha_penugasan'}
								<ArrowRight class="h-4 w-4" />
							{/if}
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
								<th class="px-4 py-3 whitespace-nowrap">
									{#if header === 'id_petugas' || header === 'tim_petugas'}
										Tim Petugas (Auditor & Dewan Syariah)
									{:else if form.targetTable === 'keuangan_audit' && (header === 'id_daftar' || header === 'id_permohonan')}
										No. Registrasi / Pelaku Usaha
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
							<tr class="align-top hover:bg-slate-50/80">
								<td class="px-4 py-3 text-center font-mono text-slate-400">{rIdx + 1}</td>
								{#each editableHeaders as header (header)}
									<td class="px-2 py-2">
										{#if header === 'id_petugas' || header === 'tim_petugas'}
											<!-- Multi-Select Petugas dalam satu baris -->
											{@const petugasIds = getPetugasArray(row[header])}
											<div class="min-w-58.75 space-y-1.5">
												{#each petugasIds as petId, pIdx (pIdx)}
													<div class="flex items-center gap-1">
														<select
															value={petId}
															onchange={(e) =>
																updatePetugasAt(
																	rIdx,
																	header,
																	pIdx,
																	(e.currentTarget as HTMLSelectElement).value
																)}
															class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#059669] focus:border-[#059669] focus:outline-none"
														>
															<option value="">-- Pilih Petugas #{pIdx + 1} --</option>
															{#each daftarPetugas as pet (pet.id_petugas)}
																{@const strPetId = String(pet.id_petugas)}
																{#if !petugasIds.includes(strPetId) || petId === strPetId}
																	<option value={strPetId}>
																		{pet.nama_petugas} ({pet.peran})
																	</option>
																{/if}
															{/each}
														</select>

														{#if petugasIds.length > 1}
															<button
																type="button"
																onclick={() => hapusPetugasDariBaris(rIdx, header, pIdx)}
																class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
																title="Hapus Petugas Ini"
															>
																<X class="h-3 w-3" />
															</button>
														{/if}
													</div>
												{/each}

												<button
													type="button"
													onclick={() => tambahPetugasKeBaris(rIdx, header)}
													class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-[#059669] hover:bg-emerald-100"
												>
													<Plus class="h-3 w-3" />
													<span>Tambah Petugas</span>
												</button>
											</div>
										{:else if form.targetTable === 'keuangan_audit' && (header === 'id_daftar' || header === 'id_permohonan')}
											<select
												bind:value={row[header]}
												class="min-w-52.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#2563EB] focus:border-[#059669] focus:outline-none"
											>
												<option value="">-- Pilih No. Registrasi --</option>
												{#each daftarPermohonan as perm (perm.id_permohonan)}
													<option value={perm.id_daftar}>
														{perm.id_daftar} - {perm.nama_pelaku_usaha}
													</option>
												{/each}
											</select>
										{:else if header === 'status_penugasan'}
											<select
												bind:value={row[header]}
												class="min-w-40 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 focus:border-[#059669] focus:outline-none"
											>
												{#each opsiStatusPenugasan as opt (opt.value)}
													<option value={opt.value}>{opt.label}</option>
												{/each}
											</select>
										{:else if header === 'status_keuangan'}
											<select
												bind:value={row[header]}
												class="min-w-40 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 focus:border-[#059669] focus:outline-none"
											>
												{#each opsiStatusKeuangan as opt (opt.value)}
													<option value={opt.value}>{opt.label}</option>
												{/each}
											</select>
										{:else if header === 'jenis_transaksi'}
											<select
												bind:value={row[header]}
												class="min-w-42.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-[#059669] focus:outline-none"
											>
												{#each opsiJenisTransaksi as opt (opt.value)}
													<option value={opt.value}>{opt.label}</option>
												{/each}
											</select>
										{:else if header === 'tanggal_permohonan' || header === 'tanggal_penugasan'}
											<input
												type="date"
												bind:value={row[header]}
												class="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-[#059669] focus:outline-none"
											/>
										{:else}
											<input
												type="text"
												bind:value={row[header]}
												class="min-w-32.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-[#059669] focus:outline-none"
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
