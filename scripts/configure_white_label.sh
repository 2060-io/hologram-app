#!/bin/bash

if [[ "$OSTYPE" == "darwin"* ]]; then
  # BSD sed needs the empty argument for -i ''
  SED_CMD=(sed -E -i '')
else
  # GNU sed
  SED_CMD=(sed -E -i)
fi

# helper to run sed with provided expressions and files
inplace_sed() {
  # call sed with safe array expansion so the empty '' arg is preserved on macOS
  "${SED_CMD[@]}" "$@"
}

# Exit immediately if a command exits with a non-zero status
set -e

# ---------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------
whiteLabelDir="white_labels/$WHITE_LABEL_DIR/"

[[ ! -d $whiteLabelDir ]] && echo "Error: White label ${WHITE_LABEL_DIR} not found in './white_labels/' folder" && exit 1

envFile="${whiteLabelDir}.env.example"

if [[ ! -f "$envFile" ]]; then
  echo "Error: env file not found: $envFile" >&2
  exit 1
fi

# load and export all valid shell KEY=VALUE lines from envFile
set -a
. "$envFile"
set +a

# ---------------------------------------------------------------------
# Update Android App Name
# ---------------------------------------------------------------------
echo -e "\t=> Updating Android App Name"
# File path
STRINGS_FILE_PATH="android/app/src/staging/res/values/strings.xml"
inplace_sed "s#<string name=\"app_name\">[^<]*</string>#<string name=\"app_name\">$APP_NAME</string>#" $STRINGS_FILE_PATH
echo -e "\t=> Set Android App Name Done"


# ---------------------------------------------------------------------
# Update Android Splash Screen color
# ---------------------------------------------------------------------
echo -e "\t=> Updating Android Splash Screen Color"
# File path
COLORS_FILE_PATH="android/app/src/main/res/values/colors.xml"
inplace_sed "s|<color name=\"splashscreen_background_staging\">[^<]*</color>|<color name=\"splashscreen_background_staging\">$ANDROID_SPLASH_SCREEN_COLOR</color>|" $COLORS_FILE_PATH
echo -e "\t=> Set Android Splash Screen Color Done"


# ---------------------------------------------------------------------
# Update Android App Icons and google-services.json
# ---------------------------------------------------------------------
echo -e "\t=> Copying android base directory into ./android"
ANDROID_SRC="${whiteLabelDir}android/"
ANDROID_DST="android/"
cp -rf $ANDROID_SRC $ANDROID_DST
echo -e "\t=> Set Copying android base directory into ./android Done"


# ---------------------------------------------------------------------
# Update Android applicationId
# ---------------------------------------------------------------------
echo -e "\t=> Updating Android applicationId"
MAIN_ACTIVITY_CLASS_SRC="android/app/src/main/java/io/twentysixty/mobileagent/MainActivity.kt"
MAIN_APPLICATION_CLASS_SRC="android/app/src/main/java/io/twentysixty/mobileagent/MainApplication.kt"
BUILD_GRADLE_SRC="android/app/build.gradle"
PROGUARD_RULES_SRC="android/app/proguard-rules.pro"
PACKAGE_JSON_SRC="package.json"
inplace_sed "s|io.twentysixty.mobileagent|$BASE_APP_ID|g" $MAIN_ACTIVITY_CLASS_SRC
inplace_sed "s|io.twentysixty.mobileagent|$BASE_APP_ID|g" $MAIN_APPLICATION_CLASS_SRC
inplace_sed "s|io.twentysixty.mobileagent|$BASE_APP_ID|g" $BUILD_GRADLE_SRC
inplace_sed "s|io.twentysixty.mobileagent|$BASE_APP_ID|g" $PROGUARD_RULES_SRC
inplace_sed "s|io.twentysixty.mobileagent|$BASE_APP_ID|g" $PACKAGE_JSON_SRC
echo -e "\t=> Set Android applicationId Done"


# ---------------------------------------------------------------------
# Update iOS App Name In Strings
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS App name"
PLIST_FILE_PATH="ios/hologram/InfoPlist/Info-Staging.plist"
inplace_sed "/<key>CFBundleDisplayName<\/key>/ {n; s|<string>.*</string>|<string>$APP_NAME</string>|;}" $PLIST_FILE_PATH
echo -e "\t=> Set iOS App Name Done"


