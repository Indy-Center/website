<script lang="ts">
	import { page } from '$app/state';
	import type { User } from '$lib/server/session';
	import type { VatsimUserData } from '$lib/server/vatsimConnectClient';
	import Logo from './Logo.svelte';
	import IconHome from '~icons/mdi/home';
	import IconAccountGroup from '~icons/mdi/account-group';
	import IconCog from '~icons/mdi/cog';
	import IconCalendar from '~icons/mdi/calendar';
	import IconPilotRating from '~icons/mdi/airplane';
	import IconRating from '~icons/mdi/radar';
	import IconLogout from '~icons/mdi/logout';
	import IconAccount from '~icons/mdi/account-circle';
	import IconChevronDown from '~icons/mdi/chevron-down';
	import IconMenu from '~icons/mdi/menu';
	import IconClose from '~icons/mdi/close';

	let { data }: { data: { user: User; userVatsimData: VatsimUserData } } = $props();

	let showDropdown = $state(false);
	let showMobileMenu = $state(false);

	const BASE_LINKS = [
		{
			label: 'Home',
			href: '/',
			icon: IconHome
		},
		{
			label: 'Events',
			href: '/events',
			icon: IconCalendar
		},
		{
			label: 'Roster',
			href: '/roster',
			icon: IconAccountGroup
		}
	];

	const links = $derived([
		...BASE_LINKS,
		...(data.user?.isAdmin
			? [
					{
						label: 'Admin',
						href: '/admin',
						icon: IconCog
					}
				]
			: [])
	]);

	function isActive(href: string) {
		return page.url.pathname === href;
	}

	function toggle(event) {
		event.stopPropagation();
		showDropdown = !showDropdown;
	}

	function toggleMobile() {
		showMobileMenu = !showMobileMenu;
	}
</script>

<svelte:document onclick={(e) => { 
	if (!e.target.closest('.user-dropdown') && !e.target.closest('.mobile-menu-container')) {
		showDropdown = false; 
		showMobileMenu = false; 
	}
}} />

