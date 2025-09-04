<script lang="ts">
	import IconAccountGroup from '~icons/mdi/account-group';
	import IconAccount from '~icons/mdi/account';
	import IconEmail from '~icons/mdi/email';
	import IconChevronLeft from '~icons/mdi/chevron-left';
	import IconChevronRight from '~icons/mdi/chevron-right';
	import IconSearch from '~icons/mdi/magnify';
	import IconPlus from '~icons/mdi/plus';
	import IconEye from '~icons/mdi/eye';
	import IconChevronDown from '~icons/mdi/chevron-down';
	import PageHero from '$lib/components/PageHero.svelte';
	import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state using runes
	let searchTerm = $state(data.filters.searchTerm);
	let membershipFilter = $state(data.filters.membershipFilter);

	// Helper function to format time ago
	function formatTimeAgo(dateString: string | null): string {
		if (!dateString) return 'Never';

		try {
			const date = parseISO(dateString);
			if (!isValid(date)) return 'Unknown';
			return formatDistanceToNow(date, { addSuffix: true });
		} catch {
			return 'Unknown';
		}
	}

	// Helper function to get membership badge class
	function getMembershipBadgeClass(membership: string): string {
		switch (membership) {
			case 'controller':
				return 'bg-green-900 text-green-200';
			case 'community':
				return 'bg-blue-900 text-blue-200';
			case 'basic':
				return 'bg-gray-700 text-gray-300';
			default:
				return 'bg-gray-700 text-gray-300';
		}
	}

	// Helper function to get certification badge class
	function getCertificationBadgeClass(status: string): string {
		switch (status) {
			case 'certified':
				return 'bg-emerald-600/90 text-white';
			case 'in_progress':
				return 'bg-amber-600/90 text-white';
			case 'expired':
				return 'bg-red-600/90 text-white';
			default:
				return 'bg-gray-600/90 text-gray-300';
		}
	}

	// Handle search and filters
	function handleSearch() {
		const url = new URL($page.url);
		if (searchTerm) {
			url.searchParams.set('search', searchTerm);
		} else {
			url.searchParams.delete('search');
		}
		if (membershipFilter !== 'all') {
			url.searchParams.set('membership', membershipFilter);
		} else {
			url.searchParams.delete('membership');
		}
		url.searchParams.delete('page'); // Reset to first page
		goto(url.toString());
	}

	// Handle pagination
	function goToPage(pageNum: number) {
		const url = new URL($page.url);
		if (pageNum > 1) {
			url.searchParams.set('page', pageNum.toString());
		} else {
			url.searchParams.delete('page');
		}
		goto(url.toString());
	}

	function viewUser(userId: string) {
		goto(`/admin/users/${userId}`);
	}
</script>

<svelte:head>
	<title>User Management | Indy Center Admin</title>
</svelte:head>

