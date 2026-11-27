#!/usr/bin/env bash
set -euo pipefail
LIMIT=${1:-200}

attempts=$(
  gh run list --workflow e2e-local.yml --limit "$LIMIT" --json databaseId,attempt,headSha,conclusion \
    -q '.[] | [.databaseId, .attempt, .headSha, .conclusion] | @tsv' |
    while read -r id count sha last; do
      echo "$sha $last"
      for ((n = 1; n < count; n++)); do
        earlier=$(gh api "repos/{owner}/{repo}/actions/runs/$id/attempts/$n" -q .conclusion) || exit
        echo "$sha $earlier"
      done
    done
)

awk '$2 == "success" { passed[$1] = 1 }
  $2 == "failure" || $2 == "timed_out" { failed[$1] = 1 }
  END {
    for (sha in passed) { measured++; if (sha in failed) { flaky++; flaky_shas = flaky_shas " " substr(sha, 1, 7) } }
    for (sha in failed) if (!(sha in passed)) { measured++; only_failed++; failed_shas = failed_shas " " substr(sha, 1, 7) }
    printf "%d SHAs measured\n", measured
    printf "%d flaky (%.1f%%):%s\n", flaky, measured ? 100 * flaky / measured : 0, flaky_shas
    printf "%d only failed:%s\n", only_failed, failed_shas
    if (measured < 50) print "warning: fewer than 50 SHAs, too few to trust the rate"
  }' <<<"$attempts"
