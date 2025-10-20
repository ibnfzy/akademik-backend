-- Migration: create app_settings table and seed semester enforcement setting

CREATE TABLE IF NOT EXISTS app_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_app_settings_key (`key`)
);

INSERT INTO app_settings (`key`, `value`)
VALUES ("semester_enforcement_mode", "relaxed")
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
