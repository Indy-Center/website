import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import {
	validateSessionToken,
	deleteSessionTokenCookie,
	setSessionTokenCookie
} from '$lib/server/session';
import { authUsersTable } from '$lib/db/schema';
import type { VatsimUserData } from '$lib/server/vatsimConnectClient';

export const handle = sequence(dbHandle, authHandle, adminProtectedRouteHandle);

async function dbHandle({ event, resolve }: Parameters<Handle>[0]) {
	event.locals.db = drizzle(event.platform?.env.DB as D1Database);

	return await resolve(event);
}

// Handle session authentication (no redirects)
async function authHandle({ event, resolve }: Parameters<Handle>[0]) {
	const token = event.cookies.get('session');
	if (!token) {
		return await resolve(event);
	}

	const { user, session } = await validateSessionToken(token, event.locals.db);
	if (!session) {
		deleteSessionTokenCookie(event);
		return await resolve(event);
	}

	setSessionTokenCookie(event, token, session.expiresAt);

	event.locals.user = user;

	// Retrieve VATSIM Data for User
	const [userVatsimData] = await event.locals.db
		.select()
		.from(authUsersTable)
		.where(eq(authUsersTable.userId, user.id));

	if (userVatsimData) {
		event.locals.userVatsimData = userVatsimData.vatsimData as VatsimUserData;
	}

	event.locals.session = session;

	return await resolve(event);
}

async function adminProtectedRouteHandle({ event, resolve }: Parameters<Handle>[0]) {
	const { user } = event.locals;
	const routeId = event.route?.id;

	if (routeId && routeId.includes('(admin)') && !user?.isAdmin) {
		throw redirect(302, '/');
	}

	return await resolve(event);
}
