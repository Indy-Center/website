import { error } from '@sveltejs/kit';
import { sql, count, desc } from 'drizzle-orm';
import { 
	usersTable, 
	rosterMembersTable, 
	controllerCertificationsTable,
	userSessionsTable 
} from '$lib/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {

	const db = locals.db;

	try {
		// Get user statistics
		const [totalUsersResult] = await db
			.select({ count: count() })
			.from(usersTable);

		const [activeControllersResult] = await db
			.select({ count: count() })
			.from(usersTable)
			.where(sql`${usersTable.membership} = 'controller'`);

		const [pendingCertificationsResult] = await db
			.select({ count: count() })
			.from(controllerCertificationsTable)
			.where(sql`${controllerCertificationsTable.status} = 'in_progress'`);

		const [totalSessionsResult] = await db
			.select({ count: count() })
			.from(userSessionsTable);

		// Get recent users (last 10, ordered by creation date)
		const recentUsers = await db
			.select({
				id: usersTable.id,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName,
				cid: usersTable.cid,
				email: usersTable.email,
				membership: usersTable.membership,
				isAdmin: usersTable.isAdmin
			})
			.from(usersTable)
			.orderBy(desc(usersTable.id))
			.limit(10);

		// Get pending certifications with user details
		const pendingCertifications = await db
			.select({
				user_id: controllerCertificationsTable.user_id,
				cid: usersTable.cid,
				certification: controllerCertificationsTable.certification,
				status: controllerCertificationsTable.status,
				createdAt: controllerCertificationsTable.created_at,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName
			})
			.from(controllerCertificationsTable)
			.leftJoin(usersTable, sql`${controllerCertificationsTable.user_id} = ${usersTable.id}`)
			.where(sql`${controllerCertificationsTable.status} = 'in_progress'`)
			.orderBy(desc(controllerCertificationsTable.created_at))
			.limit(10);

		// Get roster members who don't have user accounts yet
		const unassignedRosterMembers = await db
			.select({
				cid: rosterMembersTable.cid,
				firstName: rosterMembersTable.first_name,
				lastName: rosterMembersTable.last_name,
				rating: rosterMembersTable.rating_short,
				facility: rosterMembersTable.facility,
				facilityJoinedAt: rosterMembersTable.facility_joined_at
			})
			.from(rosterMembersTable)
			.where(
				sql`NOT EXISTS (
					SELECT 1 FROM ${usersTable} 
					WHERE ${usersTable.cid} = ${rosterMembersTable.cid}
				)`
			)
			.orderBy(desc(rosterMembersTable.facility_joined_at))
			.limit(10);

		return {
			stats: {
				totalUsers: totalUsersResult.count,
				activeControllers: activeControllersResult.count,
				pendingCertifications: pendingCertificationsResult.count,
				totalSessions: totalSessionsResult.count
			},
			recentUsers: recentUsers.map(user => ({
				...user,
				lastActivity: 'Recently' // We don't have last activity tracking yet, so placeholder
			})),
			pendingCertifications: pendingCertifications.map(cert => ({
				cid: cert.cid,
				name: cert.firstName && cert.lastName 
					? `${cert.firstName} ${cert.lastName}` 
					: 'Unknown User',
				certification: cert.certification,
				status: cert.status,
				createdAt: cert.createdAt
			})),
			unassignedRosterMembers: unassignedRosterMembers.map(member => ({
				cid: member.cid,
				name: `${member.firstName} ${member.lastName}`,
				rating: member.rating,
				facility: member.facility,
				joinedAt: member.facilityJoinedAt
			}))
		};
	} catch (err) {
		console.error('Error loading admin data:', err);
		throw error(500, 'Failed to load admin data');
	}
};