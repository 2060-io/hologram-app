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
# Update Android App Icons
# ---------------------------------------------------------------------
echo -e "\t=> Updating Android App Icons"
ANDROID_ICONS_SRC="${whiteLabelDir}android/res/"
ANDROID_ICONS_DST="android/app/src/staging/res/"
cp -rf $ANDROID_ICONS_SRC $ANDROID_ICONS_DST
echo -e "\t=> Set Android App Icons Done"


# ---------------------------------------------------------------------
# Update iOS App Name In Strings
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS App name"
PLIST_FILE_PATH="ios/hologram/InfoPlist/Info-Staging.plist"
inplace_sed "/<key>CFBundleDisplayName<\/key>/ {n; s|<string>.*</string>|<string>$APP_NAME</string>|;}" $PLIST_FILE_PATH
echo -e "\t=> Set iOS App Name Done"


# ---------------------------------------------------------------------
# Update iOS Splash Screen Icon
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS Splash Screen Icon."
SPLASH_ICON_SRC="${whiteLabelDir}ios/Images.xcassets/SplashIcon.png"
SPLASH_ICON_DST="ios/hologram/Images.xcassets/SplashScreenIconStaging.imageset/SplashIcon.png"
cp -f $SPLASH_ICON_SRC $SPLASH_ICON_DST
echo -e "\t=> Set iOS Splash Screen Icon Done"


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
# Update iOS App Icon
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS App Icon."
ICONS_FOLDER_SRC="${whiteLabelDir}ios/Images.xcassets/AppIcon.appiconset/"
ICONS_FOLDER_DST="ios/hologram/Images.xcassets/AppIconStaging.appiconset/"
cp -rf $ICONS_FOLDER_SRC $ICONS_FOLDER_DST
echo -e "\t=> Set iOS App Icon Done"


# ---------------------------------------------------------------------
# Update iOS Info-Staging.Plist Hologram Labels
# ---------------------------------------------------------------------
echo -e "\t=> Updating iOS Info-Staging.Plist Labels"
INFO_PLIST_FILE="ios/hologram/InfoPlist/Info-Staging.plist"
inplace_sed "s|Hologram|$APP_NAME|g" $INFO_PLIST_FILE
echo -e "\t=> Set iOS Info-Staging.Plist Labels Done"

# ---------------------------------------------------------------------
# Update Internationalization Files Hologram Labels
# ---------------------------------------------------------------------
echo -e "\t=> Updating Internationalization Files Hologram Labels"
EN_FILE="src/locales/en.json"
ES_FILE="src/locales/es.json"
inplace_sed "s|Hologram|$APP_NAME|g" $EN_FILE
inplace_sed "s|Hologram|$APP_NAME|g" $ES_FILE
echo -e "\t=> Set Internationalization Files Hologram Labels Done"