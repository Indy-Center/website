import type { VatusaRosterMember } from '$lib/types';

export async function load({ fetch }) {
	const response = (await fetch('/api/roster').then((res) => res.json())) as {
		roster: VatusaRosterMember[];
	};

	return {
		roster: response.roster
	};
}