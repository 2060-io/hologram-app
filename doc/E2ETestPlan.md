# Hologram E2E Test Plan

This document proposes how CI can replace most of the manual smoke test in
[smoke_test.md](../.github/PULL_REQUEST_TEMPLATE/smoke_test.md). It gives the design, the test
suites, the changes to the app and to the services, and the phases.

## 1. Summary

We divide the tests into three groups. The group of a test depends on the infrastructure
that the test needs.

| Group | Counterparts | Infrastructure | Runs | Blocks a merge |
| --- | --- | --- | --- | --- |
| **Local suite** | A second Hologram app (P2P) | Mediator, MinIO and TLS proxy in the runner | Each PR, before a release | **Yes** (after a period to make it stable) |
| **External suite** | Deployed demo services: the 2060 demo chatbot and the Verana playground "demo" cast | Dev mediator, dev MinIO, Verana testnet | On request, before a release | No |
| **Manual checklist** | People and real devices | Real devices | Before a release | No (the release manager signs it) |

No suite runs on a schedule. A suite runs only for a PR, on request, or before a release.

The main decisions are:

1. **Test tool:** Maestro. It drives the app as a black box. It does not need to synchronize
   with the JS thread. The DIDComm agent keeps WebSockets and timers open all the time, so a
   gray-box tool (Detox) does not work well.
2. **Invitations:** the tests deliver invitations as links (deep links, or the "link" tab of
   the Scan screen), not as QR codes. One optional test decodes a QR code from a screenshot.
3. **External services:** the external suite uses only two sets of deployed services: the
   2060 demo chatbot and the Verana playground "demo" cast on testnet. We do not deploy a
   service for the tests. The VS Agent v2 needs a connection to the Verana VPR, so a local
   VS Agent is not simple. We own the demo chatbot, so we add test features to it (section 6).
4. **Local suite:** the runner hosts its own mediator and MinIO. Then the P2P tests do not
   depend on `ca.dev.2060.io` or `s3.minio.dev.2060.io`, and they can block a merge.
5. **iOS:** a special E2E build removes the two pods that use MLKit. Then the app runs on
   arm64 simulators, and Rosetta is not necessary.
6. **Scope:** no test uses third-party DIDComm services (for example BCGov). No test uses Indy
   (`did:sov`, `did:indy`), because the app will remove Indy support.

## 2. Decisions

| Topic | Decision |
| --- | --- |
| Schedule | No scheduled runs. The local suite runs for each PR. The external suite runs on request and before a release. |
| Chatbot version | The deployed chatbot follows the VS Agent `:dev` image. The external suite thus also finds VS Agent regressions. The job summary records the versions. |
| Verana target | The Verana playground "demo" cast on **testnet** only. We do not use verana-demos. |
| Test switches in the app | Not preferred. We add a switch only when the spike shows that no other way works (section 5). |
| Parental control | The dev chatbot requires a minimum age of 18 (section 6.1, C10). |
| Required check | The local suite becomes a required check after the stabilization period (section 8). |
| Chatbot trust | The dev chatbot has an ECS Service credential on Verana testnet. Thus X01 expects "trusted", and C10 can set the minimum age. |
| Playground | The Hologram team also owns the Verana playground. The external suite uses its `/api/demo/<service>` endpoint to get invitation links. If a test needs more from the playground, we change the playground, the same as the chatbot. |

## 3. Facts that control the design

### 3.1 App

