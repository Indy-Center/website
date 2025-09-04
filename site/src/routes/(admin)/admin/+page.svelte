<script lang="ts">
	import IconAccountGroup from '~icons/mdi/account-group';
	import IconCertificate from '~icons/mdi/certificate';
	import IconDatabase from '~icons/mdi/database';
	import IconCog from '~icons/mdi/cog';
	import IconAccount from '~icons/mdi/account';
	import IconShield from '~icons/mdi/shield';
	import IconChevronRight from '~icons/mdi/chevron-right';
	import IconAlertCircle from '~icons/mdi/alert-circle';
	import IconSync from '~icons/mdi/sync';
	import IconAccountMultiple from '~icons/mdi/account-multiple';
	import IconFileDocument from '~icons/mdi/file-document';
	import IconAccountSwitch from '~icons/mdi/account-switch';
	import IconLoading from '~icons/mdi/loading';
	import IconAccountAlert from '~icons/mdi/account-alert';
	import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Trigger state management
	let triggerStates = $state({
		roster: { loading: false, lastRun: null, error: null, result: null, justCompleted: false },
		certificates: {
			loading: false,
			lastRun: null,
			error: null,
			result: null,
			justCompleted: false
		},
		memberships: { loading: false, lastRun: null, error: null, result: null, justCompleted: false }
	});

	async function triggerProcess(type: 'roster' | 'certificates' | 'memberships') {
		const state = triggerStates[type];
		state.loading = true;
		state.error = null;

		const endpoints = {
			roster: '/triggers/process-roster',
			certificates: '/triggers/process-certificates',
			memberships: '/triggers/sync-memberships'
		};

		try {
			const method = 'GET';
			const response = await fetch(endpoints[type], {
				method,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || `Failed to trigger ${type} process`);
			}

			state.lastRun = new Date().toISOString();
			state.result = result;
			state.justCompleted = true;

			console.log(`${type} process completed:`, result);

			// Clear the success state after 5 seconds
			setTimeout(() => {
				state.justCompleted = false;
			}, 5000);

			// Refresh the page data to show updated stats
			setTimeout(() => window.location.reload(), 2000);
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error(`Error triggering ${type} process:`, error);
		} finally {
			state.loading = false;
		}
	}

	// Helper function to format date using date-fns
	function formatTimeAgo(dateString: string | Date | number | null): string {
		if (!dateString) return 'Unknown';

		try {
			let date: Date;

			if (typeof dateString === 'string') {
				date = parseISO(dateString);
			} else if (typeof dateString === 'number') {
				date = new Date(dateString);
			} else if (dateString instanceof Date) {
				date = dateString;
			} else {
				return 'Invalid date';
			}

			if (!isValid(date)) {
				return 'Invalid date';
			}

			return formatDistanceToNow(date, { addSuffix: true });
		} catch (error) {
			console.error('Error formatting date:', error, 'Input:', dateString);
			return 'Unknown';
		}
	}
</script>

