#!/bin/bash
# Run this ONCE to add the new attendance columns.
# Usage: bash apply_attendance_migration.sh

PGPASSWORD=Yohji8088 psql -U skyther -d elv_db << 'SQL'
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS personal_remark    TEXT,
  ADD COLUMN IF NOT EXISTS assigned_by        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS assigned_by_name   VARCHAR(255);

\echo '✅ Columns added successfully.'
\d attendances
SQL
