<!--
Sync Impact Report
Version change: unratified template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Specification Before Code
- Template principle 2 -> II. Layered Architecture and Secret Handling
- Template principle 3 -> III. Teacher-Scoped Authentication and Authorization
- Template principle 4 -> IV. Human Review of AI Output
- Template principle 5 -> V. Validated and Atomic External Work
Added principles:
- VI. Reproducible Persistence
- VII. Design System, Accessibility, and Responsiveness
- VIII. Verified Delivery and Credential Safety
Added sections:
- Architecture and Security Requirements
- Development Workflow and Quality Gates
Removed sections: none
Follow-up TODOs: none
-->

# Planejador BNCC Constitution

## Core Principles

### I. Specification Before Code

Every behavior change MUST be specified with observable acceptance criteria before implementation
begins. Implementation work MUST trace back to an approved specification and its acceptance criteria.

### II. Layered Architecture and Secret Handling

Frontend, API, and external-service integration MUST remain separate. Credentials, API keys, and
secret-bearing calls MUST exist only on the backend and MUST NOT be committed or exposed to clients.

### III. Teacher-Scoped Authentication and Authorization

Every teacher MUST authenticate before accessing protected features. Every plan read, write, or
delete operation MUST authorize that the authenticated teacher owns the target plan.

### IV. Human Review of AI Output

AI-generated material MUST be presented as an editable draft and MUST be clearly identified as AI
assistance. A plan MUST require teacher review before it is treated as final.

### V. Validated and Atomic External Work

All user input and external responses MUST be validated at their boundaries. Failed validation or
external integration MUST leave no partial plan persisted.

### VI. Reproducible Persistence

Schema changes MUST use versioned migrations. Seeds used for development, demonstration, or tests
MUST be reproducible from documented commands.

### VII. Design System, Accessibility, and Responsiveness

Interface work MUST reuse components and tokens consistent with the Planejador BNCC Figma Design
System. Critical flows MUST meet WCAG AA contrast expectations and work at desktop, tablet, and
mobile breakpoints.

### VIII. Verified Delivery and Credential Safety

Critical behaviors MUST be covered by automated tests. Execution steps and versioned artifacts MUST
be documented; `.env` files, credentials, and other secrets MUST NOT be committed.

## Architecture and Security Requirements

The frontend MUST communicate with application-owned API contracts rather than external providers
directly. External integrations MUST be isolated behind backend adapters. Authorization checks MUST
occur server-side, and application logs and error responses MUST NOT disclose credentials or private
teacher data.

## Development Workflow and Quality Gates

Each feature MUST progress from specification to plan, tasks, implementation, and verification in
the same feature directory. Reviews MUST confirm acceptance criteria, authorization boundaries,
validation behavior, migrations and seeds, design-system consistency, responsiveness, accessibility,
tests, documentation, and absence of committed secrets before the work is accepted.

## Governance

This constitution supersedes conflicting project practices. Amendments MUST document the affected
principles, rationale, version change, and any required migration of active work. Version numbers
MUST follow semantic versioning: MAJOR for incompatible governance changes, MINOR for added or
materially expanded governance, and PATCH for clarifications. Every specification, plan, task list,
implementation review, and release review MUST verify compliance with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
