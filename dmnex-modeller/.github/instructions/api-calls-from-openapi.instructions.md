---
description: "Use when creating, updating, or refactoring frontend API call methods, service clients, or endpoint integrations in the dmnex-modeller web app. Requires deriving methods from the OpenAPI spec at http://localhost:8080/v3/api-docs, asking which endpoint set to target, and using axios only."
name: "OpenAPI-Driven Axios API Calls"
---
# API Call Method Guidelines

- Before creating or changing API call methods, inspect the OpenAPI document at `http://localhost:8080/v3/api-docs` and align method paths, parameters, and payload shapes with the spec.
- Always ask the user which endpoint set to target (for example by API tag, controller group, or functional area) before creating or updating API call methods.
- Use `axios` as the only HTTP client for API calls.
- Do not introduce or use `fetch`, `XMLHttpRequest`, or other HTTP client libraries for API method implementation.
- If the endpoint set is unclear or not provided, ask a clarifying question before implementing API method changes.

# Expected Behavior

- For API client work requests, first confirm the endpoint set.
- Then use the OpenAPI spec as the source of truth for endpoint details.
- Implement or update methods with axios-based request handling.
