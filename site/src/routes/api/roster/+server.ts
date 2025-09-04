import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { controllerCertificationsTable, rosterMembersTable, usersTable } from '$lib/db/schema';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform }) => {
	const db = drizzle(platform?.env?.DB!);

	// Get all roster members
	const roster = await db
		.select({
			cid: rosterMembersTable.cid,
			first_name: rosterMembersTable.first_name,
			last_name: rosterMembersTable.last_name,
			facility: rosterMembersTable.facility,
			rating: rosterMembersTable.rating,
			rating_short: rosterMembersTable.rating_short,
			vatusa_created_at: rosterMembersTable.vatusa_created_at,
			vatusa_updated_at: rosterMembersTable.vatusa_updated_at,
			facility_joined_at: rosterMembersTable.facility_joined_at,
			last_activity_at: rosterMembersTable.last_activity_at,
			name_privacy: rosterMembersTable.name_privacy,
			promotion_eligible: rosterMembersTable.promotion_eligible,
			is_mentor: rosterMembersTable.is_mentor,
			is_instructor: rosterMembersTable.is_instructor,
			last_promoted_at: rosterMembersTable.last_promoted_at,
			discord_id: rosterMembersTable.discord_id,
			roles: rosterMembersTable.roles
		})
		.from(rosterMembersTable);

	// Get all certifications with user CID mapping
	const certifications = await db
		.select({
			cid: usersTable.cid,
			certification: controllerCertificationsTable.certification,
			status: controllerCertificationsTable.status,
			created_at: controllerCertificationsTable.created_at,
			last_synced_at: controllerCertificationsTable.last_synced_at
		})
		.from(controllerCertificationsTable)
		.innerJoin(usersTable, eq(controllerCertificationsTable.user_id, usersTable.id));

	// Group certifications by CID
	const certsByMember = certifications.reduce((acc: Record<string, any[]>, cert) => {
		if (!acc[cert.cid]) acc[cert.cid] = [];
		acc[cert.cid].push(cert);
		return acc;
	}, {});

	// Add certifications to each roster member
	const processedRoster = roster.map((member) => ({
		...member,
		roles: JSON.parse(member.roles || '[]'),
		certifications: certsByMember[member.cid] || []
	}));

	return json({ roster: processedRoster });
};
