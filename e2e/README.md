# hologram e2e

Automated regression coverage for the vs-agent -> hologram flows that are tested by hand today:
connect, receive + accept credential offer, present proof, exchange messages.

## Strategy

Primary gate is **device E2E on the real Android build** (Maestro), driven against a running
rig (mediator + vs-agent). It exercises the actual shipping agent, so there is no config drift
and it catches RN/native/notification regressions a headless agent cannot.

- Issuer/verifier side is scripted with `@verana-labs/vs-agent-client` (`src/issuer.ts`).
- Connections use deep links (`receiveImplicitInvitation` / `?oob=` URLs), not the camera.
- The orchestrator interleaves SDK calls with Maestro flows (`maestro/`).

A headless protocol smoke (node agent mirroring the agent config) is a possible faster per-PR
supplement, but it duplicates `getMobileAgentModules` and will drift, so it is not the gate.

## Layout

- `src/issuer.ts` - thin driver over the vs-agent client SDK (invitation, cred offer, proof request, seed).
- `maestro/` - device flows (connect, accept credential, present proof).
- `src/run.ts` - orchestrator: creates the invitation/offer/request and runs the matching Maestro flow.

## Run (against a local rig + app on an emulator/device)

```
pnpm install
VS_AGENT_ADMIN_URL=http://localhost:3002 \
APP_ID=io.twentysixty.mobileagent.dev \
pnpm tsx src/run.ts
```

## Phases

1. Driver + one happy-path flow (this scaffold), run locally against the existing rig.
2. Finalize Maestro selectors with `maestro studio` against the running app.
3. CI: GitHub Actions with an Android emulator + the rig via docker-compose (reuse the mediator
   compose, add a vs-agent service), run pre-merge or nightly.
4. (Optional) headless protocol smoke for per-PR speed.

## Selectors

Flows use accessibility/text selectors so no app changes are required for v1. If they prove
brittle, add `testID`s to the handful of components on the connect/credential/proof screens as a
hardening step (a hologram change, surface it before doing it).
