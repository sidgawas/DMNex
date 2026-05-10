---
description: "Use when creating or modifying JPA entities in dmnex-modeller-service. Enforces audit fields on every entity and requires matching Liquibase scripts for new entities."
applyTo:
  - "src/main/java/**/*Entity.java"
  - "src/main/java/**/entity/**/*.java"
---

# JPA Entity Guidelines

## Overview

Keep JPA entities auditable, consistent, and always backed by Liquibase schema changes.

## Core Rules

### 1. Every JPA entity must extend `AuditableEntity`
All JPA entities must extend the shared `AuditableEntity` base class so the following audit and soft-delete fields are inherited consistently:
- `isDeleted`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

Keep these fields defined only in `AuditableEntity` instead of duplicating them in each entity.

### 2. Add Liquibase scripts for every new JPA entity
Whenever a new JPA entity is added, create the matching Liquibase changeset(s) in the database changelog structure and update the main changelog include path as needed.

The schema change must cover:
- table creation for the new entity
- audit and soft-delete columns
- any required constraints, indexes, defaults, or foreign keys

Do not add a new entity without the corresponding database migration.

### 3. Keep entity fields aligned with schema changes
When an entity changes, update the Liquibase scripts in the same change so the Java model and database schema stay in sync.

### 4. Place the shared base class in the entity package
Create `AuditableEntity` as a mapped superclass under `src/main/java/com/github/sidgawas/dmnex/modeller_service/entity/base` unless the package structure later introduces a more specific shared base package.

## Good Defaults

- Keep entity classes focused on persistence concerns and inherit audit fields from `AuditableEntity`
- Make soft-delete behavior explicit through `isDeleted` and `deletedAt`
- Ensure audit columns are present in every new table

## When to Apply

Apply these rules whenever you add or modify:
- JPA entity classes
- audit fields on persistence models
- Liquibase changelog files for new tables or columns
