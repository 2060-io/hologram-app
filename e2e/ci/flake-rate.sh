#!/usr/bin/env bash
set -euo pipefail
LIMIT=${1:-200}

gh run list --workflow e2e-local.yml --event pull_request --limit "$LIMIT" \
  --json databaseId,attempt,conclusion \
  -q '.[] | select(.conclusion == "success" or .conclusion == "failure") | [.databaseId, .attempt, .conclusion] | @tsv' |
  while read -r id attempt last; do
    first=$last
    ((attempt > 1)) && first=$(gh api "repos/{owner}/{repo}/actions/runs/$id/attempts/1" -q .conclusion)
    echo "$first $last"
  done |
  awk '{ runs++ }
    $1 == "failure" && $2 == "success" { flaky++ }
    $2 == "failure" { failed++ }
    END {
      if (!runs) { print "no finished run"; exit }
      printf "%d runs: %d passed only on a re-run (%.1f%%), %d still fail\n", runs, flaky, 100 * flaky / runs, failed
    }'
