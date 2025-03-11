# Database Migrations

This directory contains database migration files for maintaining database schema changes over time.

## Migration File Format

Each migration file should be named in the format: `YYYYMMDD-name-of-migration.js` (e.g., `20240225-add-user-status.js`).

## Migration File Template

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migration operations to perform (add columns, tables, etc.)
    // Example: await queryInterface.addColumn('Users', 'status', { type: Sequelize.STRING });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback operations (remove columns, tables, etc.)
    // Example: await queryInterface.removeColumn('Users', 'status');
  }
};
```

## Running Migrations

Migrations will automatically run when the server starts in development mode. 

You can also run migrations manually with the Sequelize CLI:

```bash
npx sequelize-cli db:migrate          # Run all pending migrations
npx sequelize-cli db:migrate:undo     # Undo the most recent migration
```

## Creating a New Migration

To create a new migration file manually:

1. Create a new file in this directory with the format: `YYYYMMDD-name-of-migration.js`
2. Copy the template above and implement the migration logic

Or use the Sequelize CLI to generate a migration file:

```bash
npx sequelize-cli migration:generate --name add-column-to-table
```