<div class="px-6 py-6 pr-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-white">User Management</h1>
		<p class="mt-1 text-gray-400">Manage user accounts, memberships, and access permissions</p>
	</div>
	<!-- Search and Filter Controls -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex max-w-md flex-1">
			<label for="search-input" class="sr-only">Search users by name, CID, or email</label>
			<input
				id="search-input"
				type="text"
				bind:value={searchTerm}
				oninput={handleSearch}
				placeholder="Search by name, CID, or email..."
				class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
			/>
		</div>
		<div class="flex gap-3">
			<div class="relative">
				<label for="membership-filter" class="sr-only">Filter by membership</label>
				<select
					id="membership-filter"
					bind:value={membershipFilter}
					onchange={handleSearch}
					class="w-full cursor-pointer appearance-none rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 pr-10 text-white hover:bg-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
					style="background-image: none;"
				>
					<option value="all">All Memberships</option>
					<option value="controller">Controller</option>
					<option value="community">Community</option>
					<option value="basic">Basic</option>
				</select>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
				>
					<IconChevronDown class="h-4 w-4" aria-hidden="true" />
				</div>
			</div>
		</div>
	</div>

	<!-- Results info -->
	<div class="mb-4 flex items-center justify-between">
		<div class="text-sm text-gray-400">
			Showing {data.users.length} of {data.pagination.totalCount} users
			{#if data.filters.searchTerm}
				matching "{data.filters.searchTerm}"
			{/if}
		</div>
		<div class="text-sm text-gray-400">
			Page {data.pagination.currentPage} of {data.pagination.totalPages}
		</div>
	</div>

	<!-- Users Table -->
	<div class="overflow-x-auto rounded-lg bg-slate-800/80 shadow-xl backdrop-blur-sm">
		<table class="w-full text-white">
			<thead class="bg-slate-700">
				<tr>
					<th
						class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						User
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						Contact
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						Membership
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						VATSIM Info
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						Certificates
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						Last Activity
					</th>
					<th
						class="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-300 uppercase"
					>
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-600">
				{#each data.users as user}
					<tr class="border-b border-slate-600/50 transition-colors hover:bg-slate-700/30">
						<td class="px-4 py-3">
							<div class="flex items-center space-x-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600">
									<span class="text-sm font-medium text-white">
										{user.firstName.charAt(0)}{user.lastName.charAt(0)}
									</span>
								</div>
								<div>
									<div class="text-sm font-medium text-white">
										{user.preferredName || user.firstName}
										{user.lastName}
									</div>
									<div class="text-xs text-gray-400">
										CID: {user.cid}
									</div>
									{#if user.pronouns}
										<div class="text-xs text-gray-500">
											{user.pronouns}
										</div>
									{/if}
								</div>
							</div>
						</td>
						<td class="px-4 py-3">
							<div class="text-sm text-gray-300">
								<div class="flex items-center space-x-1">
									<IconEmail class="h-3 w-3" />
									<span>{user.email}</span>
								</div>
							</div>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center space-x-2">
								<span
									class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getMembershipBadgeClass(
										user.membership
									)}"
								>
									{user.membership}
								</span>
								{#if user.isAdmin}
									<span
										class="inline-flex items-center rounded-full bg-purple-900 px-2 py-1 text-xs font-medium text-purple-200"
									>
										Admin
									</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3">
							<div class="text-sm">
								{#if user.rating}
									<div class="flex items-center space-x-2">
										<span
											class="inline-flex rounded-full bg-sky-600/90 px-2 py-1 text-xs font-semibold text-white"
										>
											{user.rating}
										</span>
										<span class="text-xs text-gray-400">{user.facility}</span>
									</div>
								{:else}
									<span class="text-xs text-gray-500">Not on roster</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3">
							<div class="flex flex-wrap gap-1 max-w-32">
								{#if user.certifications && user.certifications.length > 0}
									{#each user.certifications.slice(0, 3) as cert}
										<span class="inline-flex rounded px-1.5 py-0.5 text-xs font-medium {getCertificationBadgeClass(cert.status)}">
											{cert.certification}
										</span>
									{/each}
									{#if user.certifications.length > 3}
										<span class="text-xs text-gray-400">+{user.certifications.length - 3}</span>
									{/if}
								{:else}
									<span class="text-xs text-gray-500">None</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-400">
							{formatTimeAgo(user.lastActivity)}
						</td>
						<td class="px-4 py-3 text-center">
							<button
								onclick={() => viewUser(user.id)}
								class="inline-flex items-center space-x-1 rounded bg-sky-600/20 px-3 py-1 text-xs text-sky-400 transition-colors hover:bg-sky-600/30"
							>
								<IconEye class="h-3 w-3" />
								<span>View</span>
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="px-4 py-8 text-center text-gray-400">
							No users found matching your criteria.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="mt-6 flex items-center justify-between">
			<div class="text-sm text-gray-400">
				Showing {(data.pagination.currentPage - 1) * 25 + 1} to {Math.min(
					data.pagination.currentPage * 25,
					data.pagination.totalCount
				)} of {data.pagination.totalCount} results
			</div>
			<div class="flex space-x-2">
				<button
					onclick={() => goToPage(data.pagination.currentPage - 1)}
					disabled={!data.pagination.hasPrevPage}
					class="inline-flex items-center rounded-md bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<IconChevronLeft class="mr-1 h-4 w-4" />
					Previous
				</button>

				<!-- Page numbers -->
				{#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
					const startPage = Math.max(1, data.pagination.currentPage - 2);
					return startPage + i;
				}) as pageNum}
					{#if pageNum <= data.pagination.totalPages}
						<button
							onclick={() => goToPage(pageNum)}
							class="rounded-md px-3 py-2 text-sm transition-colors
										{pageNum === data.pagination.currentPage
								? 'bg-sky-600 text-white'
								: 'bg-slate-700 text-gray-300 hover:bg-slate-600'}"
						>
							{pageNum}
						</button>
					{/if}
				{/each}

				<button
					onclick={() => goToPage(data.pagination.currentPage + 1)}
					disabled={!data.pagination.hasNextPage}
					class="inline-flex items-center rounded-md bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Next
					<IconChevronRight class="ml-1 h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}
</div>
