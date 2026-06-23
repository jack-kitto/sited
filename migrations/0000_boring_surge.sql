CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`site_id` text NOT NULL,
	`clock_in_at` integer NOT NULL,
	`clock_in_lat` real NOT NULL,
	`clock_in_lng` real NOT NULL,
	`clock_in_accuracy` real NOT NULL,
	`clock_in_distance_m` real NOT NULL,
	`clock_in_device` text NOT NULL,
	`clock_out_at` integer,
	`clock_out_lat` real,
	`clock_out_lng` real,
	`clock_out_accuracy` real,
	`clock_out_distance_m` real,
	`clock_out_device` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius_m` integer DEFAULT 100 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pin_hash` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
