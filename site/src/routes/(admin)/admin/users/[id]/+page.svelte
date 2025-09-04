<script lang="ts">
	import IconAccount from '~icons/mdi/account';
	import IconEmail from '~icons/mdi/email';
	import IconCard from '~icons/mdi/card-account-details';
	import IconCertificate from '~icons/mdi/certificate';
	import IconHistory from '~icons/mdi/history';
	import IconEdit from '~icons/mdi/pencil';
	import IconTrash from '~icons/mdi/trash-can';
	import IconArrowLeft from '~icons/mdi/arrow-left';
	import IconSave from '~icons/mdi/content-save';
	import IconCancel from '~icons/mdi/cancel';
	import IconAccountCircle from '~icons/mdi/account-circle';
	import IconPlus from '~icons/mdi/plus';
	import IconTrashCanOutline from '~icons/mdi/trash-can-outline';
	import PageHero from '$lib/components/PageHero.svelte';
	import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
	import { superForm } from 'sveltekit-superforms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Edit mode state
	let isEditing = $state(false);
	let showDeleteConfirm = $state(false);

	// Initialize superforms
	const { form, errors, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.valid) {
				isEditing = false;
				// Update the user data for display
				data.user = { ...data.user, ...form.data };
				// Update certifications display
				if (form.data.certificates) {
					data.certifications = form.data.certificates.map(cert => ({
						...cert,
						created_at: new Date(),
						last_synced_at: new Date()
					}));
				}
			}
		}
	});

	// Available certificates for dropdown
	const availableCertifications = ['DEL', 'S-GND', 'A-GND', 'S-TWR', 'A-TWR', 'APR', 'CTR', 'T2-CTR'];

	// Functions for managing certificates
	function addCertificate() {
		const current = $form.certificates || [];
		$form.certificates = [...current, { certification: 'DEL', status: 'in_progress' }];
	}

	function removeCertificate(index: number) {
		const current = $form.certificates || [];
		$form.certificates = current.filter((_, i) => i !== index);
	}

	// Helper functions
	function formatTimeAgo(dateString: string | Date | null): string {
		if (!dateString) return 'Never';

		try {
			const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
			if (!isValid(date)) return 'Unknown';
			return formatDistanceToNow(date, { addSuffix: true });
		} catch {
			return 'Unknown';
		}
	}

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

	function toggleEdit() {
		isEditing = !isEditing;
	}

	function goBack() {
		goto('/admin/users');
	}
</script>

<svelte:head>
	<title>User: {data.user.firstName} {data.user.lastName} | Indy Center Admin</title>
</svelte:head>

