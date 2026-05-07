#!/bin/bash
# Sync Prisma schema to database (only runs if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo "Syncing Prisma schema to database..."
  npx prisma db push --skip-generate 2>&1
else
  echo "No DATABASE_URL found, skipping db push (expected locally)"
fi