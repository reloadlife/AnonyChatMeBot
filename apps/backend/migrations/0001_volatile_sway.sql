ALTER TABLE `users` ADD `display_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_step` integer DEFAULT 1 NOT NULL;