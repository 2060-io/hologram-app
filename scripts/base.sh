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

export LC_ALL=C
