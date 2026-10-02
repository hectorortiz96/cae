ALTER DATABASE `local` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `report` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `user` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure report.received exists and is non-null with false default (MySQL boolean as TINYINT(1)).
SET @received_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'report'
      AND column_name = 'received'
);
SET @received_add_sql := IF(
    @received_exists = 0,
    'ALTER TABLE `report` ADD COLUMN `received` TINYINT(1) NULL DEFAULT 0',
    'SELECT 1'
);
PREPARE stmt_received_add FROM @received_add_sql;
EXECUTE stmt_received_add;
DEALLOCATE PREPARE stmt_received_add;

UPDATE `report` SET `received` = 0 WHERE `received` IS NULL;
ALTER TABLE `report` MODIFY COLUMN `received` TINYINT(1) NOT NULL DEFAULT 0;
