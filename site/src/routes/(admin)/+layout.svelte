<script lang="ts">
	import IconDashboard from '~icons/mdi/view-dashboard';
	import IconAccountGroup from '~icons/mdi/account-group';
	import IconCog from '~icons/mdi/cog';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const navigationItems = [
		{
			name: 'Dashboard',
			href: '/admin',
			icon: IconDashboard
		},
		{
			name: 'User Management',
			href: '/admin/users',
			icon: IconAccountGroup
		}
	];

	function isActive(href: string): boolean {
		if (href === '/admin') {
			return $page.url.pathname === '/admin';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="relative flex min-h-screen bg-gray-900 pt-16 overflow-hidden">
	<!-- Background Elements (matching PageHero) -->
	<div class="absolute inset-0 z-0 bg-gradient-to-br from-slate-700/30 via-transparent to-slate-900/20 opacity-60"></div>
	<div 
		class="absolute inset-0 z-0"
		style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 20px 20px;"
	></div>

	<!-- Sidebar -->
	<div class="relative z-10 w-64 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700/50 flex-shrink-0">
		<div class="p-4">
			<div class="flex items-center space-x-3 mb-6">
				<IconCog class="h-5 w-5 text-sky-400" />
				<h2 class="text-base font-semibold text-white">Administration</h2>
			</div>
			
			<nav class="space-y-1">
				{#each navigationItems as item}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
							{isActive(item.href)
								? 'bg-sky-600/20 text-sky-400 border border-sky-600/30'
								: 'text-gray-300 hover:bg-slate-700/50 hover:text-white'}"
					>
						<Icon class="h-4 w-4" />
						<span>{item.name}</span>
					</a>
				{/each}
			</nav>
		</div>
	</div>

	<!-- Main Content -->
	<div class="relative z-10 flex-1 min-w-0 bg-gray-900/50 backdrop-blur-sm max-w-none">
		{@render children()}
	</div>
</div>