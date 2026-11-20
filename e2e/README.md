# E2E tests

Black-box tests with [Maestro](https://maestro.dev). See [the test plan](../doc/E2ETestPlan.md).

## Run on a laptop (Android)

You need an emulator with API 34 (`google_apis`), Maestro 2.12.1 and JDK 17.

```sh
ENVFILE=.env.e2e-local ./android/gradlew -p android assembleDevE2e assembleStagingE2e -PreactNativeArchitectures=x86_64
adb install -r android/app/build/outputs/apk/dev/e2e/app-dev-e2e.apk
adb install -r android/app/build/outputs/apk/staging/e2e/app-staging-e2e.apk
adb shell locksettings set-pin 1234
maestro test --include-tags smoke e2e/maestro
```

The flows type the PIN `1234` at the screen lock prompt, and they find some system dialogs by their English text, so the device must be in English.

On Apple Silicon the emulator is `arm64-v8a`, so build with `-PreactNativeArchitectures=arm64-v8a`.

Use a `google_apis` image: `e2e/ci/run-flows.sh` pulls the app logs with `adb root`, which `google_play` images refuse.

## Local stack

`e2e/stack` runs the mediator, MinIO, hologram-server, Caddy and dnsmasq in Docker, for the flows
with the `local` tag. Start it, then start the emulator with the stack as its DNS server, before you
install the apps:

```sh
DNS_BIND_IP="$(ipconfig getifaddr en0)" e2e/stack/start.sh
emulator -avd <your avd> -dns-server "$(ipconfig getifaddr en0)"
node e2e/ci/adb-helper.mjs &
maestro test --include-tags local e2e/maestro
```

Maestro cannot send an Android intent, so L12 and L15 call `e2e/ci/adb-helper.mjs` from a `runScript`
to run `am start` (share intents, and a link opened in a given app).

`ipconfig getifaddr en0` is the Wi-Fi address on a Mac. On Linux use the first address of
`hostname -I`.

`start.sh` waits for the DID document, a WebSocket upgrade, MinIO and dnsmasq. Stop the stack with
`docker compose -f e2e/stack/docker-compose.yml down -v`.

Two limits on a Mac:

- The mediator and hologram-server images have no arm64 build, so on Apple Silicon also set
  `DOCKER_DEFAULT_PLATFORM=linux/amd64`.
- dnsmasq needs port 53, and Colima and Lima hold it. Use another Docker runtime, or stop it.

We run the stack in CI. We have not run it end to end on a laptop.

The test CA in `e2e/stack/certs` is for tests only. Its key is public, so never trust it anywhere
else. It can only sign DNS names under `hologram.test`, and only the `e2e` build type trusts it.

## External suite

The flows in `maestro/external` (tag `external`) run against the deployed demo services: the 2060
demo chatbot on devnet and the Verana playground "demo" cast on testnet. `services.json` is the
catalogue: for each service the invitation source, the network, the expected trust status,
accreditation and minimum age, and the URLs that the preflight checks. When a service changes, edit
the catalogue, not the flows. CI runs the suite from `.github/workflows/e2e-external.yml`, on request
or with the `e2e-external` label on a PR.

The suite needs no local stack. Build the apps with `.env.e2e-dev`, then run the preflight and the
flows:

```sh
ENVFILE=.env.e2e-dev ./android/gradlew -p android assembleDevE2e assembleStagingE2e -PreactNativeArchitectures=x86_64
# install the two APKs and set the PIN as above
node e2e/preflight/preflight.mjs
e2e/ci/run-flows.sh external
```

The preflight checks the chatbot `/health`, the `/.well-known/did.json` of each service and its trust
verdict from the Verana indexers (`POST /v4/verifiable-trust/resolve`, like the app). It also asks the
playground API for an invitation of each playground service, and checks that the invitation opens. It
writes the versions to the job summary and the unhealthy services to `e2e-out/skipped-services.txt`,
and it does not fail when a service is down. `run-flows.sh` then does not run a flow that has the
`svc-<id>` tag of a skipped service, and the summary lists it as `skipped: infra`, apart from the
failed flows. Delete the file to run every flow.

Each external flow names the services that it needs, with the ids of `services.json`:
`tags: [external, svc-chatbot]`. A flow that needs the minimum age of `services.json` also has the
tag `svc-<id>-minimum-age`: when the age that the indexer reports is different, the preflight skips
only these flows.

`run-flows.sh` passes `CHATBOT_BACKEND` and `PLAYGROUND_API` from `services.json`, and a `RUN_ID`, to
Maestro. To run one flow with Maestro alone, pass them yourself:

```sh
maestro test -e RUN_ID=my-run \
  -e CHATBOT_BACKEND=https://demo-chatbot-backend.demos.dev.hologram.zone \
  -e PLAYGROUND_API=https://playground.testnet.verana.network/api/demo \
  e2e/maestro/external/<flow>.yaml
```

The `runScript` helpers:

- `chatbot-invitation.js` gets a one-time invitation from `${CHATBOT_BACKEND}/invitation?label=${RUN_ID}`.
  It sets `output.chatbot.link`, a `didcomm://invite?_url=` link for `openLink`, and
  `output.chatbot.invitationId`.
- `service-did.js` (`DID_DOCUMENT`) reads a `did.json` and sets `output.serviceDid` to its `did:webvh`
  alias, or to its id when it has none.
- `playground-offer.js` (`SERVICE`, and `ACTION: request` for a verifier) gets a credential offer or a
  proof request from the playground. It sets `output.playground.link` and
  `output.playground.exchangeId`, which is empty for `demo-untrusted` (a plain invitation).
- `playground-state.js` (`SERVICE`, `KIND: credential|proof`, `EXCHANGE_ID`, `EXPECT`, and `TIMEOUT_S`,
  60 by default) asks the playground for the state every 2 s until it matches. `EXPECT` is a regex
  for the whole state (`offer-sent`, `done`, `abandoned`, ...), and it also matches the outcomes
  `done` and `declined` that the playground reports. The script fails at once on another final state,
  or at the timeout. It sets `output.playgroundState` to the last answer: `{state, done, declined, error}`
  for a credential, `{state, verified, claims}` for a proof.

Maestro scripts have no timers, so `playground-state.js` waits inside one `runScript` and the flow
needs no `repeat`:

```yaml
- runScript:
    file: ../scripts/playground-state.js
    env:
      SERVICE: demo-issuer-accredited
      KIND: credential
      EXCHANGE_ID: ${output.playground.exchangeId}
      EXPECT: done
```

## Layout

- `maestro/smoke`: checks that the two apps open. It needs no backend.
- `maestro/local`: flows that need the local stack.
- `maestro/external`: flows that need the deployed demo services.
- `maestro/scripts`: `runScript` files that call the adb helper, the chatbot and the playground.
- `maestro/subflows`: shared steps. `APP_ID`, `PEER_APP_ID`, `NAME`, `LINK`, `APP_LABEL` and `MS` are their parameters.
- `maestro/fixtures`: media for the flows. `SHA256SUMS` has their hashes. Maestro only reads media inside the directory that it runs, so they are under `maestro`.
- `ci`: scripts for the CI job in `.github/workflows/e2e-android.yml`. `run-flows.sh` runs each flow on its own, with its screen recording and app logs, and splits the flows between the shards of the job. `FLOW_FILTER=<regex>` limits it to the matching flow files.
- `services.json` and `preflight`: the catalogue of the external services, and the check that runs before their flows.
- `stack`: the local stack.

## The `e2e` build type

It is a release build with debug signing that also trusts the test CA in
`android/app/src/e2e`, only for `hologram.test`. The prod flavor has no `e2e` variant, and the CI
job checks that a release build has no test CA.
