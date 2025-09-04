import { error } from '@sveltejs/kit';
import { sql, count, desc, like, or } from 'drizzle-orm';
import { usersTable, rosterMembersTable, controllerCertificationsTable } from '$lib/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {

	const db = locals.db;

	// Get search and filter parameters
	const searchTerm = url.searchParams.get('search') || '';
	const membershipFilter = url.searchParams.get('membership') || 'all';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 25;
	const offset = (page - 1) * limit;

	try {
		// Build the base query conditions
		let whereCondition = sql`1=1`;

		if (searchTerm) {
			whereCondition = sql`${whereCondition} AND (
				${usersTable.firstName} LIKE ${`%${searchTerm}%`} OR
				${usersTable.lastName} LIKE ${`%${searchTerm}%`} OR
				${usersTable.cid} LIKE ${`%${searchTerm}%`} OR
				${usersTable.email} LIKE ${`%${searchTerm}%`}
			)`;
		}

		if (membershipFilter !== 'all') {
			whereCondition = sql`${whereCondition} AND ${usersTable.membership} = ${membershipFilter}`;
		}

		// Get total count for pagination
		const [{ count: totalCount }] = await db
			.select({ count: count() })
			.from(usersTable)
			.where(whereCondition);

		// Get users with pagination
		const users = await db
			.select({
				id: usersTable.id,
				cid: usersTable.cid,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName,
				email: usersTable.email,
				preferredName: usersTable.preferredName,
				pronouns: usersTable.pronouns,
				membership: usersTable.membership,
				isAdmin: usersTable.isAdmin,
				// Join with roster data for additional info
				rosterFirstName: rosterMembersTable.first_name,
				rosterLastName: rosterMembersTable.last_name,
				rating: rosterMembersTable.rating_short,
				facility: rosterMembersTable.facility,
				lastActivity: rosterMembersTable.last_activity_at
			})
			.from(usersTable)
			.leftJoin(rosterMembersTable, sql`${usersTable.cid} = ${rosterMembersTable.cid}`)
			.where(whereCondition)
			.orderBy(desc(usersTable.id))
			.limit(limit)
			.offset(offset);

		// Get certificates for all users in this page
		const userIds = users.map(u => u.id);
		const certificates = userIds.length > 0 ? await db
			.select({
				user_id: controllerCertificationsTable.user_id,
				certification: controllerCertificationsTable.certification,
				status: controllerCertificationsTable.status
			})
			.from(controllerCertificationsTable)
			.where(sql`${controllerCertificationsTable.user_id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`) 
			: [];

		// Group certificates by user_id
		const certsByUser = certificates.reduce((acc, cert) => {
			if (!acc[cert.user_id]) acc[cert.user_id] = [];
			acc[cert.user_id].push(cert);
			return acc;
		}, {} as Record<string, typeof certificates>);

		// Add certificates to user data
		const usersWithCerts = users.map(user => ({
			...user,
			certifications: certsByUser[user.id] || []
		}));

		const totalPages = Math.ceil(totalCount / limit);

		return {
			users: usersWithCerts,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1
			},
			filters: {
				searchTerm,
				membershipFilter
			}
		};
	} catch (err) {
		console.error('Error loading users:', err);
		throw error(500, 'Failed to load users');
	}
};