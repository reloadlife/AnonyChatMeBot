CREATE TABLE `blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blocker_user_id` integer NOT NULL,
	`sender_telegram_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`blocker_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` integer NOT NULL,
	`reporter_user_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `notification_message_id` integer;--> statement-breakpoint
ALTER TABLE `messages` ADD `read_at` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `reply_to_id` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `receiving_messages` integer DEFAULT true NOT NULL;