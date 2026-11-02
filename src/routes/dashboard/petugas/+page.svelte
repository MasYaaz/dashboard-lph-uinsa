<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	import { UserPlus, Search, CircleCheck, TriangleAlert, X, Pen, Trash } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const petugasList = $derived(data.petugasList);

	// State Filter & Search
	let searchQuery = $state('');
	let roleFilter = $state('ALL');
	let statusFilter = $state('ALL');

	// State Modal Hapus
	let selectedDeletePetugas = $state<{ id: number; nama: string } | null>(null);

	// Filtering Data
	const filteredPetugas = $derived(
		petugasList.filter((item) => {
			const matchSearch =
				item.nama_petugas.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(item.kontak && item.kontak.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchRole = roleFilter === 'ALL' || item.peran === roleFilter;
			const matchStatus =
				statusFilter === 'ALL' ? true : statusFilter === 'AKTIF' ? item.is_active : !item.is_active;

			return matchSearch && matchRole && matchStatus;
		})
	);

	const totalAuditor = $derived(
		petugasList.filter((p) => p.peran === 'AUDITOR' && p.is_active).length
	);
	const totalSyariah = $derived(
		petugasList.filter((p) => p.peran === 'DEWAN_SYARIAH' && p.is_active).length
	);

	function getInitials(name: string): string {
		if (!name) return '??';
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function resetFilter() {
		searchQuery = '';
		roleFilter = 'ALL';
		statusFilter = 'ALL';
	}
</script>

<svelte:head>
	<title>Master Petugas Field - SIM LPH</title>
</svelte:head>

<div class="space-y-6">
	<!-- TOP PAGE HEADER & NAVIGATION -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Master Petugas Field</h1>
			<p class="mt-1 text-xs text-slate-500">
				Kelola personil Auditor Halal dan Dewan Syariah LPH dalam satu tempat.
			</p>
		</div>

		<a
			href={resolve(`/dashboard/petugas/tambah`)}
			class="inline-flex h-10 items-center gap-2 rounded-full bg-[#059669] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#047857]"
		>
			<UserPlus class="h-4 w-4" />
			<span>Tambah Petugas Baru</span>
		</a>
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

	<!-- TERGABUNG: FILTER CARD & DAFTAR PETUGAS TABLE -->
	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
		<!-- SECTION FILTER ATAS -->
		<div class="space-y-4 border-b border-slate-100 bg-slate-50/30 p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold text-slate-900">Pencarian & Filter Data</h2>
				<div class="flex items-center gap-2 text-xs font-medium text-slate-400">
					<span><strong class="text-[#059669]">{totalAuditor}</strong> Auditor</span>
					<span>•</span>
					<span><strong class="text-purple-700">{totalSyariah}</strong> Dewan Syariah</span>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-12">
				<div class="relative flex items-center md:col-span-6">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari nama petugas atau nomor kontak..."
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-xs placeholder:text-slate-400 focus:border-[#059669] focus:outline-none"
					/>
					<Search class="absolute right-3 h-4 w-4 text-slate-400" />
				</div>

				<div class="md:col-span-2.5">
					<select
						bind:value={roleFilter}
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					>
						<option value="ALL">Semua Peran</option>
						<option value="AUDITOR">Auditor</option>
						<option value="DEWAN_SYARIAH">Dewan Syariah</option>
					</select>
				</div>

				<div class="md:col-span-2.5">
					<select
						bind:value={statusFilter}
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#059669] focus:outline-none"
					>
						<option value="ALL">Semua Status</option>
						<option value="AKTIF">Aktif</option>
						<option value="NONAKTIF">Nonaktif</option>
					</select>
				</div>

				<div class="md:col-span-1">
					<button
						type="button"
						onclick={resetFilter}
						class="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
					>
						Reset
					</button>
				</div>
			</div>
		</div>

		<!-- SECTION TABEL PETUGAS -->
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-400"
					>
						<th class="px-6 py-3.5">ID & Nama Petugas</th>
						<th class="px-6 py-3.5">Peran Field</th>
						<th class="px-6 py-3.5">Kontak WhatsApp</th>
						<th class="px-6 py-3.5">Status</th>
						<th class="px-6 py-3.5 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-medium text-slate-700">
					{#each filteredPetugas as item (item.id_petugas)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold {item.peran ===
										'DEWAN_SYARIAH'
											? 'bg-purple-100 text-purple-700'
											: 'bg-emerald-100 text-[#059669]'}"
									>
										{getInitials(item.nama_petugas)}
									</div>
									<div>
										<p class="font-bold text-slate-900">{item.nama_petugas}</p>
										<p class="text-[11px] font-semibold text-slate-400">#{item.id_petugas}</p>
									</div>
								</div>
							</td>

							<td class="px-6 py-4">
								{#if item.peran === 'DEWAN_SYARIAH'}
									<span
										class="inline-flex items-center rounded-full border border-purple-200/60 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700"
									>
										Dewan Syariah
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#059669]"
									>
										Auditor
									</span>
								{/if}
							</td>

							<td class="px-6 py-4 text-slate-600">
								{item.kontak}
							</td>

							<td class="px-6 py-4">
								{#if item.is_active}
									<span
										class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#059669]"
									>
										• Aktif
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-400"
									>
										• Nonaktif
									</span>
								{/if}
							</td>

							<td class="space-x-1.5 px-6 py-4 text-right">
								<!-- Tombol Edit -->
								<a
									href={resolve(`/dashboard/petugas/${item.id_petugas}/edit`)}
									class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
								>
									<Pen class="h-3 w-3" />
									<span>Edit</span>
								</a>

								<!-- Tombol Toggle Active -->
								<form method="POST" action="?/toggleActive" class="inline">
									<input type="hidden" name="id_petugas" value={item.id_petugas} />
									<input type="hidden" name="current_status" value={item.is_active} />
									<button
										type="submit"
										class="rounded-full px-3 py-1 text-xs font-semibold transition-all {item.is_active
											? 'text-amber-600 hover:bg-amber-50'
											: 'text-[#059669] hover:bg-emerald-50'}"
									>
										{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
									</button>
								</form>

								<!-- Tombol Pemicu Modal Hapus -->
								<button
									type="button"
									onclick={() =>
										(selectedDeletePetugas = { id: item.id_petugas, nama: item.nama_petugas })}
									class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
								>
									<Trash class="h-3 w-3" />
									<span>Hapus</span>
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="py-12 text-center text-xs text-slate-400">
								Data petugas tidak ditemukan.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- MODAL DIALOG KONFIRMASI HAPUS -->
{#if selectedDeletePetugas}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="text-sm font-bold text-slate-900">Hapus Data Petugas?</h3>
				<button
					type="button"
					onclick={() => (selectedDeletePetugas = null)}
					class="rounded-full p-1 text-slate-400 hover:bg-slate-100"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<p class="text-xs leading-relaxed text-slate-600">
				Apakah Anda yakin ingin menghapus petugas <strong class="text-slate-900"
					>{selectedDeletePetugas.nama}</strong
				>
				(#{selectedDeletePetugas.id})? Tindakan ini tidak dapat dibatalkan.
			</p>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					onclick={() => (selectedDeletePetugas = null)}
					class="h-9 rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
				>
					Batal
				</button>
				<form method="POST" action="?/hapus">
					<input type="hidden" name="id_petugas" value={selectedDeletePetugas.id} />
					<button
						type="submit"
						class="h-9 rounded-full bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
					>
						Ya, Hapus
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
