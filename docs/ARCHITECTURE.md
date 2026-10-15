# Architecture

## Control plane

ChatGPT acts as the reasoning/orchestration layer. Logical specialist agents are role contexts, not separate paid AI services.

## Source of truth

GitHub repository `hadish0123/AJENT` stores:

- application code,
- project memory,
- architecture,
- decisions,
- roadmap,
- status.

## Runtime

The initial control plane is a Next.js TypeScript application intended for Railway.

## Agent routing

A registry maps project types to specialist roles. Core roles are always available; project-specific roles activate only when relevant.

## Security principles

- No secrets in Git
- Environment variables for credentials
- Explicit approval for destructive production actions
- Health checks before production readiness
- Least privilege for connected services
