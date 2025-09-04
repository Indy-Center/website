<script lang="ts">
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import IconHome from '~icons/mdi/home';
	import IconAccountGroup from '~icons/mdi/account-group';
	import IconCog from '~icons/mdi/cog';
	let { data } = $props();

	const BASE_LINKS = [
		{
			label: 'Home',
			href: '/',
			icon: IconHome
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
</script>

<!-- Navigation Header -->
<div
	class="relative z-20 mx-auto flex h-16 w-full max-w-7xl items-center justify-center space-x-4 p-2"
>
	<Logo class="h-8 w-auto" />
	<div class="flex-1">
		{#if data.user}
			<div class="flex items-center space-x-2">
				<span class="text-white">{data.user.firstName}</span>
				<span class="text-gray-300">{data.user.lastName}</span>
				<span class="text-gray-300">{data.userVatsimData.vatsim.rating.short}</span>
			</div>
		{/if}
	</div>

	<nav class="flex space-x-1">
		{#each links as link}
			{@const Icon = link.icon}
			<a
				href={link.href}
				class="relative flex items-center space-x-2 rounded-lg border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out
				{isActive(link.href)
					? 'border-sky-400 bg-sky-600/20 text-white'
					: 'text-gray-300 hover:bg-white/10 hover:text-white'}"
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				<Icon class="h-4 w-4" aria-hidden="true" />
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>
</div>
