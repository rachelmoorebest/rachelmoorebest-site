# rachelmoorebest.com

A faithful copy of the live Squarespace site, written as plain HTML/CSS with no build step, ready for GitHub Pages. The text, layout, colors, and sizes come from the live page as of Oct 29, 2026. Start polishing from here.

- `index.html`: the whole site (intro, bio + photo, contact form)
- `styles.css`: all styling (Squarespace's 24-column grid and type scale)
- `contact.js`: contact form behavior
- `assets/`: headshot (original file from Squarespace) and favicon
- `calendar/`: the /calendar availability page (`index.html`, `calendar.js`)
- `scripts/build_busy.py`: turns the public free/busy Google Calendar feed into `calendar/busy.json`
- `.github/workflows/deploy.yml`: publishes the site on every push and every 15 minutes, rebuilding the calendar data each time
- `CNAME`: tells GitHub Pages the domain

Preview locally: `cd ~/rachelmoorebest-site && python3 serve.py`, then open http://localhost:8765. It turns off browser caching, so a normal refresh always shows your latest edits.

To preview /calendar with current data, build it first: `curl -s -o /tmp/feed.ics "https://calendar.google.com/calendar/ical/rmb%40rachelmoorebest.com/public/basic.ics" && python3 scripts/build_busy.py /tmp/feed.ics`. The generated `calendar/busy.json` isn't committed; GitHub builds a fresh one on every publish.

## /calendar

Shows weekday availability (8 AM–6 PM Eastern, 12 weeks ahead) from the free/busy sharing on rmb@rachelmoorebest.com, so clients' assistants can compare calendars and send an invite. Only busy start/end times are published, never event details. Hours and range are set at the top of `scripts/build_busy.py`. If the data is more than 3 hours old, the page warns visitors to confirm times.

## Known differences from Squarespace

1. **Fonts.** Squarespace uses Adobe Fonts *Orpheus Pro* (headings) and *Interface* (text) under its own license. This copy uses the free look-alikes Cormorant Garamond and Jost, so body text wraps a little differently. To use the real fonts, create a Web Project at fonts.adobe.com (included with Creative Cloud) with both fonts, add `rachelmoorebest.com` as a domain, and paste its `<link rel="stylesheet" href="https://use.typekit.net/....css">` tag into `index.html`. `styles.css` already uses `orpheus-pro` and `interface` first, so nothing else changes.
2. **Contact form.** GitHub Pages can't receive form submissions, so the form sends through Web3Forms, which emails each message to you. The access key is on the `<form>` in `index.html` (`data-access-key`). It's meant to be public, so it's fine in the HTML.
3. **Favicon.** Squarespace shows its own default logo. This copy uses a simple RMB icon.

## Hosting (GitHub Pages)

The site lives at github.com/rachelmoorebest/rachelmoorebest-site. **Settings → Pages** uses Source "GitHub Actions" with custom domain `www.rachelmoorebest.com`. Pushing to `main` publishes within about a minute.

## Point the domain (Squarespace Domains → DNS settings)

Change **only** these records. **Leave the MX records (Gmail) and the `google-site-verification` TXT record alone.**

| Type  | Host | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | `<your-github-username>.github.io` |

Delete the old Squarespace website records (A records starting 198.x and `www → ext-sq.squarespace.com`). Squarespace may group these as a "Squarespace Defaults" preset.
