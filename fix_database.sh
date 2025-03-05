#!/bin/bash

echo "Fixing database schema and sample data..."

# Run the SQL script to fix the database schema
echo "Running fix_database.sql..."
npx supabase db execute --file fix_database.sql

# Run the sample data script again to ensure data is properly inserted
echo "Running sample_data.sql..."
npx supabase db execute --file sample_data.sql

echo "Database fixes applied. Please restart your application." 