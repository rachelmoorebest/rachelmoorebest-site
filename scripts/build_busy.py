#!/usr/bin/env python3
"""Build calendar/busy.json from Rachel's public free/busy Google Calendar feed.

GitHub Actions runs this every 15 minutes before publishing the site (see
.github/workflows/deploy.yml). It keeps only busy start/end times on weekdays,
inside the visible hours, in Unix seconds. The feed shares free/busy only, so
there are no event details to leak.

Local preview: python3 scripts/build_busy.py, or pass a downloaded .ics file
(curl -o feed.ics <FEED>) if this Mac's Python can't verify HTTPS certificates.
"""
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, time as dtime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

FEED = "https://calendar.google.com/calendar/ical/rmb%40rachelmoorebest.com/public/basic.ics"
ZONE_NAME = "America/New_York"
ZONE = ZoneInfo(ZONE_NAME)
START_HOUR, END_HOUR = 8, 18  # visible window each weekday, Eastern Time
WEEKS_AHEAD = 12              # weeks shown after the current one
OUT = Path(__file__).resolve().parent.parent / "calendar" / "busy.json"


def fetch(url, attempts=3):
    for n in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=30) as res:
                return res.read().decode("utf-8")
        except OSError:
            if n == attempts - 1:
                raise
            time.sleep(5)


def parse_time(params, value):
    """Return (aware datetime, is_all_day) for a DTSTART/DTEND value."""
    if "VALUE=DATE" in params:
        return datetime.strptime(value, "%Y%m%d").replace(tzinfo=ZONE), True
    if value.endswith("Z"):
        return datetime.strptime(value, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc), False
    tz = ZONE
    m = re.search(r"TZID=([^;:]+)", params)
    if m:
        try:
            tz = ZoneInfo(m.group(1).strip('"'))
        except Exception:
            pass  # e.g. a Windows zone name from Outlook; Eastern is the safe guess
    return datetime.strptime(value, "%Y%m%dT%H%M%S").replace(tzinfo=tz), False


def busy_intervals(ics):
    """Every busy event in the feed as (start, end) Unix seconds."""
    ics = re.sub(r"\r?\n[ \t]", "", ics)  # unfold continuation lines
    intervals = []
    for block in ics.split("BEGIN:VEVENT")[1:]:
        fields = {}
        for line in block.split("END:VEVENT")[0].splitlines():
            name, sep, value = line.partition(":")
            if sep:
                key, _, params = name.partition(";")
                fields[key] = (params, value.strip())
        if "DTSTART" not in fields:
            continue
        if fields.get("STATUS", ("", ""))[1] == "CANCELLED":
            continue
        if fields.get("TRANSP", ("", ""))[1] == "TRANSPARENT":
            continue
        start, all_day = parse_time(*fields["DTSTART"])
        if "DTEND" in fields:
            end, _ = parse_time(*fields["DTEND"])
        else:
            end = start + timedelta(days=1 if all_day else 0)
        if end > start:
            intervals.append((start.timestamp(), end.timestamp()))
    return intervals


def merged_within(intervals, lo, hi):
    """Clip intervals to [lo, hi] and merge any that touch or overlap."""
    clipped = sorted((max(s, lo), min(e, hi)) for s, e in intervals if s < hi and e > lo)
    merged = []
    for s, e in clipped:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return [[int(s), int(e)] for s, e in merged]


def main():
    ics = Path(sys.argv[1]).read_text() if len(sys.argv) > 1 else fetch(FEED)
    if "BEGIN:VCALENDAR" not in ics:
        sys.exit("Feed didn't look like a calendar; keeping the last published data.")
    intervals = busy_intervals(ics)
    if not intervals:
        # An empty feed would publish a week of fake "open" time. Fail instead.
        sys.exit("Feed had no busy times; keeping the last published data.")

    today = datetime.now(ZONE).date()
    monday = today - timedelta(days=today.weekday())
    days = []
    for week in range(WEEKS_AHEAD + 1):
        for weekday in range(5):
            d = monday + timedelta(weeks=week, days=weekday)
            lo = datetime.combine(d, dtime(START_HOUR), ZONE).timestamp()
            hi = datetime.combine(d, dtime(END_HOUR), ZONE).timestamp()
            days.append({
                "date": d.isoformat(),
                "start": int(lo),
                "end": int(hi),
                "busy": merged_within(intervals, lo, hi),
            })

    OUT.write_text(json.dumps({
        "generated": int(time.time()),
        "zone": ZONE_NAME,
        "hours": [START_HOUR, END_HOUR],
        "days": days,
    }, separators=(",", ":")))
    print(f"Wrote {OUT.name}: {len(days)} weekdays, {sum(len(d['busy']) for d in days)} busy blocks")


if __name__ == "__main__":
    main()
