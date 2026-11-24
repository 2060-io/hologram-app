# Smoke Test

Run this before a release to dev or staging.

## CI

- [ ] [E2E local](https://github.com/2060-io/hologram-app/actions/workflows/e2e-local.yml) is green on the commit you release.
- [ ] [E2E external](https://github.com/2060-io/hologram-app/actions/workflows/e2e-external.yml) ran on that commit ("Run workflow").
- [ ] Each failed external flow has a linked issue. A failed flow with no issue blocks the release.
- [ ] Check by hand every flow that the two summaries list as failed, as `skipped: infra`, or under "Known issues, not run". X15 (parental control) is always `skipped: infra` until [hologram-demos-deploy#126](https://github.com/2060-io/hologram-demos-deploy/issues/126) is done. The test plan describes each flow: [local](https://github.com/2060-io/hologram-app/blob/main/doc/E2ETestPlan.md#71-local-suite-blocks-a-merge), [external](https://github.com/2060-io/hologram-app/blob/main/doc/E2ETestPlan.md#72-external-suite-does-not-block-a-merge).

The suites run on Android only. On iOS, check the flows of these two tables by hand until #544 is done.

## Manual, on Android and iOS

- [ ] Video and audio call between two P2P connections (developer mode on both apps)
- [ ] Scan a QR code with the camera
- [ ] Back up to Google Drive (Android) or iCloud (iOS), then restore the backup (developer mode)
- [ ] Screen lock with biometrics, and the 1 minute timeout
- [ ] Share text, an image and a video from another app on iOS (share extension)
- [ ] Push notification on iOS while the app is in the background
- [ ] MRZ scan and eMRTD read through NFC

## Until the release job exists (#545)

- [ ] Upgrade: with the previous release, add a P2P contact and exchange a video, an image and a voice note, then get a credential from the demo chatbot and present it. Install the new build over it. Everything is still there and more messages go through.
- [ ] Push notification on Android while the app is in the background