<div class="px-6 py-6 pr-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-white">Dashboard</h1>
		<p class="mt-1 text-gray-400">Overview of system statistics and recent activity</p>
	</div>

	<!-- Admin Triggers -->
	<div class="mb-8 rounded-lg border border-slate-700/50 bg-slate-800/40 p-6">
		<h2 class="mb-4 flex items-center text-lg font-semibold text-white">
			<IconSync class="mr-2 h-5 w-5 text-sky-400" />
			System Processes
		</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<!-- Roster Sync -->
			<div class="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
				<div class="mb-3 flex items-start justify-between">
					<div>
						<h3 class="flex items-center text-sm font-medium text-white">
							<IconAccountMultiple class="mr-2 h-4 w-4 text-blue-400" />
							Process Roster
						</h3>
						<p class="mt-1 text-xs text-gray-400">Sync controller roster from VATUSA</p>
					</div>
				</div>
				{#if triggerStates.roster.error}
					<div class="mb-3 text-xs text-red-400">
						Error: {triggerStates.roster.error}
					</div>
				{/if}
				<button
					onclick={() => triggerProcess('roster')}
					disabled={triggerStates.roster.loading}
					class="inline-flex w-full items-center justify-center space-x-2 rounded px-3 py-2 text-sm transition-all duration-300
						{triggerStates.roster.justCompleted
						? 'border border-green-600/30 bg-green-600/20 text-green-400'
						: 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'} 
						disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if triggerStates.roster.loading}
						<IconLoading class="h-4 w-4 animate-spin" />
						<span>Processing...</span>
					{:else if triggerStates.roster.justCompleted}
						<IconCog class="h-4 w-4 text-green-400" />
						<span>Completed!</span>
					{:else}
						<IconSync class="h-4 w-4" />
						<span>Run Process</span>
					{/if}
				</button>
				{#if triggerStates.roster.justCompleted && triggerStates.roster.result}
					<div class="animate-in slide-in-from-top mt-2 text-xs text-green-300 duration-300">
						✓ Updated {triggerStates.roster.result.roster_members_updated || 0} roster members
					</div>
				{/if}
			</div>

			<!-- Certificates Sync -->
			<div class="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
				<div class="mb-3 flex items-start justify-between">
					<div>
						<h3 class="flex items-center text-sm font-medium text-white">
							<IconFileDocument class="mr-2 h-4 w-4 text-yellow-400" />
							Process Certificates
						</h3>
						<p class="mt-1 text-xs text-gray-400">Update certification statuses</p>
					</div>
				</div>
				{#if triggerStates.certificates.error}
					<div class="mb-3 text-xs text-red-400">
						Error: {triggerStates.certificates.error}
					</div>
				{/if}
				<button
					onclick={() => triggerProcess('certificates')}
					disabled={triggerStates.certificates.loading}
					class="inline-flex w-full items-center justify-center space-x-2 rounded px-3 py-2 text-sm transition-all duration-300
						{triggerStates.certificates.justCompleted
						? 'border border-green-600/30 bg-green-600/20 text-green-400'
						: 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'} 
						disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if triggerStates.certificates.loading}
						<IconLoading class="h-4 w-4 animate-spin" />
						<span>Processing...</span>
					{:else if triggerStates.certificates.justCompleted}
						<IconCog class="h-4 w-4 text-green-400" />
						<span>Completed!</span>
					{:else}
						<IconSync class="h-4 w-4" />
						<span>Run Process</span>
					{/if}
				</button>
				{#if triggerStates.certificates.justCompleted && triggerStates.certificates.result}
					<div class="animate-in slide-in-from-top mt-2 text-xs text-green-300 duration-300">
						✓ Synced {triggerStates.certificates.result.synced_count || 0} certificates
					</div>
				{/if}
			</div>

			<!-- Membership Sync -->
			<div class="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
				<div class="mb-3 flex items-start justify-between">
					<div>
						<h3 class="flex items-center text-sm font-medium text-white">
							<IconAccountSwitch class="mr-2 h-4 w-4 text-purple-400" />
							Sync Memberships
						</h3>
						<p class="mt-1 text-xs text-gray-400">Update user membership levels</p>
					</div>
				</div>
				{#if triggerStates.memberships.error}
					<div class="mb-3 text-xs text-red-400">
						Error: {triggerStates.memberships.error}
					</div>
				{/if}
				<button
					onclick={() => triggerProcess('memberships')}
					disabled={triggerStates.memberships.loading}
					class="inline-flex w-full items-center justify-center space-x-2 rounded px-3 py-2 text-sm transition-all duration-300
						{triggerStates.memberships.justCompleted
						? 'border border-green-600/30 bg-green-600/20 text-green-400'
						: 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'} 
						disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if triggerStates.memberships.loading}
						<IconLoading class="h-4 w-4 animate-spin" />
						<span>Processing...</span>
					{:else if triggerStates.memberships.justCompleted}
						<IconCog class="h-4 w-4 text-green-400" />
						<span>Completed!</span>
					{:else}
						<IconSync class="h-4 w-4" />
						<span>Run Process</span>
					{/if}
				</button>
				{#if triggerStates.memberships.justCompleted && triggerStates.memberships.result}
					<div class="animate-in slide-in-from-top mt-2 text-xs text-green-300 duration-300">
						✓ {triggerStates.memberships.result.currentControllers || 0} controllers, {triggerStates
							.memberships.result.certificatesAssigned || 0} certificates assigned
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Error State -->
	{#if !data}
		<div class="mb-8 rounded-lg border border-red-700 bg-red-900 p-6">
			<div class="flex items-center">
				<IconAlertCircle class="mr-3 h-6 w-6 text-red-400" />
				<div>
					<h3 class="text-lg font-medium text-red-200">Error Loading Data</h3>
					<p class="mt-1 text-red-300">
						Unable to load admin dashboard data. Please try refreshing the page.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Stats Grid -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<IconAccountGroup class="h-8 w-8 text-blue-400" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Total Users</p>
						<p class="text-2xl font-semibold text-white">{data.stats.totalUsers}</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<IconShield class="h-8 w-8 text-green-400" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Active Controllers</p>
						<p class="text-2xl font-semibold text-white">{data.stats.activeControllers}</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<IconCertificate class="h-8 w-8 text-yellow-400" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Pending Certs</p>
						<p class="text-2xl font-semibold text-white">{data.stats.pendingCertifications}</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<IconDatabase class="h-8 w-8 text-purple-400" />
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-400">Total Sessions</p>
						<p class="text-2xl font-semibold text-white">{data.stats.totalSessions}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Recent Users -->
			<div class="rounded-lg border border-gray-700 bg-gray-800">
				<div class="border-b border-gray-700 px-6 py-4">
					<h3 class="flex items-center text-lg font-medium text-white">
						<IconAccount class="mr-2 h-5 w-5" />
						Recent Users
					</h3>
				</div>
				<div class="divide-y divide-gray-700">
					{#each data.recentUsers as user}
						<div class="hover:bg-gray-750 px-6 py-4 transition-colors">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-3">
									<div class="flex-shrink-0">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
											<span class="text-xs font-medium text-white">
												{user.firstName.charAt(0)}{user.lastName.charAt(0)}
											</span>
										</div>
									</div>
									<div>
										<p class="text-sm font-medium text-white">
											{user.firstName}
											{user.lastName}
										</p>
										<p class="text-xs text-gray-400">CID: {user.cid}</p>
									</div>
								</div>
								<div class="text-right">
									<div class="flex items-center space-x-1">
										<span
											class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
											{user.membership === 'controller'
												? 'bg-green-900 text-green-200'
												: user.membership === 'community'
													? 'bg-blue-900 text-blue-200'
													: 'bg-gray-700 text-gray-300'}"
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
									<p class="mt-1 text-xs text-gray-500">{user.lastActivity}</p>
								</div>
							</div>
						</div>
					{/each}
					{#if data.recentUsers.length === 0}
						<div class="px-6 py-8 text-center">
							<p class="text-gray-400">No users found</p>
						</div>
					{/if}
				</div>
				<div class="bg-gray-750 rounded-b-lg px-6 py-3">
					<a
						href="/admin/users"
						class="flex items-center text-sm text-blue-400 hover:text-blue-300"
					>
						View all users
						<IconChevronRight class="ml-1 h-4 w-4" />
					</a>
				</div>
			</div>

			<!-- Pending Certifications -->
			<div class="rounded-lg border border-gray-700 bg-gray-800">
				<div class="border-b border-gray-700 px-6 py-4">
					<h3 class="flex items-center text-lg font-medium text-white">
						<IconCertificate class="mr-2 h-5 w-5" />
						Pending Certifications
					</h3>
				</div>
				<div class="divide-y divide-gray-700">
					{#each data.pendingCertifications as cert}
						<div class="hover:bg-gray-750 px-6 py-4 transition-colors">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-white">{cert.name}</p>
									<p class="text-xs text-gray-400">CID: {cert.cid}</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-medium text-yellow-400">{cert.certification}</p>
									<p class="text-xs text-gray-500">{formatTimeAgo(cert.createdAt)}</p>
								</div>
							</div>
						</div>
					{/each}
					{#if data.pendingCertifications.length === 0}
						<div class="px-6 py-8 text-center">
							<p class="text-gray-400">No pending certifications</p>
						</div>
					{/if}
				</div>
				<div class="bg-gray-750 rounded-b-lg px-6 py-3">
					<button class="flex items-center text-sm text-blue-400 hover:text-blue-300">
						Manage certifications
						<IconChevronRight class="ml-1 h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Unassigned Roster Members -->
			<div class="rounded-lg border border-gray-700 bg-gray-800">
				<div class="border-b border-gray-700 px-6 py-4">
					<h3 class="flex items-center text-lg font-medium text-white">
						<IconAccountAlert class="mr-2 h-5 w-5" />
						Unassigned Roster Members
					</h3>
				</div>
				<div class="divide-y divide-gray-700">
					{#each data.unassignedRosterMembers as member}
						<div class="hover:bg-gray-750 px-6 py-4 transition-colors">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-white">{member.name}</p>
									<p class="text-xs text-gray-400">CID: {member.cid}</p>
								</div>
								<div class="text-right">
									<div class="flex items-center space-x-2">
										<span
											class="inline-flex rounded-full bg-sky-600/90 px-2 py-1 text-xs font-semibold text-white"
										>
											{member.rating}
										</span>
									</div>
									<p class="mt-1 text-xs text-gray-500">{formatTimeAgo(member.joinedAt)}</p>
								</div>
							</div>
						</div>
					{:else}
						<div class="px-6 py-8 text-center">
							<p class="text-gray-400">All roster members have accounts</p>
						</div>
					{/each}
				</div>
				<div class="bg-gray-750 rounded-b-lg px-6 py-3">
					<p class="text-sm text-blue-400">These controllers need to log in to create accounts</p>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="mt-8">
			<h3 class="mb-4 text-lg font-medium text-white">Quick Actions</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<a
					href="/admin/users"
					class="block rounded-lg border border-gray-600 bg-gray-800 p-4 text-left transition-colors hover:bg-gray-700"
				>
					<div class="flex items-center space-x-3">
						<IconAccountGroup class="h-6 w-6 text-blue-400" />
						<div>
							<p class="text-sm font-medium text-white">Manage Users</p>
							<p class="text-xs text-gray-400">Add, edit, or remove user accounts</p>
						</div>
					</div>
				</a>

				<button
					class="rounded-lg border border-gray-600 bg-gray-800 p-4 text-left transition-colors hover:bg-gray-700"
				>
					<div class="flex items-center space-x-3">
						<IconCertificate class="h-6 w-6 text-yellow-400" />
						<div>
							<p class="text-sm font-medium text-white">Review Certifications</p>
							<p class="text-xs text-gray-400">Approve or deny certification requests</p>
						</div>
					</div>
				</button>

				<button
					class="rounded-lg border border-gray-600 bg-gray-800 p-4 text-left transition-colors hover:bg-gray-700"
				>
					<div class="flex items-center space-x-3">
						<IconCog class="h-6 w-6 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-white">System Settings</p>
							<p class="text-xs text-gray-400">Configure application settings</p>
						</div>
					</div>
				</button>
			</div>
		</div>
	{/if}
</div>
