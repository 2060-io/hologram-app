#!/bin/bash

# Source the base script
source "$(dirname "$0")/base.sh"

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