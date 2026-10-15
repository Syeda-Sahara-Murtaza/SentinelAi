CREATE TABLE `sentinel_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`full_name` text DEFAULT '' NOT NULL,
	`analysis_language` text DEFAULT 'auto' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sentinel_scans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL,
	`result` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sentinel_scans_user_created` ON `sentinel_scans` (`user_id`,`created_at`);