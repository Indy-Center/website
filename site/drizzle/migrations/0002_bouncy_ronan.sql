PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_controller_certifications` (
	`user_id` text NOT NULL,
	`certification` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`last_synced_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_controller_certifications`("user_id", "certification", "status", "created_at", "last_synced_at") SELECT "user_id", "certification", "status", "created_at", "last_synced_at" FROM `controller_certifications`;--> statement-breakpoint
DROP TABLE `controller_certifications`;--> statement-breakpoint
ALTER TABLE `__new_controller_certifications` RENAME TO `controller_certifications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;