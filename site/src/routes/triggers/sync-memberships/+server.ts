import { json, error } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, notInArray, inArray, sql, and } from 'drizzle-orm';
import {
	usersTable,
	rosterMembersTable,
	authUsersTable,
	controllerCertificationsTable
} from '$lib/db/schema';
import type { RequestHandler } from './$types';

// Certificate mapping based on VATSIM ratings
const getCertifications = (ratingShort: string): string[] => {
	switch (ratingShort) {
		case 'OBS':
			return [];
		case 'S1':
			return ['DEL', 'S-GND']; // Updated per your requirements
		case 'S2':
			return ['DEL', 'S-GND', 'A-GND', 'S-TWR', 'A-TWR'];
		case 'S3':
			return ['DEL', 'S-GND', 'A-GND', 'S-TWR', 'A-TWR', 'APR'];
		case 'C1':
		case 'C3':
		case 'I1':
		case 'I3':
		case 'SUP':
			return ['DEL', 'S-GND', 'A-GND', 'S-TWR', 'A-TWR', 'APR', 'CTR'];
		default:
			return [];
	}
};

export const GET: RequestHandler = async ({ platform, request }) => {
	if (!platform?.env?.DB) {
		throw error(500, 'Database not available');
	}

	const db = drizzle(platform.env.DB);

	try {
		console.log('Starting membership sync process...');

		// Step 1: Get users who will be promoted (BEFORE promoting them)
		const usersToPromote = await db
			.select({
				cid: usersTable.cid,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName,
				membership: usersTable.membership
			})
			.from(usersTable)
			.where(
				sql`EXISTS (
					SELECT 1 FROM ${rosterMembersTable} 
					WHERE ${rosterMembersTable.cid} = ${usersTable.cid}
				) AND ${usersTable.membership} != 'controller'`
			);

		console.log(`Found ${usersToPromote.length} users to promote to controller`);

		// Step 2: Promote users who are in the roster to controller
		// Using EXISTS subquery to avoid parameter limits
		const promotionResult = await db
			.update(usersTable)
			.set({ membership: 'controller' })
			.where(
				sql`EXISTS (
					SELECT 1 FROM ${rosterMembersTable} 
					WHERE ${rosterMembersTable.cid} = ${usersTable.cid}
				) AND ${usersTable.membership} != 'controller'`
			);

		// Step 3: Demote controllers who are no longer in the roster
		const demotionResult = await db
			.update(usersTable)
			.set({ membership: 'community' })
			.where(
				sql`NOT EXISTS (
					SELECT 1 FROM ${rosterMembersTable} 
					WHERE ${rosterMembersTable.cid} = ${usersTable.cid}
				) AND ${usersTable.membership} = 'controller'`
			);

		// Get counts for reporting
		const [{ count: rosterSize }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(rosterMembersTable);

		const [{ count: currentControllers }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(usersTable)
			.where(eq(usersTable.membership, 'controller'));

		// Get newly promoted users (those in roster who are now controllers)
		const promotedUsers = await db
			.select({
				cid: usersTable.cid,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName
			})
			.from(usersTable)
			.where(
				sql`EXISTS (
					SELECT 1 FROM ${rosterMembersTable} 
					WHERE ${rosterMembersTable.cid} = ${usersTable.cid}
				) AND ${usersTable.membership} = 'controller'`
			);

		const promotedCount = promotedUsers.length;

		// Get users who were demoted (community members not in roster)
		const demotedUsers = await db
			.select({
				cid: usersTable.cid,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName
			})
			.from(usersTable)
			.where(
				sql`NOT EXISTS (
					SELECT 1 FROM ${rosterMembersTable} 
					WHERE ${rosterMembersTable.cid} = ${usersTable.cid}
				) AND ${usersTable.membership} = 'community'`
			);

		// Note: This count includes users who were already community, not just newly demoted
		// But it gives us a good overview of the current state
		const demotedCount = demotedUsers.length;

		console.log(`Roster contains ${rosterSize} members`);
		console.log(`${currentControllers} users now have controller membership`);
		console.log(`${promotedCount} total users with controller membership match roster`);
		console.log(`${demotedCount} community users are not in roster`);

		// Step 4: Assign certificates to NEWLY promoted controllers only
		console.log('Starting certificate assignment for newly promoted controllers...');

		if (usersToPromote.length === 0) {
			console.log('No new controllers to process certificates for');
		}

		// Get auth and user data for the newly promoted users only
		const newControllerCids = usersToPromote.map((u) => u.cid);
		const newControllersWithAuth =
			newControllerCids.length > 0
				? await db
						.select({
							user_id: usersTable.id,
							cid: authUsersTable.cid,
							vatsimData: authUsersTable.vatsimData
						})
						.from(authUsersTable)
						.innerJoin(usersTable, eq(authUsersTable.cid, usersTable.cid))
						.where(
							sql`${authUsersTable.cid} IN (${sql.join(
								newControllerCids.map((cid) => sql`${cid}`),
								sql`, `
							)})`
						)
				: [];

		console.log(`Found ${newControllersWithAuth.length} newly promoted controllers with auth data`);

		let certificatesAssigned = 0;
		let usersProcessed = 0;

		// Process only newly promoted controllers
		for (const newController of newControllersWithAuth) {
			try {
				// Find the user data for this CID
				const userData = usersToPromote.find((u) => u.cid === newController.cid);
				if (!userData) continue;

				// Parse VATSIM data to get rating
				const vatsimData =
					typeof newController.vatsimData === 'string'
						? JSON.parse(newController.vatsimData)
						: newController.vatsimData;

				const rating = vatsimData?.vatsim?.rating?.short;
				if (!rating) {
					console.log(
						`No rating found for newly promoted controller ${userData.firstName} ${userData.lastName} (${newController.cid})`
					);
					continue;
				}

				// Get appropriate certificates for their rating
				const requiredCertificates = getCertifications(rating);

				// Get existing certificates for this user
				const existingCerts = await db
					.select({ certification: controllerCertificationsTable.certification })
					.from(controllerCertificationsTable)
					.where(eq(controllerCertificationsTable.user_id, newController.user_id));

				const existingCertNames = existingCerts.map((c) => c.certification);

				// Find missing certificates
				const missingCertificates = requiredCertificates.filter(
					(cert) => !existingCertNames.includes(cert)
				);

				if (missingCertificates.length > 0) {
					console.log(
						`Adding ${missingCertificates.length} certificates to NEWLY promoted controller ${userData.firstName} ${userData.lastName} (${rating}): ${missingCertificates.join(', ')}`
					);

					// Insert only the missing certificates
					for (const cert of missingCertificates) {
						await db.insert(controllerCertificationsTable).values({
							user_id: newController.user_id,
							certification: cert,
							status: 'certified',
							created_at: new Date(),
							last_synced_at: new Date()
						});

						certificatesAssigned++;
					}
				} else {
					console.log(
						`Newly promoted controller ${userData.firstName} ${userData.lastName} already has all required certificates for ${rating}`
					);
				}

				usersProcessed++;
			} catch (parseError) {
				console.error(
					`Error processing newly promoted controller ${newController.cid}:`,
					parseError
				);
			}
		}

		// Get final membership counts for reporting
		const membershipCounts = await db
			.select({
				membership: usersTable.membership,
				count: sql<number>`count(*)`
			})
			.from(usersTable)
			.groupBy(usersTable.membership);

		console.log(
			`Certificate assignment completed: ${certificatesAssigned} certificates assigned to ${usersProcessed} controllers`
		);

		const results = {
			success: true,
			rosterSize: rosterSize,
			currentControllers: currentControllers,
			usersInRoster: promotedCount,
			communityNotInRoster: demotedCount,
			certificatesAssigned: certificatesAssigned,
			controllersProcessed: usersProcessed,
			finalCounts: Object.fromEntries(membershipCounts.map((row) => [row.membership, row.count])),
			timestamp: new Date().toISOString()
		};

		console.log('Membership sync completed:', results);

		return json(results);
	} catch (err) {
		console.error('Error during membership sync:', err);
		throw error(
			500,
			`Membership sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};
