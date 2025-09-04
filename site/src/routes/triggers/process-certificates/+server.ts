import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { controllerCertificationsTable, rosterMembersTable, usersTable } from '$lib/db/schema';
import { lt, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

const EXPIRATION_MONTHS = 6;

export const GET: RequestHandler = async ({ platform }) => {
	const db = drizzle(platform?.env?.DB!);

	console.log(`[${new Date().toISOString()}] Starting certificate processing`);
	
	const now = new Date();
	const startTime = performance.now();

	// 1. FIRST: Set certificates to expired that haven't synced in 6 months
	const expireStartTime = performance.now();
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - EXPIRATION_MONTHS);

	const expiredCerts = await db
		.update(controllerCertificationsTable)
		.set({ status: 'expired' })
		.where(lt(controllerCertificationsTable.last_synced_at, sixMonthsAgo))
		.returning();

	const expired = expiredCerts.length;
	const expireEndTime = performance.now();
	console.log(`⚠️ Set ${expired} certificates to expired (not synced in ${EXPIRATION_MONTHS} months)`);
	console.log(`⏱️ Certificate expiry took ${(expireEndTime - expireStartTime).toFixed(2)}ms`);

	// 2. THEN: Update sync times for certificates of current roster members
	const syncStartTime = performance.now();
	
	const syncResult = await db
		.update(controllerCertificationsTable)
		.set({ last_synced_at: now })
		.where(
			sql`${controllerCertificationsTable.user_id} IN (SELECT ${usersTable.id} FROM ${usersTable} WHERE ${usersTable.cid} IN (SELECT ${rosterMembersTable.cid} FROM ${rosterMembersTable}))`
		)
		.returning();
	
	const syncedCount = syncResult.length;
	const syncEndTime = performance.now();
	console.log(`✅ Updated sync time for ${syncedCount} certificates from current roster members`);
	console.log(`⏱️ Roster sync update took ${(syncEndTime - syncStartTime).toFixed(2)}ms`);

	const endTime = performance.now();
	const totalTime = endTime - startTime;
	console.log(`⏱️ TOTAL CERTIFICATE PROCESSING TIME: ${totalTime.toFixed(2)}ms`);
	console.log(`[${new Date().toISOString()}] Certificate processing complete`);

	return json({
		message: 'Certificates processed successfully',
		synced_count: syncedCount,
		expired_count: expired,
		total_time_ms: Math.round(totalTime),
		processed_at: now.toISOString()
	});
};