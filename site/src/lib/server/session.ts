import { userSessionsTable, usersTable } from '$lib/db/schema';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';

import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export function generateSessionToken(): string {
	return encodeBase32LowerCaseNoPadding(crypto.getRandomValues(new Uint8Array(20)));
}

export async function createSession(
	token: string,
	id: string,
	db: DrizzleD1Database
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session = {
		id: sessionId,
		userId: id,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};

	await db.insert(userSessionsTable).values({
		id: session.id,
		userId: session.userId,
		expiresAt: session.expiresAt
	});

	return session;
}

export async function validateSessionToken(
	token: string,
	db: DrizzleD1Database
): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const [row] = await db
		.select()
		.from(userSessionsTable)
		.where(eq(userSessionsTable.id, sessionId))
		.innerJoin(usersTable, eq(usersTable.id, userSessionsTable.userId));
	if (!row) {
		return { session: null, user: null };
	}

	const session = {
		id: row.user_sessions.id,
		userId: row.user_sessions.userId,
		expiresAt: row.user_sessions.expiresAt
	};

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(userSessionsTable).where(eq(userSessionsTable.id, sessionId));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

		await db
			.update(userSessionsTable)
			.set({
				expiresAt: session.expiresAt
			})
			.where(eq(userSessionsTable.id, sessionId));
	}

	return { session, user: row.users };
}

export async function invalidateSession(sessionId: string, db: DrizzleD1Database) {
	await db.delete(userSessionsTable).where(eq(userSessionsTable.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}

export type Session = {
	id: string;
	userId: string;
	expiresAt: Date;
};

export type User = {
	id: string;
	cid: string;
	firstName: string;
	lastName: string;
	preferredName: string | null;
	pronouns: string | null;
	membership: 'basic' | 'community' | 'controller' | 'admin';
	isAdmin: boolean;
};

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };
