#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * apply-brand.js
 *
 * Reads brand/config.json and applies the brand overlay to the hologram-app
 * native projects and environment files.
 *
 * Usage:
 *   node brand/apply-brand.js [path-to-brand-config.json]
 *
 * If no path is provided, it defaults to brand/config.json (the built-in Hologram brand).
 *
 * What this script does:
 *   1. Updates APP_NAME in all .env.* files
 *   2. Updates brand-specific env vars (DEFAULT_SERVICE_ALIAS, BACKUP_NAME) in .env.* files
 *   3. Updates Android strings.xml (app_name) for each flavor
 *   4. Updates Android colors.xml (splash screen colors)
 *   5. Updates Android build.gradle (applicationId, namespace) if brand overrides them
 *   6. Updates iOS Info plists (CFBundleDisplayName, permission strings, iCloud container)
 *   7. Updates iOS bundle IDs in project.pbxproj if brand overrides them
 *   8. Copies brand assets (icons, Firebase configs) if present in brand/assets/
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const configPath = process.argv[2] || path.join(__dirname, 'config.json')

if (!fs.existsSync(configPath)) {
  console.error(`Brand config not found: ${configPath}`)
  process.exit(1)
}

const brand = JSON.parse(fs.readFileSync(configPath, 'utf8'))
console.log(`Applying brand: ${brand.appName}`)

// ─── 1. Update .env files ─────────────────────────────────────────────────────

const ENV_FILES = {
  dev: path.join(ROOT, '.env.dev'),
  staging: path.join(ROOT, '.env.staging'),
  prod: path.join(ROOT, '.env.prod'),
}

function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Skipping ${filePath} (not found)`)
    return
  }
  let content = fs.readFileSync(filePath, 'utf8')

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    const line = value.includes(' ') ? `${key}="${value}"` : `${key}=${value}`
    if (regex.test(content)) {
      content = content.replace(regex, line)
    } else {
      content = content.trimEnd() + '\n' + line + '\n'
    }
  }

  fs.writeFileSync(filePath, content)
  console.log(`  Updated ${path.basename(filePath)}`)
}

for (const [env, filePath] of Object.entries(ENV_FILES)) {
  const updates = { APP_NAME: brand.appName }

  // Merge common env overrides
  if (brand.env?.common) {
    Object.assign(updates, brand.env.common)
  }

  // Merge environment-specific overrides
  if (brand.env?.[env]) {
    Object.assign(updates, brand.env[env])
  }

  updateEnvFile(filePath, updates)
}

// ─── 2. Update Android strings.xml (app_name) ────────────────────────────────

const ANDROID_FLAVOR_DIRS = {
  main: path.join(ROOT, 'android/app/src/main/res/values/strings.xml'),
  dev: path.join(ROOT, 'android/app/src/dev/res/values/strings.xml'),
  staging: path.join(ROOT, 'android/app/src/staging/res/values/strings.xml'),
}

const ANDROID_APP_NAMES = {
  main: brand.appName,
  dev: `${brand.appName} dev`,
  staging: `${brand.appName} staging`,
}

function updateAndroidStringsXml(filePath, appName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Skipping ${filePath} (not found)`)
    return
  }
  let content = fs.readFileSync(filePath, 'utf8')
  content = content.replace(
    /<string name="app_name">.*<\/string>/,
    `<string name="app_name">${appName}</string>`,
  )
  fs.writeFileSync(filePath, content)
  console.log(`  Updated ${path.relative(ROOT, filePath)} → "${appName}"`)
}

console.log('Updating Android strings.xml:')
for (const [flavor, filePath] of Object.entries(ANDROID_FLAVOR_DIRS)) {
  updateAndroidStringsXml(filePath, ANDROID_APP_NAMES[flavor])
}

// ─── 3. Update Android colors.xml (splash colors) ────────────────────────────

const COLORS_XML = path.join(ROOT, 'android/app/src/main/res/values/colors.xml')

function updateAndroidColors() {
  if (!fs.existsSync(COLORS_XML)) {
    console.warn(`  Skipping colors.xml (not found)`)
    return
  }
  if (!brand.android) return

  let content = fs.readFileSync(COLORS_XML, 'utf8')

  if (brand.android.splashColor) {
    content = content.replace(
      /<color name="splashscreen_background">.*<\/color>/,
      `<color name="splashscreen_background">${brand.android.splashColor}</color>`,
    )
  }
  if (brand.android.splashColorDev) {
    content = content.replace(
      /<color name="splashscreen_background_dev">.*<\/color>/,
      `<color name="splashscreen_background_dev">${brand.android.splashColorDev}</color>`,
    )
  }
  if (brand.android.splashColorStaging) {
    content = content.replace(
      /<color name="splashscreen_background_staging">.*<\/color>/,
      `<color name="splashscreen_background_staging">${brand.android.splashColorStaging}</color>`,
    )
  }

  fs.writeFileSync(COLORS_XML, content)
  console.log('  Updated Android splash colors')
}

console.log('Updating Android colors:')
updateAndroidColors()

// ─── 4. Update Android build.gradle (applicationId, namespace) ───────────────

function updateAndroidBuildGradle() {
  const buildGradle = path.join(ROOT, 'android/app/build.gradle')
  if (!fs.existsSync(buildGradle) || !brand.android) return

  let content = fs.readFileSync(buildGradle, 'utf8')
  let changed = false

  if (brand.android.applicationId) {
    content = content.replace(/applicationId\s+"[^"]+"/, `applicationId "${brand.android.applicationId}"`)
    // Also update resValue build_config_package in each flavor
    content = content.replace(
      /resValue\s+"string",\s*"build_config_package",\s*"[^"]+"/g,
      `resValue "string", "build_config_package", "${brand.android.applicationId}"`,
    )
    changed = true
  }

  if (brand.android.namespace) {
    content = content.replace(/namespace\s+"[^"]+"/, `namespace "${brand.android.namespace}"`)
    changed = true
  }

  if (changed) {
    fs.writeFileSync(buildGradle, content)
    console.log(
      `  Updated build.gradle (applicationId: ${brand.android.applicationId || 'unchanged'}, namespace: ${brand.android.namespace || 'unchanged'})`,
    )
  }
}

console.log('Updating Android build.gradle:')
updateAndroidBuildGradle()

// ─── 5. Update iOS Info plists (display name, permission strings, iCloud) ─────

const IOS_PLISTS = {
  dev: {
    path: path.join(ROOT, 'ios/hologram/InfoPlist/Info-Dev.plist'),
    displayName: brand.ios?.displayNameDev || `${brand.appName} dev`,
  },
  staging: {
    path: path.join(ROOT, 'ios/hologram/InfoPlist/Info-Staging.plist'),
    displayName: brand.ios?.displayNameStaging || `${brand.appName} staging`,
  },
  prod: {
    path: path.join(ROOT, 'ios/hologram/InfoPlist/Info-Prod.plist'),
    displayName: brand.ios?.displayNameProd || brand.appName,
  },
}

