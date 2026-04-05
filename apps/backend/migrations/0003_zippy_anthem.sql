CREATE UNIQUE INDEX `blocks_unique` ON `blocks` (`blocker_user_id`,`sender_telegram_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reports_unique` ON `reports` (`message_id`,`reporter_user_id`);