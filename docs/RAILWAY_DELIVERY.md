# Railway Delivery Protocol

Phase 06 turns a QA-approved build into a controlled Railway delivery.

## Architecture

ChatGPT uses the connected Railway tool directly. HADI Dev Studio stores only durable delivery metadata:

- Railway project/environment/service/deployment IDs,
- repository and branch,
- public domain,
- variable names and synchronization state,
- health state,
- selected build/deploy/runtime log evidence.

Secret values are never stored in the HADI Dev Studio database.

## Preconditions

A Railway delivery record can only be created after the QA gate passes.

The default delivery configuration is:

- builder: RAILPACK
- build command: npm run build
- start command: npm run start
- health check: /api/health
- health timeout: 100 seconds
- restart policy: ON_FAILURE
- restart retries: 3

## Railway tool flow

1. Verify the authenticated Railway account/workspace.
2. Create a private Railway project with PR deploys enabled when needed.
3. Create the application service from the confirmed GitHub repository and branch.
4. Apply build/start/health/restart settings.
5. Set required variables without exposing secret values.
6. Generate a Railway domain.
7. Poll environment status and deployments until settled.
8. Read build/deploy logs on failures.
9. Sync IDs, domain, variable names, health and relevant logs into HADI Dev Studio.
10. Run live Browser Operator validation against the public HTTPS domain.

## Required variables

Phase 06 requires the name DATABASE_URL to be present and synchronized.

The actual value may come from:

- a Railway database service reference,
- a secure external PostgreSQL connection string.

Never commit DATABASE_URL to GitHub and never store its plaintext value in HADI Dev Studio.

## Delivery gate

Production is considered ready only when:

- Railway project ID exists,
- environment ID exists,
- service ID exists,
- deployment ID exists,
- a public domain exists,
- DATABASE_URL is recorded as synced/sealed,
- Railway health state is healthy,
- delivery status is healthy.

## Failure handling

If Railway reports failed/crashed deployment state:

1. fetch build/deploy logs,
2. persist only relevant non-secret log evidence,
3. mark the delivery failed,
4. route the defect back to implementation,
5. redeploy only after the fix is merged and validated.

Database services must not be restarted as generic recovery.

## Current account limitation

The AJENT implementation includes the full Phase 06 control plane and Railway handoff. Actual AJENT project provisioning remains externally blocked while Railway returns: "Your trial has expired. Please select a plan to continue using Railway."

This is an account/billing capability blocker, not an application-code blocker.