function updateIosPlist(filePath, displayName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Skipping ${filePath} (not found)`)
    return
  }
  let content = fs.readFileSync(filePath, 'utf8')

  // Update CFBundleDisplayName
  content = content.replace(
    /(<key>CFBundleDisplayName<\/key>\s*<string>).*?(<\/string>)/,
    `$1${displayName}$2`,
  )

  // Update permission strings using templates (idempotent — always writes full value)
  const permissionTemplates = {
    NSCameraUsageDescription:
      '{appName} uses your camera to scan invitations and take pictures to share with your connections.',
    NSFaceIDUsageDescription: '{appName} uses Face ID to protect your wallet.',
    NSMicrophoneUsageDescription:
      '{appName} uses your microphone to record voice notes you can share with your connections. These notes are end-to-end encrypted.',
    NSPhotoLibraryAddUsageDescription:
      '{appName} accesses gallery to save photos and videos you have received.',
    NSPhotoLibraryUsageDescription:
      '{appName} accesses gallery to let you pick pictures and videos to share with your connections. This data will be end-to-end encrypted',
  }
  // Allow brand config to override permission strings via ios.permissionStrings
  const brandPermissions = brand.ios?.permissionStrings || {}
  for (const [key, template] of Object.entries(permissionTemplates)) {
    const value = (brandPermissions[key] || template).replace(/\{appName\}/g, brand.appName)
    const regex = new RegExp(`(<key>${key}<\\/key>\\s*<string>)(.*?)(<\\/string>)`, 's')
    content = content.replace(regex, `$1${value}$3`)
  }

  // Update NSUbiquitousContainerName
  content = content.replace(
    /(<key>NSUbiquitousContainerName<\/key>\s*<string>).*?(<\/string>)/,
    `$1${brand.appName}$2`,
  )

  fs.writeFileSync(filePath, content)
  console.log(`  Updated ${path.relative(ROOT, filePath)} → "${displayName}"`)
}

console.log('Updating iOS Info plists:')
for (const [, { path: plistPath, displayName }] of Object.entries(IOS_PLISTS)) {
  updateIosPlist(plistPath, displayName)
}

// ─── 6. Update iOS bundle IDs in project.pbxproj ─────────────────────────────

function updateIosBundleIds() {
  const pbxproj = path.join(ROOT, 'ios/hologram.xcodeproj/project.pbxproj')
  if (!fs.existsSync(pbxproj) || !brand.ios) return

  let content = fs.readFileSync(pbxproj, 'utf8')
  let changed = false

  // Default Hologram bundle IDs to replace
  const bundleIdMap = {
    'io.2060.mobileagent.dev': brand.ios.bundleIdDev,
    'io.2060.mobileagent.st': brand.ios.bundleIdStaging,
    'io.2060.mobileagent.m': brand.ios.bundleIdProd,
  }

  for (const [oldId, newId] of Object.entries(bundleIdMap)) {
    if (!newId || oldId === newId) continue

    // Replace main bundle IDs
    const mainRegex = new RegExp(`PRODUCT_BUNDLE_IDENTIFIER = ${oldId.replace(/\./g, '\\.')};`, 'g')
    content = content.replace(mainRegex, `PRODUCT_BUNDLE_IDENTIFIER = ${newId};`)

    // Replace share extension bundle IDs
    const shareRegex = new RegExp(`PRODUCT_BUNDLE_IDENTIFIER = ${oldId.replace(/\./g, '\\.')}\\.share;`, 'g')
    content = content.replace(shareRegex, `PRODUCT_BUNDLE_IDENTIFIER = ${newId}.share;`)

    changed = true
  }

  if (changed) {
    fs.writeFileSync(pbxproj, content)
    console.log('  Updated iOS bundle IDs in project.pbxproj')
  }
}

console.log('Updating iOS bundle IDs:')
updateIosBundleIds()

// ─── 7. Update iOS plist CFBundleURLName and iCloud container keys ────────────

function updateIosPlistBundleRefs() {
  if (!brand.ios) return

  const plistBundleMap = {
    [path.join(ROOT, 'ios/hologram/InfoPlist/Info-Dev.plist')]: brand.ios.bundleIdDev,
    [path.join(ROOT, 'ios/hologram/InfoPlist/Info-Staging.plist')]: brand.ios.bundleIdStaging,
    [path.join(ROOT, 'ios/hologram/InfoPlist/Info-Prod.plist')]: brand.ios.bundleIdProd,
  }

  for (const [filePath, newBundleId] of Object.entries(plistBundleMap)) {
    if (!fs.existsSync(filePath) || !newBundleId) continue
    let content = fs.readFileSync(filePath, 'utf8')

    // Update CFBundleURLName
    content = content.replace(/(<key>CFBundleURLName<\/key>\s*<string>).*?(<\/string>)/, `$1${newBundleId}$2`)

    // Update iCloud container key (iCloud.<bundleId>)
    content = content.replace(/(<key>)iCloud\.[^<]+(< \/key>)/g, `$1iCloud.${newBundleId}$2`)
    // Also handle the format without space before /key
    content = content.replace(/(<key>)iCloud\.[^<]+(<\/key>)/g, `$1iCloud.${newBundleId}$2`)

    fs.writeFileSync(filePath, content)
  }
  console.log('  Updated iOS plist bundle references')
}

console.log('Updating iOS plist bundle references:')
updateIosPlistBundleRefs()

// ─── 8. Copy brand assets if present ──────────────────────────────────────────

const BRAND_ASSETS = path.join(path.dirname(configPath), 'assets')

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0
  let count = 0
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      count++
    }
  }
  return count
}

// Android assets: brand/assets/android/{flavor}/ → android/app/src/{flavor}/
console.log('Copying brand assets:')
for (const flavor of ['main', 'dev', 'staging']) {
  const src = path.join(BRAND_ASSETS, 'android', flavor)
  const dest = path.join(ROOT, 'android/app/src', flavor)
  const count = copyDirRecursive(src, dest)
  if (count > 0) console.log(`  Android/${flavor}: ${count} files copied`)
}

// Android google-services.json
const googleServicesJson = path.join(BRAND_ASSETS, 'android', 'google-services.json')
if (fs.existsSync(googleServicesJson)) {
  fs.copyFileSync(googleServicesJson, path.join(ROOT, 'android/app/google-services.json'))
  console.log('  Copied google-services.json')
}

// iOS assets: brand/assets/ios/ → ios/
const iosSrc = path.join(BRAND_ASSETS, 'ios')
if (fs.existsSync(iosSrc)) {
  // Firebase plists
  for (const env of ['Dev', 'Staging', 'Prod']) {
    const plist = path.join(iosSrc, `GoogleService-Info-${env}.plist`)
    const dest = path.join(ROOT, `ios/hologram/Firebase/GoogleService-Info-${env}.plist`)
    if (fs.existsSync(plist)) {
      fs.copyFileSync(plist, dest)
      console.log(`  Copied GoogleService-Info-${env}.plist`)
    }
  }

  // App icons: brand/assets/ios/AppIcon.appiconset/ → ios/hologram/Images.xcassets/AppIcon.appiconset/
  const iconSrc = path.join(iosSrc, 'AppIcon.appiconset')
  const iconDest = path.join(ROOT, 'ios/hologram/Images.xcassets/AppIcon.appiconset')
  const iconCount = copyDirRecursive(iconSrc, iconDest)
  if (iconCount > 0) console.log(`  iOS AppIcon: ${iconCount} files copied`)

  // Splash icons
  for (const variant of ['SplashScreenIcon', 'SplashScreenIconDev', 'SplashScreenIconStaging']) {
    const splashSrc = path.join(iosSrc, `${variant}.imageset`)
    const splashDest = path.join(ROOT, `ios/hologram/Images.xcassets/${variant}.imageset`)
    const splashCount = copyDirRecursive(splashSrc, splashDest)
    if (splashCount > 0) console.log(`  iOS ${variant}: ${splashCount} files copied`)
  }
}

console.log(`\nBrand "${brand.appName}" applied successfully.`)
