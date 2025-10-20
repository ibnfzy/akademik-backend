-- Migration: add semesters table and connect grades/attendance

-- 1. Create semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tahunAjaran VARCHAR(20) NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  tanggalMulai DATE NOT NULL,
  tanggalSelesai DATE NOT NULL,
  jumlahHariBelajar INT UNSIGNED NOT NULL DEFAULT 0,
  catatan TEXT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_semesters_tahun_semester (tahunAjaran, semester)
);

-- 2. Add semesterId column to grades and attendance tables
ALTER TABLE grades
  ADD COLUMN semesterId INT UNSIGNED NULL AFTER semester,
  ADD CONSTRAINT fk_grades_semesterId FOREIGN KEY (semesterId) REFERENCES semesters(id);

ALTER TABLE attendance
  ADD COLUMN semesterId INT UNSIGNED NULL AFTER semester,
  ADD CONSTRAINT fk_attendance_semesterId FOREIGN KEY (semesterId) REFERENCES semesters(id);

-- 3. Backfill semesterId based on existing tahunAjaran + semester combinations
--    (ensure all referenced semesters already exist in the semesters table before running)
UPDATE grades g
JOIN semesters s ON s.tahunAjaran = g.tahunAjaran AND s.semester = g.semester
SET g.semesterId = s.id
WHERE g.semesterId IS NULL;

UPDATE attendance a
JOIN semesters s ON s.tahunAjaran = a.tahunAjaran AND s.semester = a.semester
SET a.semesterId = s.id
WHERE a.semesterId IS NULL;

-- 4. (Optional) Drop legacy columns when frontend no longer requires them
-- ALTER TABLE grades DROP COLUMN tahunAjaran, DROP COLUMN semester;
-- ALTER TABLE attendance DROP COLUMN tahunAjaran, DROP COLUMN semester;
