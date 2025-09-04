import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchRoster } from '$lib/server/vatusaDataClient';
import { controllerCertificationsTable, rosterMembersTable } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

const ARTCC_ID = 'ZID';

// Certification mapping
const getCertifications = (rating: string): string[] => {
	switch (rating) {
		case 'OBS': return [];
		case 'S1': return ['S-GND', 'A-GND'];
		case 'S2': return ['S-GND', 'A-GND', 'S-TWR', 'A-TWR'];
		case 'S3': return ['S-GND', 'A-GND', 'S-TWR', 'A-TWR', 'APR'];
		case 'C1':
		case 'C3':
		case 'I1':
		case 'I3':
		case 'SUP': return ['S-GND', 'A-GND', 'S-TWR', 'A-TWR', 'APR', 'CTR'];
		default: return [];
	}
};

export const GET: RequestHandler = async ({ platform }) => {
	const db = drizzle(platform?.env?.DB!);

	const startTime = performance.now();
	console.log(`[${new Date().toISOString()}] Starting roster processing`);
	
	// Fetch fresh roster data
	const fetchStartTime = performance.now();
	const roster = await fetchRoster(ARTCC_ID);
	const fetchEndTime = performance.now();
	console.log(`⏱️ VATUSA API fetch took ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);
	
	const now = new Date().toISOString();
	let rosterUpdated = 0;

	console.log(`Fetched ${roster.length} roster members from VATUSA`);

	// Process: TRUNCATE + ADD ALL CONTROLLERS + REFRESH CERTIFICATES
	// 1. TRUNCATE rostered_controllers
	const truncateStartTime = performance.now();
	console.log('🗑️ Truncating existing roster...');
	await db.delete(rosterMembersTable);
	const truncateEndTime = performance.now();
	console.log(`⏱️ Truncate took ${(truncateEndTime - truncateStartTime).toFixed(2)}ms`);
	
	// 2. ADD ALL CONTROLLERS FROM API
	const insertStartTime = performance.now();
	console.log(`📥 Adding ${roster.length} controllers from API...`);
	const rosterValues = roster.map(member => ({
		cid: String(member.cid),
		first_name: member.fname,
		last_name: member.lname,
		email: member.email,
		facility: member.facility,
		rating: member.rating,
		rating_short: member.rating_short,
		vatusa_created_at: member.created_at,
		vatusa_updated_at: member.updated_at,
		facility_joined_at: member.facility_join,
		last_activity_at: member.lastactivity,
		name_privacy: member.flag_nameprivacy,
		promotion_eligible: member.promotion_eligible,
		is_mentor: member.isMentor,
		is_instructor: member.isSupIns,
		last_promoted_at: member.last_promotion,
		discord_id: member.discord_id,
		roles: JSON.stringify(member.roles),
		raw_data: JSON.stringify(member),
		updated_at: now
	}));

	// Use D1's batch API for efficient bulk operations
	const insertStatements = rosterValues.map(member => 
		db.insert(rosterMembersTable).values(member)
	);
	
	const batchResults = await db.batch(insertStatements);
	rosterUpdated = batchResults.length;
	const insertEndTime = performance.now();
	console.log(`⏱️ D1 batch insert of ${roster.length} members took ${(insertEndTime - insertStartTime).toFixed(2)}ms`);

	console.log(`📝 Certificate processing deferred to SSO login for better performance`);

	const endTime = performance.now();
	const totalTime = endTime - startTime;
	console.log(`Updated ${rosterUpdated} roster members`);
	console.log(`⏱️ TOTAL PROCESSING TIME: ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(2)}s)`);
	console.log(`[${new Date().toISOString()}] Roster processing complete`);

	return json({
		message: 'Roster processed successfully',
		roster_members_updated: rosterUpdated,
		total_time_ms: Math.round(totalTime),
		processed_at: now
	});
};