# ---------------------------------------------------------------------
# Update iOS Splash Screen Color
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS Splash Screen Color."
# File path
STORYBOARD_FILE_PATH="ios/SplashScreenStaging.storyboard"
inplace_sed "s|(<color[^>]*key=\"backgroundColor\"[^>]*)red=\"[^\"]*\"|\1red=\"$IOS_SPLASH_SCREEN_COLOR_R\"|g" $STORYBOARD_FILE_PATH
inplace_sed "s|(<color[^>]*key=\"backgroundColor\"[^>]*)green=\"[^\"]*\"|\1green=\"$IOS_SPLASH_SCREEN_COLOR_G\"|g" $STORYBOARD_FILE_PATH
inplace_sed "s|(<color[^>]*key=\"backgroundColor\"[^>]*)blue=\"[^\"]*\"|\1blue=\"$IOS_SPLASH_SCREEN_COLOR_B\"|g" $STORYBOARD_FILE_PATH
echo -e "\t=> Set iOS Splash Screen Color Done"


# ---------------------------------------------------------------------
# Update iOS App Icon, Splash Screen Icon, ExportOptions.plist Files, Firebase Files
# ---------------------------------------------------------------------
echo -e "\t=> Copying ios base directory into ios/hologram/"
IOS_FOLDER_SRC="${whiteLabelDir}ios/base/"
IOS_FOLDER_DST="ios/hologram/"
cp -rf $IOS_FOLDER_SRC $IOS_FOLDER_DST
echo -e "\t=> Set Copying ios base directory into ios/hologram/ Done"


# ---------------------------------------------------------------------
# Update iOS Info-Staging.Plist Hologram Labels
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS Info-Staging.Plist Labels"
INFO_PLIST_FILE="ios/hologram/InfoPlist/Info-Staging.plist"
inplace_sed "s|Hologram|$APP_NAME|g" $INFO_PLIST_FILE
echo -e "\t=> Set iOS Info-Staging.Plist Labels Done"


# ---------------------------------------------------------------------
# Update iOS Bundle ID
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS Bundle ID"
# force C locale to avoid "illegal byte sequence"
export LC_ALL=C
IOS_DIRECTORY="ios"
find "$IOS_DIRECTORY" -type f -print0 | while IFS= read -r -d '' file; do
inplace_sed "s|io\.2060\.mobileagent|${BASE_APP_ID}|g" "$file" || echo "skipped: $file"
done
echo -e "\t=> Set iOS Bundle ID Done"

# ---------------------------------------------------------------------
# Update AppIcon.tsx in Base64
# ---------------------------------------------------------------------
echo -e "\t=> Updating App Icon in base64"
APP_ICON_FILE="src/assets/icons/AppIcon.tsx"
inplace_sed "s|(xlinkHref[[:space:]]*=[[:space:]]*\")[^\"]*(\")|\1${APP_ICON_BASE64}\2|g" $APP_ICON_FILE
echo -e "\t=> Set AppIcon.tsx in Base64 Done"


# ---------------------------------------------------------------------
# Update React Native Small App Icon
# ---------------------------------------------------------------------
echo -e "\t=> Updating React Native Small App Icon"
SMALL_ICON_SRC="${whiteLabelDir}ios/base/Images.xcassets/AppIconStaging.appiconset/AppIcon@2x.png"
SMALL_ICON_DST="src/assets/images/smallAppIcon.png"
cp -f $SMALL_ICON_SRC $SMALL_ICON_DST
echo -e "\t=> Set React Native Small App Icon Done"


# ---------------------------------------------------------------------
# Update app.json Hologram Label
# ---------------------------------------------------------------------
echo -e "\t=> Updating app.json Hologram Label"
APP_JSON_FILE="app.json"
inplace_sed "s|Hologram|$APP_NAME|g" $APP_JSON_FILE
echo -e "\t=> Set app.json Hologram Label Done"

# ---------------------------------------------------------------------
# Update Internationalization Files Hologram Labels
# ---------------------------------------------------------------------
echo -e "\t=> Updating Internationalization Files Hologram Labels"
EN_FILE="src/locales/en.json"
ES_FILE="src/locales/es.json"
inplace_sed "s|Hologram|$APP_NAME|g" $EN_FILE
inplace_sed "s|Hologram|$APP_NAME|g" $ES_FILE
echo -e "\t=> Set Internationalization Files Hologram Labels Done"

