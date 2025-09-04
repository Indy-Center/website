import type { RequestEvent } from '@sveltejs/kit';
import { decodeIdToken, OAuth2Tokens } from 'arctic';
import { client } from '$lib/server/oauth';
import { authUsersTable, usersTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { env } from '$env/dynamic/private';
import { fetchUserData } from '$lib/server/vatsimConnectClient';

export async function GET(event: RequestEvent): Promise<Response> {
	// Extract query parameters
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('connect_oauth_state');

	// Validate parameters
	if (!code || !state || !storedState) {
		console.error('Missing required query parameters or cookies', { code, state, storedState });
		return new Response(JSON.stringify({ error: 'Invalid request' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (state !== storedState) {
		console.error('State mismatch', { received: state, expected: storedState });
		return new Response(JSON.stringify({ error: 'State mismatch' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let tokens: OAuth2Tokens;
	try {
		// Exchange the authorization code for tokens
		tokens = await client.validateAuthorizationCode(
			`${env.CONNECT_BASE_URL!}/oauth/token`,
			code,
			null
		);
	} catch (error) {
		console.error('Error during token exchange', error);
		return new Response(JSON.stringify({ error: 'Failed to validate authorization code' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Fetch user details
	const userDetails = await fetchUserData(tokens.accessToken());
	if (!userDetails) {
		return new Response(JSON.stringify({ error: 'Failed to fetch user details' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Decode the ID token to extract claims
	let claims;
	try {
		claims = decodeIdToken(tokens.accessToken());
	} catch (error) {
		console.error('Error decoding ID token', error);
		return new Response(JSON.stringify({ error: 'Invalid ID token' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Update or insert auth user data (source of truth for VATSIM data)
	const authUsers = await event.locals.db
		.select()
		.from(authUsersTable)
		.where(eq(authUsersTable.cid, userDetails.cid));

	const userId = crypto.randomUUID();

	if (authUsers.length === 0) {
		// Insert new auth user with full VATSIM data
		await event.locals.db.insert(authUsersTable).values({
			userId: userId,
			cid: userDetails.cid,
			vatsimData: userDetails,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	} else {
		// Update existing auth user with fresh VATSIM data
		await event.locals.db
			.update(authUsersTable)
			.set({
				vatsimData: userDetails,
				updatedAt: new Date()
			})
			.where(eq(authUsersTable.cid, userDetails.cid));
	}

	// Update or insert user profile data
	const existingUsers = await event.locals.db
		.select()
		.from(usersTable)
		.where(eq(usersTable.cid, userDetails.cid));

	if (existingUsers.length === 0) {
		// Create new user profile
		await event.locals.db.insert(usersTable).values({
			id: authUsers.length === 0 ? userId : authUsers[0].userId,
			cid: userDetails.cid,
			firstName: userDetails.personal.name_first,
			lastName: userDetails.personal.name_last,
			email: userDetails.personal.email,
			preferredName: null,
			pronouns: null,
			membership: 'basic' // Default membership level
		});
	} else {
		// Update existing user with fresh name data (in case they changed it in VATSIM)
		await event.locals.db
			.update(usersTable)
			.set({
				firstName: userDetails.personal.name_first,
				lastName: userDetails.personal.name_last,
				email: userDetails.personal.email
			})
			.where(eq(usersTable.cid, userDetails.cid));
	}

	const sessionToken = generateSessionToken();
	// Get the user ID to create session (either new or existing)
	const finalUserId = authUsers.length === 0 ? userId : authUsers[0].userId;
	const session = await createSession(sessionToken, finalUserId, event.locals.db);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
