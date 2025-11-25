#!/bin/bash

# Source the base script
source "$(dirname "$0")/base.sh"

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
grep -Rl "io.2060.mobileagent" ios | xargs sed -E -i '' "s/io\.2060\.mobileagent/${BASE_APP_ID}/g"
echo -e "\t=> Set iOS Bundle ID Done"
