import { error, fail, redirect } from '@sveltejs/kit';
import { sql, eq } from 'drizzle-orm';
import { 
	usersTable, 
	rosterMembersTable, 
	controllerCertificationsTable,
	authUsersTable,
	userSessionsTable 
} from '$lib/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

const userEditSchema = z.object({
	firstName: z.string().min(1, 'First name is required').max(100),
	lastName: z.string().min(1, 'Last name is required').max(100),
	email: z.string().email('Invalid email address').max(255),
	preferredName: z.string().max(100).optional(),
	pronouns: z.string().max(50).optional(),
	membership: z.enum(['basic', 'community', 'controller'], {
		errorMap: () => ({ message: 'Invalid membership type' })
	}),
	isAdmin: z.boolean().optional(),
	certificates: z.array(z.object({
		certification: z.string(),
		status: z.enum(['certified', 'in_progress', 'expired'])
	})).optional()
});

export const load: PageServerLoad = async ({ locals, params }) => {

	const db = locals.db;
	const userId = params.id;

	try {
		// Get user details
		const [user] = await db
			.select({
				id: usersTable.id,
				cid: usersTable.cid,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName,
				email: usersTable.email,
				preferredName: usersTable.preferredName,
				pronouns: usersTable.pronouns,
				membership: usersTable.membership,
				isAdmin: usersTable.isAdmin
			})
			.from(usersTable)
			.where(eq(usersTable.id, userId));

		if (!user) {
			throw error(404, 'User not found');
		}

		// Get VATSIM/roster data
		const [rosterData] = await db
			.select()
			.from(rosterMembersTable)
			.where(eq(rosterMembersTable.cid, user.cid));

		// Get auth data
		const [authData] = await db
			.select({
				userId: authUsersTable.userId,
				vatsimData: authUsersTable.vatsimData,
				createdAt: authUsersTable.createdAt,
				updatedAt: authUsersTable.updatedAt
			})
			.from(authUsersTable)
			.where(eq(authUsersTable.cid, user.cid));

		// Get certifications
		const certifications = await db
			.select()
			.from(controllerCertificationsTable)
			.where(eq(controllerCertificationsTable.user_id, user.id));

		// Get user sessions (last 10)
		const sessions = await db
			.select({
				id: userSessionsTable.id,
				expiresAt: userSessionsTable.expiresAt
			})
			.from(userSessionsTable)
			.where(eq(userSessionsTable.userId, user.id))
			.orderBy(sql`${userSessionsTable.expiresAt} DESC`)
			.limit(10);

		// Initialize the form with user data
		const form = await superValidate({
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			preferredName: user.preferredName || '',
			pronouns: user.pronouns || '',
			membership: user.membership,
			isAdmin: user.isAdmin,
			certificates: certifications.map(cert => ({
				certification: cert.certification,
				status: cert.status
			}))
		}, zod(userEditSchema));

		return {
			user,
			rosterData,
			authData,
			certifications,
			sessions,
			form
		};
	} catch (err) {
		console.error('Error loading user:', err);
		throw error(500, 'Failed to load user data');
	}
};

export const actions: Actions = {
	updateUser: async ({ locals, params, request }) => {

		const form = await superValidate(request, zod(userEditSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const db = locals.db;
		const userId = params.id;

		try {
			// Get the current user for certificate operations
			const [currentUser] = await db
				.select({ id: usersTable.id })
				.from(usersTable)
				.where(eq(usersTable.id, userId));

			if (!currentUser) {
				return fail(404, { form });
			}

			// Update user data
			await db
				.update(usersTable)
				.set({
					firstName: form.data.firstName,
					lastName: form.data.lastName,
					email: form.data.email,
					preferredName: form.data.preferredName || null,
					pronouns: form.data.pronouns || null,
					membership: form.data.membership,
					isAdmin: form.data.isAdmin || false
				})
				.where(eq(usersTable.id, userId));

			// Handle certificate updates if provided
			if (form.data.certificates && form.data.certificates.length > 0) {
				// Delete existing certificates for this user
				await db
					.delete(controllerCertificationsTable)
					.where(eq(controllerCertificationsTable.user_id, currentUser.id));

				// Insert updated certificates
				const certificateInserts = form.data.certificates.map(cert =>
					db.insert(controllerCertificationsTable)
						.values({
							user_id: currentUser.id,
							certification: cert.certification,
							status: cert.status,
							created_at: new Date(),
							last_synced_at: new Date()
						})
				);

				await db.batch(certificateInserts);
				console.log(`Updated ${form.data.certificates.length} certificates for user ${userId}`);
			}

			return { form };
		} catch (err) {
			console.error('Error updating user:', err);
			return fail(500, { form });
		}
	},

	deleteUser: async ({ locals, params }) => {

		const db = locals.db;
		const userId = params.id;

		try {
			// Get user CID first
			const [user] = await db
				.select({ cid: usersTable.cid })
				.from(usersTable)
				.where(eq(usersTable.id, userId));

			if (!user) {
				return fail(404, { error: 'User not found' });
			}

			// Delete in proper order (foreign key constraints)
			// 1. User sessions
			await db
				.delete(userSessionsTable)
				.where(eq(userSessionsTable.userId, userId));

			// 2. Auth users
			await db
				.delete(authUsersTable)
				.where(eq(authUsersTable.cid, user.cid));

			// 3. Controller certifications
			await db
				.delete(controllerCertificationsTable)
				.where(eq(controllerCertificationsTable.user_id, userId));

			// 4. Finally, the user record
			await db
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			throw redirect(302, '/admin/users');
		} catch (err) {
			if (err instanceof Response) {
				throw err; // Re-throw redirect
			}
			console.error('Error deleting user:', err);
			return fail(500, {
				error: 'Failed to delete user'
			});
		}
	}
};