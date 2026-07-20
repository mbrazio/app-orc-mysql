-- ====================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS MYSQL (HOSTINGER)
-- PROJETO: FinanceFlow (app-orc-mysql)
-- ====================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BRL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(100) NOT NULL,
  `color` VARCHAR(50) NOT NULL,
  `budget_limit` DECIMAL(12, 2) DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_user_id` (`user_id`),
  KEY `idx_categories_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `category_id` VARCHAR(36) DEFAULT NULL,
  `date` DATE NOT NULL,
  `is_recurring` TINYINT(1) NOT NULL DEFAULT 0,
  `recurrence_interval` ENUM('daily', 'weekly', 'monthly', 'yearly') DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_user_id` (`user_id`),
  KEY `idx_transactions_category_id` (`category_id`),
  KEY `idx_transactions_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goals` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `target_amount` DECIMAL(12, 2) NOT NULL,
  `current_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `deadline` DATE DEFAULT NULL,
  `color` VARCHAR(50) NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goals_user_id` (`user_id`),
  KEY `idx_goals_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goal_contributions` (
  `id` VARCHAR(36) NOT NULL,
  `goal_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `date` DATE NOT NULL,
  `note` TEXT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goal_contributions_goal_id` (`goal_id`),
  KEY `idx_goal_contributions_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_goal_contributions_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
