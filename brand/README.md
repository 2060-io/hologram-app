# Brand Interface Contract

This directory defines the **brand contract** for hologram-app. It ships with default Hologram branding so the repo is always buildable on its own.

An external branding repository (e.g. `hologram-app-branding`) can replace the contents of this directory before building to produce a white-labeled app.

## Directory Structure

```
brand/
├── config.json          # Brand metadata (required)
├── apply-brand.js       # Script that applies config + assets to native projects
├── README.md            # This file
└── assets/              # Optional brand-specific assets
    ├── android/
    │   ├── google-services.json              # Firebase config (replaces android/app/google-services.json)
    │   ├── main/res/mipmap-*/ic_launcher*.png  # App icons for prod
    │   ├── dev/res/mipmap-*/ic_launcher*.png   # App icons for dev
    │   ├── staging/res/mipmap-*/ic_launcher*.png # App icons for staging
    │   ├── main/res/drawable-*/ic_notification.png
    │   ├── dev/res/drawable-*/ic_notification.png
    │   └── staging/res/drawable-*/ic_notification.png
    └── ios/
        ├── GoogleService-Info-Dev.plist
        ├── GoogleService-Info-Staging.plist
        ├── GoogleService-Info-Prod.plist
        ├── AppIcon.appiconset/               # iOS app icon set
        ├── SplashScreenIcon.imageset/        # Splash icon (prod)
        ├── SplashScreenIconDev.imageset/     # Splash icon (dev)
        └── SplashScreenIconStaging.imageset/ # Splash icon (staging)
```

## config.json Schema

```jsonc
{
  // Display name shown in the app UI (injected via APP_NAME env var and i18next)
  "appName": "Hologram",

  // Android-specific settings
  "android": {
    "applicationId": "io.twentysixty.mobileagent",  // Base application ID
    "namespace": "io.twentysixty.mobileagent",       // Android namespace
    "splashColor": "#767bec",                         // Prod splash background
    "splashColorDev": "#2497F3",                      // Dev splash background
    "splashColorStaging": "#06988b"                   // Staging splash background
  },

  // iOS-specific settings
  "ios": {
    "bundleIdDev": "io.2060.mobileagent.dev",
    "bundleIdStaging": "io.2060.mobileagent.st",
    "bundleIdProd": "io.2060.mobileagent.m",
    "displayNameDev": "Hologram dev",
    "displayNameStaging": "Hologram staging",
    "displayNameProd": "Hologram",
    // Optional: override iOS permission string templates (use {appName} as placeholder)
    "permissionStrings": {
      "NSCameraUsageDescription": "{appName} uses your camera to scan invitations and take pictures to share with your connections.",
      "NSFaceIDUsageDescription": "{appName} uses Face ID to protect your wallet.",
      "NSMicrophoneUsageDescription": "{appName} uses your microphone to record voice notes you can share with your connections. These notes are end-to-end encrypted.",
      "NSPhotoLibraryAddUsageDescription": "{appName} accesses gallery to save photos and videos you have received.",
      "NSPhotoLibraryUsageDescription": "{appName} accesses gallery to let you pick pictures and videos to share with your connections. This data will be end-to-end encrypted"
    }
  },

  // Environment variable overrides (merged into .env.* files)
  "env": {
    "common": {
      "BASE_INVITATION_URL": "https://hologram.zone"
    },
    "dev": {
      "DEFAULT_SERVICE_ALIAS": "Welcome to Hologram! (dev)",
      "BACKUP_NAME": "Hologram-wallet-backup-dev.zip"
    },
    "staging": {
      "DEFAULT_SERVICE_ALIAS": "Welcome to Hologram!",
      "BACKUP_NAME": "Hologram-wallet-backup-staging.zip"
    },
    "prod": {
      "DEFAULT_SERVICE_ALIAS": "Welcome to Hologram!",
      "BACKUP_NAME": "Hologram-wallet-backup.zip"
    }
  }
}
```

## How It Works

### apply-brand.js

Run `node brand/apply-brand.js [path-to-config.json]` to apply a brand configuration. If no path is given, it uses the default `brand/config.json`.

The script:

1. **Updates `.env.*` files** — Sets `APP_NAME` and merges any `env.common` / `env.<flavor>` overrides
2. **Updates Android `strings.xml`** — Sets `app_name` in each flavor's `res/values/strings.xml`
3. **Updates Android `colors.xml`** — Sets splash screen background colors
4. **Updates Android `build.gradle`** — Overrides `applicationId` and `namespace` if specified
5. **Updates iOS `Info-*.plist`** — Sets `CFBundleDisplayName`, iOS permission strings (camera, Face ID, microphone, photo library), `NSUbiquitousContainerName`, and `CFBundleURLName`
6. **Updates iOS `project.pbxproj`** — Overrides `PRODUCT_BUNDLE_IDENTIFIER` for all targets and share extensions
7. **Copies brand assets** — If `assets/` directory exists alongside the config, copies icons, Firebase configs, and splash images into the native project directories

### Locale Strings

All user-facing "Hologram" references in locale files (`src/locales/*.json`) use the `{{appName}}` i18next interpolation variable. This is automatically populated from `Config.APP_NAME` (via `react-native-config`) at i18next initialization time.

### What the Branding Repo Does

The external `hologram-app-branding` repository:

1. Checks out `hologram-app` at a pinned tag
2. Replaces `brand/config.json` and `brand/assets/` with brand-specific files
3. Runs `node brand/apply-brand.js`
4. Builds the app using the standard build commands

## Flavor / Scheme Suffixes

| Environment | Android applicationId suffix | iOS bundle ID example         |
|-------------|------------------------------|-------------------------------|
| dev         | `.dev`                       | `io.2060.mobileagent.dev`     |
| staging     | `.st`                        | `io.2060.mobileagent.st`      |
| prod        | `.m`                         | `io.2060.mobileagent.m`       |

These suffixes are applied on top of the base `applicationId` / bundle ID from `config.json`.
