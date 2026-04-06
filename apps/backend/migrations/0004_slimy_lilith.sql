PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_telegram_id` integer NOT NULL,
	`recipient_user_id` integer NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`media_type` text,
	`file_id` text,
	`delivered` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`notification_message_id` integer,
	`read_at` text,
	`reply_to_id` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "sender_telegram_id", "recipient_user_id", "content", "media_type", "file_id", "delivered", "deleted_at", "notification_message_id", "read_at", "reply_to_id", "created_at") SELECT "id", "sender_telegram_id", "recipient_user_id", "content", "media_type", "file_id", "delivered", "deleted_at", "notification_message_id", "read_at", "reply_to_id", "created_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;