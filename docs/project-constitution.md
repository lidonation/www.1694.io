# 1694.io Project Constitution

This document serves as the foundational source of truth for the 1694.io platform. AI Agents must read and adhere to these principles during all coding sessions.

## Mission
1694.io is the **Voltaire DRep Campaign Platform**, a specialized explorer and management tool for Cardano's CIP-1694 governance era. It enables Decentralized Representatives (DReps) to manage profiles, track on-chain/off-chain activities, and communicate with delegators.

## Tech Stack
- **Backend API**: NestJS, TypeORM, PostgreSQL (`/backend`)
- **Indexing & Workers**: NestJS, BullMQ, Redis (`/queue-backend`)
- **Frontend**: Next.js, React (`/frontend`)
- **Infrastructure**: Kubernetes (Helm), Docker, Traefik
- **Data Sources**: Blockfrost API, Yaci Store, Cardano N2C/N2N custom indexers

## Spec-Driven Development (SDD) Workflow
We do not use "vibe coding". We use a strict Spec-Driven Development (SDD) methodology to ensure intent fidelity and prevent context decay.

1. **Specs Over Assumptions**: Never guess missing requirements. If a requirement is missing from the feature spec (`docs/specs/`), stop and ask the user to clarify or update the spec.
2. **Strict TDD (Test-Driven Development)**: 
   - Read the spec.
   - Write failing tests *first* based strictly on the Acceptance Criteria and Test Cases in the spec.
   - Run the tests to confirm they fail.
   - Implement the minimal code necessary to make the tests pass.
3. **Continuous Verification**: After passing the tests, verify the implementation against the original feature spec to ensure no requirements were missed.
4. **Roadmap Maintenance**: Update the `docs/roadmap.md` to move features from backlog to completed once verified.
