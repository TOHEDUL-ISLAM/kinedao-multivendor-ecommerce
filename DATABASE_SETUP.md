# Database Setup Guide

This guide helps team members set up the database when cloning the repository.

## Initial Setup (First Time Only)

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment Variables

Copy the `.env.example` file in `apps/server/` to `.env` and update it with your database credentials:

```bash
cp apps/server/.env.example apps/server/.env
```

Make sure your `.env` file has a valid `DATABASE_URL`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kinedao"
```

### 3. Apply Database Migrations

Run the migration files to create all tables:

```bash
bun run db:migrate
```

This will apply all migration files from `packages/db/src/migrations/` to your database.

### 4. Seed the Database

Populate the database with initial data (categories, products, vendors, etc.):

```bash
bun run db:seed
```

This will create:
- 10 vendors
- 70+ categories (parent + child)
- 100+ products with images, options, and SKUs
- Campaigns
- Homepage content (testimonials, featured collections, Instagram posts)

### 5. Verify Setup

Check if the database was set up correctly:

```bash
bun run db:studio
```

This opens Drizzle Studio at `http://localhost:4983` where you can browse your database.

## Development Workflow

### Making Schema Changes

When you modify database schema files in `packages/db/src/schema/`:

1. **Generate a migration file**:
   ```bash
   bun run db:generate
   ```

2. **Review the migration** in `packages/db/src/migrations/`

3. **Apply the migration** to your local database:
   ```bash
   bun run db:migrate
   ```

4. **Commit the migration file** to git:
   ```bash
   git add packages/db/src/migrations/
   git commit -m "feat(db): add [description of schema change]"
   ```

### Quick Development Updates (Not Recommended for Production)

For rapid prototyping only, you can use:

```bash
bun run db:push
```

**Warning**: This directly modifies your database without creating migration files. Only use this for local experimentation. Always generate proper migrations before committing.

## Troubleshooting

### Database Already Exists Error

If you get "table already exists" errors, you may need to:

1. Drop your database and recreate it
2. Run migrations again

```bash
# Drop and recreate (Postgres example)
psql -U postgres -c "DROP DATABASE kinedao;"
psql -U postgres -c "CREATE DATABASE kinedao;"

# Run migrations
bun run db:migrate
bun run db:seed
```

### Migration Conflicts

If you have migration conflicts:

1. Pull the latest migrations from git
2. Apply them: `bun run db:migrate`
3. Generate your new migration: `bun run db:generate`

### Seed Script Errors

If the seed script fails, ensure:
- Your database is empty or run the seed script which clears existing data first
- Your `.env` file has the correct `DATABASE_URL`
- You've applied all migrations first

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun run db:push` | Push schema changes directly (dev only) |
| `bun run db:generate` | Generate migration files from schema |
| `bun run db:migrate` | Apply migration files to database |
| `bun run db:seed` | Populate database with sample data |
| `bun run db:studio` | Open Drizzle Studio GUI |

## Important Notes

- **Always commit migration files** to git
- **Never commit `.env` files** (they're in `.gitignore`)
- **Migration files are the source of truth** for production databases
- **Seed data is for development only** - production data comes from users
