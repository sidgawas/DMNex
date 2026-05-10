---
description: "Use when creating or refactoring Java services, controllers, or mappers. Enforces JUnit 5 coverage, Mockito-based dependency mocking for unit tests, Spring Boot integration tests for controllers, and mapper test coverage."
applyTo:
  - "src/main/java/**/*Service.java"
  - "src/main/java/**/*Controller.java"
  - "src/main/java/**/*Mapper.java"
  - "src/main/java/**/service/**/*.java"
  - "src/main/java/**/controller/**/*.java"
  - "src/main/java/**/mapper/**/*.java"
---

# Java Testing Guidelines

## Overview

Keep test coverage aligned with the production layer being changed:
- service and logic classes get JUnit 5 unit tests
- controllers get Spring Boot integration tests
- mappers get JUnit 5 mapper tests

## Core Rules

### 1. Write JUnit 5 unit tests for services and business logic
Any new or changed service class must have JUnit 5 tests.

Use unit tests when the class contains business logic or orchestration:
- mock all collaborators with Mockito
- test only the class under test
- verify behavior, branching, and failure paths
- keep the test fast and isolated from Spring unless Spring is required

### 2. Write Spring Boot integration tests for controllers
Any new or changed controller must have a Spring Boot integration test that exercises the API layer and service layer end to end.

Use the real controller and real service beans, but mock repository calls only:
- prefer `@SpringBootTest` with `@AutoConfigureMockMvc` or an equivalent HTTP-level setup
- mock repository dependencies with `@MockBean`
- do not mock the service layer in controller tests
- assert request mapping, validation, response status, and serialized payloads

### 3. Add tests for every mapper
Any new mapper must have a JUnit 5 test.

Prefer testing the generated mapper behavior directly:
- verify entity-to-response conversion
- verify request-to-entity conversion
- verify update mappings when present
- cover null and partial-field cases where relevant

### 4. Keep test style consistent
Follow the same package structure under `src/test/java` as the production code.

Recommended conventions:
- use descriptive test names that state the behavior under test
- keep setup minimal and explicit
- mock only dependencies, never the class under test
- prefer focused tests over large scenario bundles

## Good Defaults

- JUnit 5 is the default test framework for all new tests
- Mockito is the default mocking library for unit tests
- Controller tests should validate the API contract, not just internal method calls
- Mapper tests should fail if a field mapping is accidentally removed or renamed

## When to Apply

Apply these rules whenever you add or change:
- service classes
- business logic classes
- REST controllers
- MapStruct mappers
