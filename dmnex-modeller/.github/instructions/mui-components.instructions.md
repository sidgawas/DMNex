---
description: "Use when creating or refactoring React UI components. Enforces Material UI (MUI) component usage, discourages raw HTML layout primitives, and requires consulting the MUI MCP docs for MUI-specific questions."
name: "MUI Components Only"
applyTo: "**/*.{tsx,jsx}"
---
# MUI Components Guidelines

- Build UI with MUI components first (`Box`, `Container`, `Stack`, `Paper`, `Typography`, `Button`, etc.).
- Prefer MUI layout primitives over raw HTML layout wrappers for component structure.
- Use MUI `sx` and theme tokens for styling instead of ad-hoc CSS when practical.
- Avoid introducing new non-MUI UI component libraries unless explicitly requested.
- Keep native HTML elements only when required for semantics or third-party integration points.

# MUI Docs Requirement

- For MUI component APIs, behavior, props, or usage patterns, consult the MUI MCP docs server before answering or implementing.
- Match recommendations to the installed MUI version in this workspace whenever possible.

# Expected Behavior

- When asked to create a new component, default to MUI-based composition.
- When touching existing non-MUI layout markup, migrate to MUI primitives unless asked not to.
- If a request conflicts with this rule, ask the user which rule should take priority.