<div class="px-6 py-6 pr-8">
	<!-- Back Navigation -->
	<div class="mb-6">
		<button
			onclick={goBack}
			class="inline-flex items-center space-x-2 rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-700/50"
		>
			<IconArrowLeft class="h-4 w-4" />
			<span>Back to Users</span>
		</button>
	</div>

	<!-- User Header -->
	<div class="mb-8 flex items-start justify-between">
		<div class="flex items-center space-x-4">
			<!-- Avatar -->
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-600">
				<span class="text-xl font-medium text-white">
					{data.user.firstName.charAt(0)}{data.user.lastName.charAt(0)}
				</span>
			</div>

			<!-- User Info -->
			<div>
				<h1 class="mb-1 text-2xl font-bold text-white">
					{data.user.preferredName || data.user.firstName}
					{data.user.lastName}
				</h1>
				<div class="mb-2 flex items-center space-x-4 text-sm text-gray-400">
					<span class="font-mono">CID: {data.user.cid}</span>
					<span>{data.user.email}</span>
				</div>
				<div class="flex items-center space-x-2">
					<span
						class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getMembershipBadgeClass(
							data.user.membership
						)}"
					>
						{data.user.membership}
					</span>
					{#if data.user.isAdmin}
						<span
							class="inline-flex items-center rounded-full bg-purple-900 px-2 py-1 text-xs font-medium text-purple-200"
						>
							Admin
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Action Button -->
		<div class="flex space-x-3">
			{#if !isEditing}
				<button
					onclick={toggleEdit}
					class="inline-flex items-center space-x-2 rounded-lg bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700"
				>
					<IconEdit class="h-4 w-4" />
					<span>Edit User</span>
				</button>
			{/if}
		</div>
	</div>
	<!-- Error Messages -->
	{#if $errors._errors}
		<div class="mb-6 rounded-lg border border-red-700 bg-red-900/50 p-4">
			{#each $errors._errors as error}
				<p class="text-red-200">{error}</p>
			{/each}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Main User Info -->
		<div class="space-y-6 lg:col-span-2">
			<!-- User Details -->
			<div class="rounded-lg border border-slate-700 bg-slate-800/80">
				<div class="border-b border-slate-700 px-6 py-4">
					<h3 class="flex items-center text-lg font-medium text-white">
						<IconAccount class="mr-2 h-5 w-5" />
						User Details
					</h3>
				</div>
				<div class="p-6">
					{#if isEditing}
						<form method="POST" action="?/updateUser" use:enhance>
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div>
									<label for="firstName" class="mb-2 block text-sm font-medium text-gray-300">
										First Name *
									</label>
									<input
										type="text"
										id="firstName"
										name="firstName"
										bind:value={$form.firstName}
										required
										class="w-full rounded-lg border bg-slate-700 px-4 py-2 text-white {$errors.firstName
											? 'border-red-500'
											: 'border-slate-600'} focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
									/>
									{#if $errors.firstName}
										<p class="mt-1 text-sm text-red-400">{$errors.firstName}</p>
									{/if}
								</div>
								<div>
									<label for="lastName" class="mb-2 block text-sm font-medium text-gray-300">
										Last Name *
									</label>
									<input
										type="text"
										id="lastName"
										name="lastName"
										bind:value={$form.lastName}
										required
										class="w-full rounded-lg border bg-slate-700 px-4 py-2 text-white {$errors.lastName
											? 'border-red-500'
											: 'border-slate-600'} focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
									/>
									{#if $errors.lastName}
										<p class="mt-1 text-sm text-red-400">{$errors.lastName}</p>
									{/if}
								</div>
								<div>
									<label for="preferredName" class="mb-2 block text-sm font-medium text-gray-300">
										Preferred Name
									</label>
									<input
										type="text"
										id="preferredName"
										name="preferredName"
										bind:value={$form.preferredName}
										class="w-full rounded-lg border bg-slate-700 px-4 py-2 text-white {$errors.preferredName
											? 'border-red-500'
											: 'border-slate-600'} focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
									/>
									{#if $errors.preferredName}
										<p class="mt-1 text-sm text-red-400">{$errors.preferredName}</p>
									{/if}
								</div>
								<div>
									<label for="pronouns" class="mb-2 block text-sm font-medium text-gray-300">
										Pronouns
									</label>
									<input
										type="text"
										id="pronouns"
										name="pronouns"
										bind:value={$form.pronouns}
										placeholder="e.g., he/him, she/her, they/them"
										class="w-full rounded-lg border bg-slate-700 px-4 py-2 text-white {$errors.pronouns
											? 'border-red-500'
											: 'border-slate-600'} focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
									/>
									{#if $errors.pronouns}
										<p class="mt-1 text-sm text-red-400">{$errors.pronouns}</p>
									{/if}
								</div>
								<div class="md:col-span-2">
									<label for="email" class="mb-2 block text-sm font-medium text-gray-300">
										Email *
									</label>
									<input
										type="email"
										id="email"
										name="email"
										bind:value={$form.email}
										required
										class="w-full rounded-lg border bg-slate-700 px-4 py-2 text-white {$errors.email
											? 'border-red-500'
											: 'border-slate-600'} focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
									/>
									{#if $errors.email}
										<p class="mt-1 text-sm text-red-400">{$errors.email}</p>
									{/if}
								</div>
								<div>
									<label for="membership" class="mb-2 block text-sm font-medium text-gray-300">
										Membership Type *
									</label>
									<select
										id="membership"
										name="membership"
										bind:value={$form.membership}
										class="w-full rounded-lg border bg-slate-700 px-4 py-2 text-white {$errors.membership
											? 'border-red-500'
											: 'border-slate-600'} focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
									>
										<option value="basic">Basic</option>
										<option value="community">Community</option>
										<option value="controller">Controller</option>
									</select>
									{#if $errors.membership}
										<p class="mt-1 text-sm text-red-400">{$errors.membership}</p>
									{/if}
								</div>
								<div class="md:col-span-2">
									<div
										class="flex items-center space-x-3 rounded-lg border border-slate-600 bg-slate-700/50 p-4"
									>
										<input
											type="checkbox"
											id="isAdmin"
											name="isAdmin"
											bind:checked={$form.isAdmin as boolean}
											class="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-sky-500"
										/>
										<div>
											<label for="isAdmin" class="text-sm font-medium text-gray-300">
												Administrator Access
											</label>
											<p class="mt-1 text-xs text-gray-400">Grant admin privileges to this user</p>
										</div>
									</div>
									{#if $errors.isAdmin}
										<p class="mt-1 text-sm text-red-400">{$errors.isAdmin}</p>
									{/if}
								</div>
								
								<!-- Certificate Management -->
								<div class="md:col-span-2">
									<div class="mb-3 flex items-center justify-between">
										<label class="text-sm font-medium text-gray-300">Certifications</label>
										<button
											type="button"
											onclick={addCertificate}
											class="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-sky-600/20 text-sky-400 rounded hover:bg-sky-600/30 transition-colors"
										>
											<IconPlus class="h-3 w-3" />
											<span>Add</span>
										</button>
									</div>
									
									{#if $form.certificates && $form.certificates.length > 0}
										<div class="space-y-2 max-h-48 overflow-y-auto">
											{#each $form.certificates as cert, index}
												<div class="flex items-center space-x-2 p-2 bg-slate-700/30 rounded border border-slate-600">
													<select
														bind:value={cert.certification}
														class="flex-1 rounded bg-slate-700 px-2 py-1 text-white text-sm border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
													>
														{#each availableCertifications as certOption}
															<option value={certOption}>{certOption}</option>
														{/each}
													</select>
													<select
														bind:value={cert.status}
														class="rounded bg-slate-700 px-2 py-1 text-white text-sm border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
													>
														<option value="certified">Certified</option>
														<option value="in_progress">In Progress</option>
														<option value="expired">Expired</option>
													</select>
													<button
														type="button"
														onclick={() => removeCertificate(index)}
														class="p-1 text-red-400 hover:text-red-300 transition-colors"
													>
														<IconTrashCanOutline class="h-4 w-4" />
													</button>
												</div>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-gray-400 p-3 bg-slate-700/20 rounded border border-slate-600">
											No certifications assigned. Click "Add" to assign certificates.
										</p>
									{/if}
									
									{#if $errors.certificates}
										<p class="mt-1 text-sm text-red-400">{$errors.certificates}</p>
									{/if}
								</div>
							</div>
							<div class="mt-6 flex justify-end space-x-3 border-t border-slate-600 pt-6">
								<button
									type="button"
									onclick={toggleEdit}
									class="inline-flex items-center space-x-2 rounded bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-600"
								>
									<IconCancel class="h-4 w-4" />
									<span>Cancel</span>
								</button>
								<button
									type="submit"
									disabled={$submitting}
									class="inline-flex items-center space-x-2 rounded bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<IconSave class="h-4 w-4" />
									<span>{$submitting ? 'Saving...' : 'Save Changes'}</span>
								</button>
							</div>
						</form>
					{:else}
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Full Name</label>
								<p class="text-white">{data.user.firstName} {data.user.lastName}</p>
							</div>
							{#if data.user.preferredName}
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-400">Preferred Name</label>
									<p class="text-white">{data.user.preferredName}</p>
								</div>
							{/if}
							{#if data.user.pronouns}
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-400">Pronouns</label>
									<p class="text-white">{data.user.pronouns}</p>
								</div>
							{/if}
							<div class="md:col-span-2">
								<label class="mb-1 block text-sm font-medium text-gray-400"
									>Contact & Account Info</label
								>
								<div class="space-y-2 rounded-lg bg-slate-700/30 p-4">
									<div class="flex items-center space-x-2 text-sm">
										<IconEmail class="h-4 w-4 text-gray-400" />
										<span class="text-white">{data.user.email}</span>
									</div>
									<div class="flex items-center space-x-2 text-sm">
										<IconAccount class="h-4 w-4 text-gray-400" />
										<span class="font-mono text-white">CID: {data.user.cid}</span>
									</div>
									<div class="flex items-center space-x-2">
										<span
											class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getMembershipBadgeClass(
												data.user.membership
											)}"
										>
											{data.user.membership}
										</span>
										{#if data.user.isAdmin}
											<span
												class="inline-flex items-center rounded-full bg-purple-900 px-2 py-1 text-xs font-medium text-purple-200"
											>
												Admin
											</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- VATSIM/Roster Info -->
			{#if data.rosterData}
				<div class="rounded-lg border border-slate-700 bg-slate-800/80">
					<div class="border-b border-slate-700 px-6 py-4">
						<h3 class="flex items-center text-lg font-medium text-white">
							<IconCard class="mr-2 h-5 w-5" />
							VATSIM Information
						</h3>
					</div>
					<div class="p-6">
						<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Rating</label>
								<span
									class="inline-flex rounded-full bg-sky-600/90 px-3 py-1 text-sm font-semibold text-white"
								>
									{data.rosterData.rating_short}
								</span>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Facility</label>
								<p class="text-white">{data.rosterData.facility}</p>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Joined Facility</label>
								<p class="text-white">{formatTimeAgo(data.rosterData.facility_joined_at)}</p>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Last Activity</label>
								<p class="text-white">{formatTimeAgo(data.rosterData.last_activity_at)}</p>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Mentor Status</label>
								<p class="text-white">{data.rosterData.is_mentor ? 'Yes' : 'No'}</p>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-400">Instructor Status</label
								>
								<p class="text-white">{data.rosterData.is_instructor ? 'Yes' : 'No'}</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Certifications -->
			{#if data.certifications.length > 0}
				<div class="rounded-lg border border-slate-700 bg-slate-800/80">
					<div class="border-b border-slate-700 px-6 py-4">
						<h3 class="flex items-center text-lg font-medium text-white">
							<IconCertificate class="mr-2 h-5 w-5" />
							Certifications ({data.certifications.length})
						</h3>
					</div>
					<div class="divide-y divide-slate-600">
						{#each data.certifications as cert}
							<div class="px-6 py-4">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="font-medium text-white">{cert.certification}</h4>
										<p class="text-sm text-gray-400">Created {formatTimeAgo(cert.created_at)}</p>
									</div>
									<span
										class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getCertificationBadgeClass(
											cert.status
										)}"
									>
										{cert.status}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Account Actions -->
			<div class="rounded-lg border border-slate-700 bg-slate-800/80">
				<div class="border-b border-slate-700 px-6 py-4">
					<h3 class="text-lg font-medium text-white">Account Actions</h3>
				</div>
				<div class="space-y-3 p-6">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-400">User ID</span>
						<code class="rounded bg-slate-700 px-2 py-1 font-mono text-xs text-gray-300"
							>{data.user.id}</code
						>
					</div>
					{#if data.authData}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-400">Account Created</span>
							<span class="text-sm text-white">{formatTimeAgo(data.authData.createdAt)}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-400">Last Updated</span>
							<span class="text-sm text-white">{formatTimeAgo(data.authData.updatedAt)}</span>
						</div>
					{/if}

					<div class="space-y-2 border-t border-slate-600 pt-4">
						{#if !showDeleteConfirm}
							<button
								onclick={() => (showDeleteConfirm = true)}
								class="inline-flex w-full items-center justify-center space-x-2 rounded bg-red-600/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-600/30"
							>
								<IconTrash class="h-4 w-4" />
								<span>Delete User Account</span>
							</button>
						{:else}
							<div class="space-y-2">
								<p class="text-sm text-red-300">Are you sure? This action cannot be undone.</p>
								<div class="flex space-x-2">
									<form method="POST" action="?/deleteUser" use:enhance class="flex-1">
										<button
											type="submit"
											class="w-full rounded bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
										>
											Yes, Delete
										</button>
									</form>
									<button
										onclick={() => (showDeleteConfirm = false)}
										class="flex-1 rounded bg-slate-700 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-600"
									>
										Cancel
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Active Sessions -->
			{#if data.sessions.length > 0}
				<div class="rounded-lg border border-slate-700 bg-slate-800/80">
					<div class="border-b border-slate-700 px-6 py-4">
						<h3 class="flex items-center text-lg font-medium text-white">
							<IconHistory class="mr-2 h-5 w-5" />
							Recent Sessions
						</h3>
					</div>
					<div class="divide-y divide-slate-600">
						{#each data.sessions as session}
							<div class="px-6 py-3">
								<div class="flex items-center justify-between">
									<code class="rounded bg-slate-700 px-2 py-1 font-mono text-xs text-gray-300">
										{session.id.slice(0, 8)}...
									</code>
									<span class="text-xs text-gray-400">
										Expires {formatTimeAgo(session.expiresAt)}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
