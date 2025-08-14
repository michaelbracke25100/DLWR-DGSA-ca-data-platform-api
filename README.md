# How to start guide

## General - Quick start

1. Make sure to do **yarn** first to install dependencies.
2. Start the application locally (**yarn dev**)

## Project how-to

This project includes various scripts in `package.json` to automate common tasks:

**Development:**

- **`yarn dev`:** Removes any existing build output, rebuilds the project, and starts the application in development mode. This is the preferred command for continuous development.

**Building:**

- **`yarn build`:** Compiles TypeScript code using SWC and creates an optimized production-ready build in the `build` folder.

**Running:**

- **`yarn start`:** Starts the application using the compiled code in the `build` folder.

**Cleaning:**

- **`yarn remove_build`:** Deletes the `build` folder, removing any existing build output.

**Linting and Formatting:**

- **`yarn lint`:** Runs TypeScript type checking, ESLint code linting, and Prettier code formatting for consistent style and code health.
- **`yarn lint:types`:** Runs TypeScript type checking only.
- **`yarn lint:code`:** Runs ESLint code linting only.
- **`yarn lint:style`:** Checks for Prettier formatting issues.
- **`yarn format`:** Automatically formats code using Prettier.

**Database Migrations (TypeORM):**

- **`yarn migration-create <name>`:** Creates a new database migration file with the specified name.
- **`yarn migration-generate <name>`:** Generates a migration based on changes to entities and schema.
- **`yarn migration-run`:** Runs all pending migrations.
- **`yarn migration-show`:** Lists all applied migrations.
- **`yarn migration-revert`:** Reverts the last applied migration.

**Direct TypeORM Interaction:**

- **`yarn typeorm`:** Removes the build, rebuilds the project, and then runs the TypeORM command for direct interaction with TypeORM (e.g., for generating entities).
-

## Code styling

This project uses Google TypeScript Style (<https://github.com/google/gts>) for consistent code formatting and linting. This style guide promotes readability, maintainability, and adheres to widely used conventions in the TypeScript community.

We leverage the @google/gts package to enforce these styles. This includes automatic code formatting and linting checks during development. You can find the following helpful commands in the package.json:

lint: Runs linting and checks for formatting problems.
fix: Automatically fixes formatting and linting problems (if possible).
For a complete overview of the Google TypeScript Style Guide, please refer to the official documentation: <https://github.com/google/gts>

## Dump database

pg_dump --dbname=postgresql://username:password@hostname:5432/dbname > test.sql
