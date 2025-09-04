CREATE TABLE `auth_users` (
	`user_id` text NOT NULL,
	`cid` text NOT NULL,
	`vatsim_data` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `controller_certifications` (
	`cid` text NOT NULL,
	`certification` text NOT NULL,
	`status` text DEFAULT 'IN_PROGRESS' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`last_synced_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `roster_members` (
	`cid` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`facility` text NOT NULL,
	`rating` integer NOT NULL,
	`rating_short` text NOT NULL,
	`vatusa_created_at` text,
	`vatusa_updated_at` text,
	`facility_joined_at` text,
	`last_activity_at` text,
	`name_privacy` integer DEFAULT false,
	`promotion_eligible` integer DEFAULT false,
	`is_mentor` integer DEFAULT false,
	`is_instructor` integer DEFAULT false,
	`last_promoted_at` text,
	`discord_id` integer,
	`roles` text,
	`raw_data` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`preferred_name` text,
	`pronouns` text,
	`membership` text NOT NULL
);
