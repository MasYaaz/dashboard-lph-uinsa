<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const rekapList = $derived(data.rekapList);

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Rekap Data Operasional - SIM Internal LPH</title>
</svelte:head>

<div class="space-y-8">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">Rekapitulasi Operasional Audit</h1>
		<p class="mt-1 text-sm text-slate-500">
			Laporan terpadu dari pelaku usaha, tim penugasan, hingga realisasi biaya audit.
		</p>
	</div>

	<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
		<div class="flex items-center justify-between border-b border-slate-100 p-6">
			<div>
				<h2 class="text-base font-bold text-[#0F172A]">
					Laporan Konsolidasi Permohonan Audit ({rekapList.length})
				</h2>
				<p class="text-xs text-slate-500">Ringkasan status permohonan secara real-time</p>
			</div>
			<button
				type="button"
				onclick={() => window.print()}
				class="h-9 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-[#059669] transition-all hover:bg-emerald-100"
			>
				🖨️ Cetak Laporan
			</button>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr
						class="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-500"
					>
						<th class="px-6 py-3.5">ID Daftar / PU</th>
						<th class="px-6 py-3.5">Scope Audit</th>
						<th class="px-6 py-3.5">Tim Field Assigned</th>
						<th class="px-6 py-3.5">Status Plotting</th>
						<th class="px-6 py-3.5">Status Keuangan</th>
						<th class="px-6 py-3.5 text-right">Total Biaya Final</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-[12px] font-normal text-[#0F172A]">
					{#each rekapList as item (item.id_daftar)}
						<tr class="transition-colors hover:bg-slate-50/80">
							<td class="px-6 py-3.5">
								<span class="block font-bold text-[#059669]">{item.id_daftar}</span>
								<span class="font-medium text-[#0F172A]">{item.nama_pu}</span>
							</td>
							<td class="px-6 py-3.5 text-slate-500">
								{item.jumlah_produk} Produk / {item.jumlah_outlet} Outlet
							</td>
							<td class="max-w-xs truncate px-6 py-3.5 text-slate-700">{item.tim_petugas}</td>
							<td class="px-6 py-3.5">
								<span
									class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.status_penugasan ===
									'ASSIGNED'
										? 'border-emerald-200 bg-emerald-50 text-[#108981]'
										: 'border-amber-200 bg-amber-50 text-amber-700'}"
								>
									{item.status_penugasan}
								</span>
							</td>
							<td class="px-6 py-3.5">
								<span
									class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.status_keuangan ===
									'DITERIMA'
										? 'border-emerald-200 bg-emerald-50 text-[#108981]'
										: 'border-slate-200 bg-slate-100 text-slate-600'}"
								>
									{item.status_keuangan}
								</span>
							</td>
							<td class="px-6 py-3.5 text-right font-bold text-[#0F172A]">
								{formatRupiah(item.total_biaya)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="py-12 text-center text-xs text-slate-400"
								>Belum ada data rekapitulasi audit.</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
