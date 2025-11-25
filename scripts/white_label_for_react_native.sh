#!/bin/bash

# Source the base script
source "$(dirname "$0")/base.sh"

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
