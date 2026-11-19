import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

out = Path(sys.argv[1] if len(sys.argv) > 1 else "e2e-out")
title = os.environ.get("SUMMARY_TITLE", "E2E flows")
artifact_url = os.environ.get("ARTIFACT_URL", "")

rows = []
planned = (out / "flows.txt").read_text().split() if (out / "flows.txt").exists() else []
reported = {report.stem for report in (out / "junit").glob("*.xml")}
for name in planned:
    if name not in reported:
        rows.append((name, "no report", "", "Maestro wrote no report (crash or timeout)"))
for report in sorted((out / "junit").glob("*.xml")):
    try:
        cases = ET.parse(report).getroot().iter("testcase")
    except ET.ParseError as error:
        rows.append((report.stem, "no report", "", str(error)))
        continue
    for case in cases:
        failure = case.find("failure")
        if failure is None:
            failure = case.find("error")
        passed = failure is None and case.get("status", "SUCCESS") in ("SUCCESS", "WARNING")
        message = "" if failure is None else (failure.get("message") or failure.text or "").strip()
        time = f"{float(case.get('time', 0)):.0f} s"
        rows.append((case.get("name", report.stem), "passed" if passed else "failed", time, message))

skipped_file = out / "skipped.txt"
skipped = None
if skipped_file.exists():
    skipped = [line.split(maxsplit=1) for line in skipped_file.read_text().splitlines() if line.strip()]

lines = [f"### {title}", ""]
if skipped is not None:
    failed = [name for name, result, _, _ in rows if result != "passed"]
    infra = [f"{flow} ({services})" for flow, services in skipped]
    lines += [f"**Failed:** {', '.join(failed) or 'none'}", "", f"**Skipped: infra:** {', '.join(infra) or 'none'}", ""]
lines += ["| Flow | Result | Time | Failure |", "| --- | --- | --- | --- |"]
for name, result, time, message in rows:
    message = " ".join(message.split())[:200].replace("|", "\\|")
    lines.append(f"| {name} | {result} | {time} | {message} |")
if not rows:
    lines.append("| none | skipped: infra | | |" if skipped else "| none | no report | | |")
if artifact_url:
    lines += ["", f"Recordings, app logs and Maestro output: [artifact]({artifact_url})"]

with open(os.environ.get("GITHUB_STEP_SUMMARY", "/dev/stdout"), "a") as summary:
    summary.write("\n".join(lines) + "\n")
