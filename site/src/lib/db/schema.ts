import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const rosterMembersTable = sqliteTable('roster_members', {
	cid: text('cid').primaryKey(),
	first_name: text('first_name').notNull(),
	last_name: text('last_name').notNull(),
	email: text('email'),
	facility: text('facility').notNull(),
	rating: integer('rating').notNull(),
	rating_short: text('rating_short').notNull(),
	vatusa_created_at: text('vatusa_created_at'),
	vatusa_updated_at: text('vatusa_updated_at'),
	facility_joined_at: text('facility_joined_at'),
	last_activity_at: text('last_activity_at'),
	name_privacy: integer('name_privacy', { mode: 'boolean' }).default(false),
	promotion_eligible: integer('promotion_eligible', { mode: 'boolean' }).default(false),
	is_mentor: integer('is_mentor', { mode: 'boolean' }).default(false),
	is_instructor: integer('is_instructor', { mode: 'boolean' }).default(false),
	last_promoted_at: text('last_promoted_at'),
	discord_id: integer('discord_id'),
	roles: text('roles'), // JSON string of roles array
	raw_data: text('raw_data'), // Complete original JSON from VATUSA API
	updated_at: text('updated_at')
});

export const controllerCertificationsTable = sqliteTable('controller_certifications', {
	user_id: text('user_id').notNull(),
	certification: text('certification').notNull(),
	status: text('status').notNull().default('in_progress'),
	created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
	last_synced_at: integer('last_synced_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
});

// This data comes from VATSIM Connect and is updated on login/created on registration
// This ties a user in our system to a CID
export const authUsersTable = sqliteTable('auth_users', {
	userId: text('user_id').notNull(),
	cid: text('cid').notNull(),
	vatsimData: text('vatsim_data', { mode: 'json' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
});

// This is data that originally comes from VATSIM Connect, but is overridable by the User
export const usersTable = sqliteTable('users', {
	id: text('id').primaryKey(),
	cid: text('cid').notNull(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull(),
	preferredName: text('preferred_name'),
	pronouns: text('pronouns'),
	membership: text('membership', { enum: ['basic', 'community', 'controller'] }).notNull(),
	isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull()
});

export const userSessionsTable = sqliteTable('user_sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});