| Fact | Location | Effect |
| --- | --- | --- |
| The app has no `testID` props and only 2 `accessibilityLabel` props. | `src/` | We must add test IDs. A selector that uses text breaks when the language or the copy changes. |
| Only `VisionCameraBarcodeScanner` and `NitroVisionCameraOcrPlus` use MLKit on iOS. | `ios/Podfile.lock` | The simulator has no camera. An E2E build can remove the two pods and use JS stubs. |
| The Scan screen has a "link" tab. The app accepts `didcomm://` and `https://hologram.zone` deep links. | [Scan.tsx](../src/pages/Scan/Scan.tsx), [AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml) | A test can open each invitation without a camera. |
| Screen lock is on by default. | [ScreenLockProvider.tsx:98](../src/hooks/providers/ScreenLockProvider.tsx#L98) | A device without a PIN or biometrics shows the "wallet locked" screen. Section 5 gives the solution. |
| The app joins the mediator only through `MEDIATOR_PUBLIC_DID` (implicit invitation). | [useSignUp.ts:27-52](../src/hooks/useSignUp.ts#L27-L52) | The mediator DID document must resolve. The value comes from the env file at build time. |
| At sign-up, the app connects to `DEFAULT_SERVICE_PUBLIC_DID` (the welcome agent). A failure does not stop the sign-up. | [useSignUp.ts:59-79](../src/hooks/useSignUp.ts#L59-L79) | The E2E env files leave this value empty. Then no test depends on the welcome agent. |
| The did:web resolver uses `https://` always. The did:webvh resolver uses `https://` always, and it refuses IP hosts. | `web-did-resolver`, `didwebvh-ts` | A local mediator needs a host name and a TLS certificate that the device trusts. |
| Media upload gets S3 credentials from MinIO STS (`AssumeRoleWithCustomToken`) with a Firebase App Check token. | [fileUploadService.ts:39-64](../src/services/fileUploadService.ts#L39-L64) | A local MinIO needs the identity plugin [hologram-server](https://github.com/2060-io/hologram-server) (section 3.4). The App Check debug provider needs Google and a registered debug token. |
| The media URL is in the DIDComm message. The receiver downloads it with no credentials. The download refuses `localhost` and `127.0.0.1`. | [FileUploadDownloadProvider.tsx:146-163](../src/hooks/agent/FileUploadDownloadProvider.tsx#L146-L163) | The two app instances must reach MinIO at the same host name. The bucket must allow anonymous read (the files are encrypted). |
| For a `did:peer` peer, trust resolution makes no network call. | [trustResolution.ts:5-28](../src/services/trustResolution.ts#L5-L28) | P2P tests do not depend on the Verana indexers. |
| The app shows service status `trusted`, `untrusted` or `unverified`. It shows issuer and verifier accreditation `authorized`, `unauthorized` or `unverified`. The minimum age comes from the ECS Service credential. | [trustResolution.ts](../src/services/trustResolution.ts), [accreditation.ts](../src/services/verana/accreditation.ts) | The external suite can examine each state against services that are in that state on purpose. |
| Android: `ENVFILE` selects the env file. iOS: each scheme writes `.env.dev` (or another file) in a pre-action. | `android/app/build.gradle:5-12`, `ios/hologram.xcodeproj/xcshareddata/xcschemes/Dev.xcscheme` | Android needs no change to select an E2E env file. iOS needs an E2E scheme. |
| `test/docker-compose*.yml` uses GitLab-era images and a fixed IP. | [test/](../test/) | Delete these files. The new stack replaces them. |

### 3.2 Mediator (`didcomm-mediator`)

- One container. With no `POSTGRES_HOST`, it uses an SQLite wallet and an in-memory queue.
  It needs no Redis, no Firebase and no Verana.
- It supports only did:web and did:webvh for its public DID. A fresh did:webvh wallet gets a
  random SCID, so CI must use **did:web** (for example `did:web:mediator.hologram.test`).
- Without Firebase, it does not send pushes. Thus the local suite cannot test push.
- It supports DIDComm v1 and v2, and HTTP and WebSocket on one port.

### 3.3 Deployed demo services

| Service | Where | Use in the tests |
| --- | --- | --- |
| **2060 demo chatbot** ([vs-agent/examples/chatbot](https://github.com/verana-labs/vs-agent/tree/main/examples/chatbot)) | `dm.chatbot.demos.dev.2060.io`. The image ships with each VS Agent release. We own it, and we can add features to it. | All message types that a service sends: text, menu, question, media, link, invitation, profile, credential offer, proof request, MRZ and eMRTD requests, calls. It answers fixed text (for example `/echo`). Parental control. Section 6.1 adds the features that the tests need. |
| **Verana playground "demo" cast** | `https://<id>.playground.testnet.verana.network` (testnet) | Trust matrix: issuer and verifier, each accredited, not accredited, and untrusted. Also a standalone untrusted service. `GET https://playground.testnet.verana.network/api/demo/<service>` returns an invitation link and an exchange ID with no browser. |

Some facts make the external suite less stable:

- **Image versions:** the chatbot uses the `:dev` image tag with `imagePullPolicy: Always`. A
  restart of the pod can install a new version. A person deploys the playground cast by hand,
  with fixed versions. The job summary records the version of each service (section 6.2).
- **No `/qr` or `/invitation` page:** VS Agent v2 removed both. The smoke test still uses
  `https://dm.chatbot.demos.dev.2060.io/qr`. The new invitation endpoint of the chatbot
  (section 6.1, C1) replaces it. An implicit invitation to its public DID also works.
- **Negative cache:** the Verana resolver keeps a negative verdict for 1 hour.
- **DIDs:** the DIDs and the credential definition IDs can change (for example after the
  cast is deployed again with new storage). The tests must read them at run time
  (`/.well-known/did.json`, `/resources`). They must not keep them in the code.

> **Bug in the current smoke test:** the chatbot reads the DID from the **third** argument of
> `/invitation [label] [imageUrl] [did]`. The message `/invitation did:web:em-vs.demos.2060.io`
> sends the DID as the label.

### 3.4 MinIO identity plugin (`hologram-server`)

[hologram-server](https://github.com/2060-io/hologram-server) is a NestJS service. MinIO calls
`POST /auth?token=<token>`. The service verifies the token with
`firebase-admin` `appCheck().verifyToken()`. Then it returns
`{ user: 'mobile-app', maxValiditySeconds, claims: {} }`.

Its `docker-compose.yml` already shows the MinIO configuration that the app needs:

```yaml
MINIO_IDENTITY_PLUGIN_URL: "http://hologram:3000/auth"
MINIO_IDENTITY_PLUGIN_ROLE_ID: "mobile-app"     # gives arn:minio:iam:::role/idmp-mobile-app
MINIO_IDENTITY_PLUGIN_ROLE_POLICY: "consoleAdmin"
image: minio/minio:RELEASE.2025-07-23T15-54-02Z
```

The service needs a Firebase **service account** file. A PR from a fork gets no secrets, and
the local suite must not need secrets. Thus we add a small test mode to hologram-server
(section 6.3).

## 4. Test tool: Maestro

| Criterion | Maestro | Detox | Appium |
| --- | --- | --- | --- |
| Works with an app that keeps sockets and timers open | Yes (black box, it waits for the UI) | Needs `disableSynchronization` and manual waits | Yes |
| Changes to the native app | None | Native test target and test runner | None |
| Android emulator and iOS simulator | Yes | Yes | Yes |
| Gallery media | `addMedia` | No | Scripts |
| Links | `openLink` | `openURL` | Scripts |
| HTTP calls from a flow (to get an invitation) | `runScript` with `http` | Node test code | Node test code |
| Two apps on one device | `launchApp: appId` | Difficult | Yes |
| Quantity of work | Low (YAML) | Medium | High |

Maestro has limits. Its JS is not Node, so complex logic goes in a small Node helper that the
CI job starts. The `longPressOn` duration is fixed. Maestro Cloud costs money, but we use only
the free CLI.

## 5. Architecture

### 5.1 Local suite

```
GitHub runner (ubuntu-latest, KVM)
│
├── docker compose (e2e/stack)
│   ├── caddy            TLS with the test CA, for *.hologram.test, on port 443
│   │     ├── mediator.hologram.test → mediator:4000   (did.json, wss)
│   │     └── s3.hologram.test       → minio:9000
│   ├── mediator         did:web:mediator.hologram.test, SQLite, no Firebase
│   ├── minio            bucket hologram-media-sharing (anonymous read)
│   ├── hologram-server  MinIO identity plugin, role "mobile-app", test mode (section 6.3)
│   └── dnsmasq          *.hologram.test → 10.0.2.2
│
└── Android emulator (google_apis, x86_64, -dns-server → dnsmasq)
    ├── Hologram "A"  io.twentysixty.mobileagent.dev  (devE2e,     .env.e2e-local)
    └── Hologram "B"  io.twentysixty.mobileagent.st   (stagingE2e, .env.e2e-local)
        Maestro switches between A and B with launchApp: appId
```

Notes:

- **Two apps, one emulator.** The dev and staging flavors have different application IDs, so
  both can be on one emulator. Maestro moves from A to B. The device clipboard carries the
  invitation link from A to B. This uses fewer resources than two emulators. It does not test
  delivery in live mode while the two apps are in the foreground at the same time. A job with
  two emulators on a larger runner covers live mode before a release.
- **TLS.** A test CA (certificate and key in `e2e/stack/certs`, for tests only) signs the
  certificates of Caddy. Only the E2E build type trusts this CA, through a
  `network_security_config` in `android/app/src/e2e/`. Release builds do not change.
- **DNS.** The emulator uses dnsmasq on the runner (`-dns-server`). If this does not work,
  the fallbacks are an `/etc/hosts` file on a writable system image, or a public DNS record
  `*.e2e.2060.io → 10.0.2.2`.
- **App Check.** The app gets a token from the App Check debug provider. That needs Google
  and the debug token in `.env.dev`, which is already public. hologram-server in test mode
  verifies the token with no service account (section 6.3). If Google causes flaky tests,
  hologram-server can accept each token. Only if that is not sufficient, the app gets a switch
  to send a fixed token.
- **Screen lock.** On Android, the job sets a PIN on the emulator
  (`adb shell locksettings set-pin`). Maestro types the PIN in the system prompt. This needs no
  change to the app, and it also tests the screen lock. On iOS, the simulator can enroll
  Face ID and send a match. If the spike shows that this is not reliable, the app gets a
  switch for the screen lock default, which only the E2E env file sets.
- **Not in scope:** calls (WebRTC server, TURN) and pushes (no Firebase in the local mediator).

### 5.2 iOS simulator (local suite)

GitHub macOS runners have no Docker. The same stack runs as native processes:

- Node for the mediator and for hologram-server.
- The `minio` and `caddy` binaries.
- An `/etc/hosts` entry for `*.hologram.test → 127.0.0.1`. The simulator uses the network of
  the host.
- `xcrun simctl keychain booted add-root-cert` for the test CA.

The download block refuses only the literal names `localhost` and `127.0.0.1`, so
`s3.hologram.test` works. One simulator can hold the Dev and Staging apps, the same as on
Android.

### 5.3 External suite

```
GitHub runner
├── preflight.ts   examines each service in e2e/services.json (did.json, health, trust verdict)
│                  → marks each unhealthy service as "skipped: infra" (not "failed")
├── Android emulator ── Hologram devE2e built with .env.e2e-dev (dev mediator, dev MinIO)
└── Maestro flows
      runScript → chatbot GET /invitation, or playground /api/demo/<service> → link → openLink
      runScript → playground state API → the service side agrees with the app (done / declined)
```

`e2e/services.json` is a catalogue. Each entry gives these fields:

- the source of the invitation (the chatbot endpoint, or the playground API)
- the network (`testnet`)
- the expected service status
- the expected issuer or verifier accreditation
- the minimum age

When a service changes, we edit the catalogue, not the flows.

### 5.4 Changes to the app

| Change | Why | Effect on production |
| --- | --- | --- |
| Add `testID` to about 15 screens (sign-up, chats list, chat, composer, message bubbles, connection details, invitation, credential offer, proof request, wallet, credential details, settings, trust card and status badge) | Stable selectors | None |
| `.env.e2e-local` and `.env.e2e-dev` (with an empty `DEFAULT_SERVICE_PUBLIC_DID`) | Select the infrastructure per suite | None |
| Android build type `e2e`: `initWith release`, debug signing, bundled JS, `network_security_config` with the test CA | A build like release, which trusts the local stack | None (the `e2e` source set is only in this build type) |
| iOS scheme and configuration `E2E`: `.env.e2e-*`, simulator SDK, no code signing | Simulator build | None |
| iOS Podfile toggle `HOLOGRAM_E2E=1`: remove the two MLKit pods; Metro alias to JS stubs | Native arm64 simulators | None (only when the variable is set) |
| Only if necessary: a switch for the screen lock default, and a switch for a fixed App Check token | See section 5.1 | None (the defaults do not change) |
| Fix the `/invitation` example in the smoke test | Bug | None |

## 6. Changes to the services

We own the demo chatbot and hologram-server. Small changes to them make the tests simpler and
more stable. These changes also help people who test by hand.

### 6.1 Demo chatbot

The chatbot code is in one file
([index.ts](https://github.com/verana-labs/vs-agent/blob/main/examples/chatbot/index.ts)). It
has an Express server with a public port (`PUBLIC_BASE_URL`). The changes are:

| ID | Change | Test that uses it |
| --- | --- | --- |
| C1 | `GET /invitation` on the public port. It calls the admin API `POST /v2/didcomm/invitations` and returns `{ url, invitationId }`. An optional `?label=` gives the run ID, so that the logs of the bot show the run. | All chatbot flows. This replaces the `/qr` page that VS Agent v2 removed. |
| C2 | `GET /health` on the public port. It returns `ok` when the VS Agent admin API is ready (`/v2/agent/health/ready`). It also returns the versions of the bot and of the VS Agent. | Preflight, job summary |
| C3 | `/media image\|video\|audio\|file`. Each type sends a fixed file from `public/` (today `/media` sends only `bunny.jpeg`). | X03 |
| C4 | **Media echo.** When the bot receives media, it downloads the file and decrypts it (AES-256-CBC, key and IV in the message). Then it sends `media-received <mimeType> <bytes> sha256:<hex>`. With `/echo-media on`, it also shares the same item back (same URI and key). | X05: the test compares the hash with the fixture. This proves upload, encryption, and download on the bot. The shared item proves download and decryption on the app. |
| C5 | **Action echo.** The bot sends one fixed text for each event that it receives from the app: `receipt <state> <messageId>`, `reaction <emoji>`, `profile <name>`, `menu <id>`, `answer <text>`. A switch `/trace on\|off` turns it on for one connection. | X02, X04: the test checks that the app sends receipts, reactions and its profile. |
| C6 | `/issue` text command (today only the menu can issue). `/issue <claim value>` sets the value. | X06 |
| C7 | `/invitation` accepts named arguments (`did=`, `label=`, `image=`), so the order of the arguments is not a trap. | X07 |
| C8 | `/question <n>` sends a fixed question with `n` options. The answer comes back through C5. | X02 |
| C9 | `/terminate` (exists) also sends a "connection terminated" message to the app before it deletes the connection. | X07 |
| C10 | **Deployment:** the ECS Service credential of the dev chatbot sets `minimumAgeRequired: 18`. | X15 |

The image ships with each VS Agent release, so the external suite also finds regressions in
the VS Agent. The job summary records the versions of C2, so that a person can see which side
changed.

### 6.2 Versions in the job summary

The preflight reads the version of each service (C2 for the chatbot, `/.well-known/did.json`
and the trust verdict for the playground cast). It writes them in the job summary.

### 6.3 hologram-server

Add a configuration that does not need a service account:

- `FIREBASE_PROJECT_ID=<id>` with no `FIREBASE_CFG_FILE`: `initializeApp({ projectId })`.
  App Check token verification uses the public Google JWKS, so this verifies the real token
  of the debug provider. The spike must confirm that `firebase-admin` accepts this
  configuration.
- `APP_CHECK_VERIFY=false` (for tests only): accept each token and log a warning. This is the
  fallback if Google causes flaky tests.

The repository has a CI job that publishes the image.

## 7. Test suites

Each flow starts with a fresh install (`launchApp: clearState: true`). A shared subflow does
the sign-up.

### 7.1 Local suite (blocks a merge)

| ID | Flow | Smoke test item |
| --- | --- | --- |
| L01 | Sign-up with name and picture (`addMedia`) | Signup |
| L02 | Change the profile. The peer sees the new name and picture. | Settings: modify profile |
| L03 | A creates an invitation link. B opens it. The connection completes on the two sides. | P2P connection |
| L04 | B opens the same link again: "You are already connected". A refreshes the invitation. B connects as a new contact. | Settings: invitation |
| L05 | Text, in the two directions. Receipts (ticks). | Chat |
| L06 | Image and video from the gallery, in the two directions. Download and preview on the receiver. | Chat |
| L07 | Voice note (long press). Play on the receiver. | Chat (risk: audio input on the emulator) |
| L08 | Reaction, reply, copy, delete, report | Chat screen features |
| L09 | Block: B cannot send. Unblock: B can send. | Connection details |
| L10 | Clear the conversation. Delete the connection. | Connection details |
| L11 | Chats screen: filter, search, archive, unarchive, delete | Chats screen |
| L12 | Deep links: valid `didcomm://` and `https://hologram.zone` links open the invitation. An invalid link shows the error toast. | Deep links |
| L13 | Developer mode: tap Settings 7 times. Change an environment value. | Developer |
| L14 | Delete the wallet. The app shows the sign-up screen. | Settings |
| L15 | Share text and an image from another app (`am start -a android.intent.action.SEND`) (Android only) | Share from other apps |
| L16 | Screen lock: "instant" asks for the PIN when the app comes back. "Off" does not ask. (Android only) | Privacy |
| L17 | Upgrade: install the build of the last release, make data with L03–L07, install the new build over it, then exchange more messages (Android only, before a release) | Wallet restore with migration |

### 7.2 External suite (does not block a merge)

The "C" codes refer to the chatbot changes in section 6.1.

| ID | Flow | Counterpart |
| --- | --- | --- |
| X01 | Get a link from `GET /invitation` (C1) and open it. The welcome message and the context menu arrive. The trust card shows the state from the catalogue. | 2060 chatbot |
| X02 | `/echo`. `/question 3` and an answer: the bot sends `answer <text>` (C8, C5). A menu selection: the bot sends `menu <id>`. Poll with the fixed answer "Correct! Vamos Argentina!". | 2060 chatbot |
| X03 | The app receives `/media image`, `video`, `audio` and `file` (C3). Each item downloads and opens, and the voice note plays. `/link` opens the web view. `/profile` changes the name and the picture of the bot. | 2060 chatbot |
| X04 | `/trace on` (C5). The app sends receipts (`receipt viewed <id>`), a reaction (`reaction 👍`, and the bot sends ❤️ back) and its profile (`profile <name>`). | 2060 chatbot |
| X05 | The app sends an image, a video, a voice note and a file. The bot answers `media-received … sha256:<hex>` (C4). The test compares the hash with the hash of the fixture. With `/echo-media on`, the app receives each item back and opens it. | 2060 chatbot |
| X06 | Proof request before the credential is in the wallet (no credential). `/issue` (C6) → accept. `/proof` → share → "Verified: true". | 2060 chatbot |
| X07 | `/invitation did=<service DID>` and `/invitation` for a sub-connection (C7). The app opens each invitation and connects. `/terminate` (C9): the app shows the terminated connection and cannot send. | 2060 chatbot |
| X08 | Forward a service to a P2P contact. The contact (app B on the same emulator) connects to the service. | 2060 chatbot + app B |
| X09 | `/call`: the app shows the incoming call and accepts it. The vision service of the bot joins. The bot sends "Call was succesful". (Android only. It depends on the dev WebRTC server and the vision service.) | 2060 chatbot |
| X10 | Accredited issuer: status "trusted", network TESTNET, offer with no warning, accept | Playground `demo-issuer-accredited` |
| X11 | Issuer not accredited: "Accept anyway (unsafe)" | Playground `demo-issuer-unaccredited` |
| X12 | Untrusted issuer: the app shows the untrusted state | Playground `demo-issuer-untrusted` |
| X13 | Accredited verifier, verifier not accredited ("Share anyway (unsafe)"), untrusted verifier | Playground `demo-verifier-*` |
| X14 | Untrusted service: the invitation screen shows "untrusted" | Playground `demo-untrusted` |
| X15 | Parental control: turn it on with a PIN, and set a kid birthday for an age below 18. The app does not connect to the chatbot (C10). Turn it off: the app connects. | 2060 chatbot |
| X16 | Wallet: list, details, delete. Present to a connection (accept and refuse on app B). Present as a link to app B. | Credential from X06 or X10 |
| X17 | Push: send the app to the background. The bot sends a message. The notification appears. (Android only) | 2060 chatbot through the dev mediator |
| X18 | Decode a QR code from a screenshot of "Present as QR" (optional) | — |

A flow that the preflight marks as unhealthy gets the result **skipped: infra**. A failure of
the app gets the result **failed**. The job summary gives the two lists apart.

### 7.3 Manual checklist (stays manual)

- Video and audio calls between two people (P2P). X09 covers a call with the bot.
- Scan a QR code with a real camera.
- Backup and restore through Google Drive or iCloud.
- Screen lock with biometrics, and the timeout values.
- Share from other apps on iOS (share extension).
- Push notifications on iOS.
- MRZ scan and eMRTD read through NFC.

The new smoke test template removes the BCGov showcase, the Gov ID Issuer and the other
third-party services.

### 7.4 Coverage of the smoke test

| Group | Items in the current checklist (about 45, without the third-party services) |
| --- | --- |
| Local suite | about 21 |
| External suite | about 16 |
| Manual | about 8 |

The external suite also checks things that the manual checklist does not check today: the
hash of the media that the app sends, and the receipts, reactions and profile that the app
sends.

## 8. CI workflows

| Workflow | Trigger | Jobs | Run time (estimate) |
| --- | --- | --- | --- |
| `ci.yml` (exists) | Each PR | Style, types | 3 min |
| `e2e-local.yml` | Each PR (no docs-only changes), on request | Android build (`devE2e` + `stagingE2e`), stack, local suite | 35–45 min |
| `e2e-local-ios.yml` | PRs that change native iOS files (`ios/**`, `package.json`, `pnpm-lock.yaml`, `patches/**`), on request | iOS simulator build, native stack, local suite | 60–80 min |
| `e2e-external.yml` | On request (`workflow_dispatch`, or the label `e2e-external` on a PR) | Preflight, Android `devE2e` with `.env.e2e-dev`, external suite | 40–60 min |
| `e2e-release.yml` | Called by the release workflows | Local suite (Android and iOS), L17 (upgrade), two-emulator live mode, external suite | 90–120 min |

The release workflows stop when the local suite fails. They do not stop when the external
suite fails. The release manager reads the external report and decides.

The repository is public, so the standard Linux and macOS runners cost nothing. A PR from a
fork gets no secrets. The local suite needs no secrets.

**Rule for "blocks a merge":** during a stabilization period, the local suite does not block a
merge. We measure the flake rate. When the rate is below about 2%, we make the job required.

Each flow gives these artifacts:

- a screen recording
- the Maestro JUnit report
- the app file logs (through `adb`)
- the logs of the stack containers

## 9. Directory layout

```
e2e/
  README.md                 how to run the suites on a laptop
  maestro/
    config.yaml
    subflows/               signup, open-link, accept-offer, unlock, ...
    local/                  L01–L17
    external/               X01–X18
    scripts/                runScript helpers (chatbot and playground APIs, links)
  fixtures/                 image.jpg, video.mp4, voice.m4a, doc.pdf, avatar.png (+ sha256)
  services.json             catalogue of the external services
  preflight/                Node script: health, versions and trust of each service
  stack/
    docker-compose.yml      caddy, mediator, minio (+ bucket setup), hologram-server, dnsmasq
    start-native.sh         the same stack for macOS (no Docker)
    Caddyfile
    certs/                  test CA (tests only)
```

The images of the mediator and of hologram-server come from their registries with fixed tags.
The stack does not build them.

## 10. Phases

| Phase | Content | Result |
| --- | --- | --- |
| **Spike** | Android `devE2e` in CI. Local mediator behind Caddy with the test CA and dnsmasq. hologram-server with `FIREBASE_PROJECT_ID` only. Two apps on one emulator exchange one text message and one image. Screen lock with an emulator PIN. One external flow (X10). | Answers to risks R1–R4 and real run times |
| 0. Groundwork | Test IDs, env files, `e2e` build type, CI job for the emulator, Maestro skeleton, artifacts | A flow can run in CI |
| 1. Local stack | Compose file, MinIO with hologram-server, bucket policy, health checks, hologram-server test mode | The stack starts in CI |
| 2. Local suite (Android) | L01–L16 | The local suite runs for each PR |
| 3a. Chatbot changes | C1–C10 in the VS Agent repository and in the chatbot deployment | The chatbot supports the tests |
| 3b. External suite (Android) | Catalogue, preflight, X01–X16, X18 | The external suite runs on request |
| 4. iOS | Podfile toggle and stubs, E2E scheme, native stack on macOS, changes to the flows | The iOS local suite runs |
| 5. Release job | `e2e-release.yml`, L17 (upgrade), X17 (push), two-emulator live mode | The release workflows call the suites |
| 6. Hardening | Required check, flake triage, job summary, new smoke test template | The local suite is a required check |

Phase 3a does not depend on the app work. Another person can do it at the same time as
phases 0 to 2.

## 11. Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R1 | The emulator does not use dnsmasq through `-dns-server`. | Writable system image with `/etc/hosts`. Or a public DNS record that points to `10.0.2.2`. |
| R2 | OkHttp or another native client does not trust the test CA. | The spike examines fetch, WebSocket and the download in `react-native-fs`. |
| R3 | `firebase-admin` does not verify App Check tokens with only a project ID. | Use `APP_CHECK_VERIFY=false` in hologram-server (section 6.3). |
| R4 | Two apps on one emulator are not the same as two devices (background sockets). | The release job runs two emulators on a larger runner. |
| R5 | No audio input on a headless emulator, so L07 cannot record. | Use a virtual audio input. Or test only voice notes that the app receives (X03 with an audio file). |
| R6 | External services are down, or a person deployed a new version. | Preflight, "skipped: infra", no merge block, versions in the job summary. One owner for each service in `services.json`. |
| R7 | The trust cache of 1 hour, or a new deployment of the cast, gives a wrong trust state. | Read the trust verdict in the preflight. Examine the state that the indexer gives, not a fixed state. |
| R8 | A new VS Agent version on `:dev` breaks the chatbot, and the external suite fails for a reason that is not in the app. | The job summary shows the versions (C2). The external suite does not block a merge. |
| R9 | The iOS stubs break the build when the pods change. | The iOS job runs for each PR that changes native iOS files. |
| R10 | The App Check debug token stops working (Google, registration). | `APP_CHECK_VERIFY=false` in hologram-server. A fixed token in the app only if that is not sufficient. |
| R11 | X09 (call) depends on the dev WebRTC server and on the vision service. | X09 is in the external suite only. A failure does not block a release. |
| R12 | On iOS, the simulator cannot pass the screen lock (Face ID match) in a reliable way. | A switch for the screen lock default, which only the E2E env file sets. |
| R13 | C10 (minimum age 18) blocks other flows when a test leaves parental control on. | Each flow starts with a fresh install. X15 turns parental control off at the end. |

## 12. Open questions

There are no open questions at this time.

## 13. Example flows

Local suite, P2P text (two apps on one emulator):

```yaml
appId: io.twentysixty.mobileagent.dev
tags: [local, p2p]
---
- runFlow: ../subflows/signup-both.yaml          # signs up app A and app B
- launchApp: { appId: io.twentysixty.mobileagent.dev }
- tapOn: { id: "settings-tab" }
- tapOn: { id: "settings-my-invitation" }
- tapOn: { id: "invitation-copy-link" }          # the link goes to the device clipboard
- launchApp: { appId: io.twentysixty.mobileagent.st }
- tapOn: { id: "scan-tab" }
- tapOn: { id: "scan-link-tab" }
- tapOn: { id: "scan-link-input" }
- pasteText
- tapOn: { id: "scan-link-open" }
- tapOn: { id: "invitation-accept" }
- extendedWaitUntil: { visible: { id: "chat-screen" }, timeout: 30000 }
- inputText: "hello from B"
- tapOn: { id: "composer-send" }
- launchApp: { appId: io.twentysixty.mobileagent.dev }
- extendedWaitUntil: { visible: "hello from B", timeout: 30000 }
```

External suite, accredited issuer (playground API):

```yaml
appId: io.twentysixty.mobileagent.dev
tags: [external, trust]
---
- runFlow: ../subflows/signup.yaml
- runScript:
    file: ../scripts/playground-offer.js           # GET /api/demo/demo-issuer-accredited?format=anoncreds
    env: { SERVICE: demo-issuer-accredited }
- runFlow: { file: ../subflows/open-link.yaml, env: { LINK: "${output.link}" } }
- assertVisible: { id: "trust-status-trusted" }
- tapOn: { id: "credential-offer-accept" }
- runScript:
    file: ../scripts/playground-await.js           # polls .../credential/<id> until "done"
    env: { EXCHANGE_ID: "${output.exchangeId}" }
- tapOn: { id: "wallet-tab" }
- assertVisible: "DemoCredential"
```

The test IDs in these examples do not exist yet. Phase 0 adds them.