<!-- Navigation Header -->
<div class="relative z-20 mx-auto flex h-16 w-full max-w-7xl items-center justify-between p-2">
	<!-- Logo + User Info -->
	<div class="flex items-center space-x-4">
		<a href="/" class="cursor-pointer">
			<Logo class="h-8 w-auto" />
		</a>
		<div class="hidden md:block">
			{#if data.user}
				<div class="relative">
				<button 
					type="button"
					onclick={toggle}
					class="cursor-pointer flex items-center space-x-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out {showDropdown ? 'bg-sky-600/20 text-white rounded-t-lg rounded-b-none border border-slate-600/30 border-b-0' : 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 rounded-lg'}"
				>
					<IconAccount class="h-6 w-6 text-sky-400" />
					<div class="flex items-center space-x-2">
						<span class="font-medium">{data.user.preferredName ? data.user.preferredName : data.user.firstName + ' ' + data.user.lastName}</span>
						<div class="flex items-center space-x-1">
							{#if data.userVatsimData.vatsim.rating.short}
								<div class="text-xs font-mono flex items-center gap-1 px-2 py-1 rounded-md bg-sky-600/30 text-sky-200">
									<IconRating class="h-3 w-3" />
									{data.userVatsimData.vatsim.rating.short}
								</div>
							{/if}
							{#if data.userVatsimData.vatsim.pilotrating.short}
								<div class="text-xs font-mono flex items-center gap-1 px-2 py-1 rounded-md bg-pink-600/30 text-pink-200">
									<IconPilotRating class="h-3 w-3" />
									{data.userVatsimData.vatsim.pilotrating.short}
								</div>
							{/if}
						</div>
					</div>
					<IconChevronDown class="h-4 w-4 transition-transform duration-200 {showDropdown ? 'rotate-180' : ''}" />
				</button>

				{#if showDropdown}
					<div class="absolute top-full left-0 right-0 bg-slate-800/95 backdrop-blur-lg rounded-t-none rounded-b-lg border border-slate-600/30 border-t-0 shadow-xl z-[9999]" onclick={(e) => e.stopPropagation()}>
						<div class="p-3">
							<a 
								href="/logout"
								class="cursor-pointer w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
							>
								<IconLogout class="h-4 w-4" />
								<span>Sign Out</span>
							</a>
						</div>
					</div>
				{/if}
				</div>
			{:else}
				<!-- Login Button for non-authenticated users -->
				<a 
					href="/login/connect"
					class="cursor-pointer flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white hover:text-gray-200 bg-sky-400/30 hover:bg-slate-600/50 transition-colors duration-200"
				>
					<IconAccount class="h-5 w-5" />
					<span>Connect VATSIM Account</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- Desktop Navigation on the right -->
	<nav class="hidden md:flex space-x-1">
		{#each links as link}
			{@const Icon = link.icon}
			<a
				href={link.href}
				class="relative flex items-center space-x-2 rounded-lg border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer
				{isActive(link.href)
					? 'border-sky-400 bg-sky-600/20 text-white shadow-lg'
					: 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105'}"
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				<Icon class="h-4 w-4" aria-hidden="true" />
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<!-- Mobile Menu Button -->
	<button 
		type="button"
		onclick={(e) => { e.stopPropagation(); toggleMobile(); }}
		class="cursor-pointer md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors duration-200"
	>
		{#if showMobileMenu}
			<IconClose class="h-6 w-6" />
		{:else}
			<IconMenu class="h-6 w-6" />
		{/if}
	</button>
</div>

<!-- Mobile Menu -->
{#if showMobileMenu}
	<div class="mobile-menu-container md:hidden bg-slate-800/95 backdrop-blur-lg border-t border-slate-600/30" onclick={(e) => e.stopPropagation()}>
		<div class="mx-auto max-w-7xl px-2 py-3 space-y-1">
			<!-- Navigation Links -->
			{#each links as link}
				{@const Icon = link.icon}
				<a
					href={link.href}
					class="cursor-pointer flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 {isActive(link.href) ? 'bg-sky-600/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}"
					onclick={() => showMobileMenu = false}
				>
					<Icon class="h-5 w-5" />
					<span>{link.label}</span>
				</a>
			{/each}
			
			<!-- User Info Section -->
			{#if data.user}
				<div class="border-t border-slate-600/30 pt-3 mt-3">
					<div class="px-4 py-3 bg-slate-700/30 rounded-lg">
						<div class="flex items-center space-x-3 mb-3">
							<IconAccount class="h-8 w-8 text-sky-400" />
							<div>
								<div class="text-sm font-semibold text-white">
									{data.user.preferredName ? data.user.preferredName : data.user.firstName + ' ' + data.user.lastName}
								</div>
								<div class="text-xs text-gray-400 font-mono">CID: {data.userVatsimData.cid}</div>
							</div>
						</div>
						
						<div class="flex flex-wrap gap-2 mb-3">
							{#if data.userVatsimData.vatsim.rating.short}
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-600/30 text-sky-200 text-xs font-mono">
									<IconRating class="h-3 w-3" />
									{data.userVatsimData.vatsim.rating.short}
								</div>
							{/if}
							{#if data.userVatsimData.vatsim.pilotrating.short}
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-pink-600/30 text-pink-200 text-xs font-mono">
									<IconPilotRating class="h-3 w-3" />
									{data.userVatsimData.vatsim.pilotrating.short}
								</div>
							{/if}
						</div>
						
						<a 
							href="/logout"
							class="cursor-pointer flex items-center justify-center space-x-2 w-full px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-600/20 rounded-lg border border-red-600/30 hover:border-red-500/50 transition-colors duration-200"
							onclick={() => showMobileMenu = false}
						>
							<IconLogout class="h-4 w-4" />
							<span>Sign Out</span>
						</a>
					</div>
				</div>
			{:else}
				<!-- Connect VATSIM Account for non-authenticated users -->
				<div class="border-t border-slate-600/30 pt-3 mt-3">
					<a 
						href="/login/connect"
						class="cursor-pointer flex items-center justify-center space-x-2 w-full px-4 py-3 text-sm text-white bg-sky-600/40 hover:bg-sky-500/50 rounded-lg border border-sky-500/30 hover:border-sky-400/50 transition-colors duration-200 font-medium"
						onclick={() => showMobileMenu = false}
					>
						<IconAccount class="h-5 w-5" />
						<span>Connect VATSIM Account</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}