<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const logs = $derived(data.logs);

	let selectedSnapshot = $state<string | null>(null);
</script>

<svelte:head>
	<title>Log Arsip Historis - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">
			Log Arsip Historis & Audit Trail
		</h1>
		<p class="mt-1 text-sm text-slate-500">
			Rekap riwayat aktivitas dan perubah data sistem (JSON Snapshot).
		</p>
	</div>

	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
		<div class="border-b border-slate-100 p-6">
			<h2 class="text-base font-bold text-[#0F172A]">Riwayat Log Aktivitas Database</h2>
			<p class="text-xs text-[#059669]">Menampilkan 100 aktivitas perubahan data terbaru</p>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-500"
					>
						<th class="px-6 py-3.5">ID Arsip</th>
						<th class="px-6 py-3.5">Waktu Kejadian</th>
						<th class="px-6 py-3.5">Pengguna</th>
						<th class="px-6 py-3.5">Tabel Target</th>
						<th class="px-6 py-3.5">Aksi</th>
						<th class="px-6 py-3.5 text-right">Detail Snapshot</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-normal text-[#0F172A]">
					{#each logs as log (log.id_arsip)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-3.5 font-semibold text-slate-600">#{log.id_arsip}</td>
							<td class="px-6 py-3.5 text-slate-500">{log.timestamp}</td>
							<td class="px-6 py-3.5 font-medium">{log.nama_user}</td>
							<td class="px-6 py-3.5"
								><code class="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-[#0F172A]"
									>{log.nama_tabel}</code
								></td
							>
							<td class="px-6 py-3.5">
								{#if log.aksi === 'INSERT'}
									<span
										class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#108981]"
										>INSERT</span
									>
								{:else if log.aksi === 'UPDATE'}
									<span
										class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
										>UPDATE</span
									>
								{:else}
									<span
										class="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600"
										>DELETE</span
									>
								{/if}
							</td>
							<td class="px-6 py-3.5 text-right">
								<button
									type="button"
									onclick={() => (selectedSnapshot = log.snapshot_data)}
									class="h-8 rounded-full border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50"
								>
									Lihat JSON
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="py-12 text-center text-xs text-slate-400"
								>Belum ada aktivitas log historis.</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Snapshot JSON -->
	{#if selectedSnapshot}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
		>
			<div class="w-full max-w-xl space-y-4 rounded-3xl bg-white p-6 shadow-xl">
				<div class="flex items-center justify-between border-b border-slate-100 pb-3">
					<h3 class="text-base font-bold text-[#0F172A]">Snapshot Data JSON</h3>
					<button
						type="button"
						onclick={() => (selectedSnapshot = null)}
						class="text-slate-400 hover:text-slate-600">✕</button
					>
				</div>
				<pre
					class="max-h-96 overflow-auto rounded-2xl bg-slate-900 p-4 font-mono text-xs text-emerald-400">{selectedSnapshot}</pre>
				<div class="flex justify-end pt-2">
					<button
						type="button"
						onclick={() => (selectedSnapshot = null)}
						class="h-10 rounded-full border border-slate-200 px-6 text-xs font-bold text-slate-600 hover:bg-slate-50"
						>Tutup</button
					>
				</div>
			</div>
		</div>
	{/if}
</div>
