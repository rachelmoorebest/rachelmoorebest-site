# rachelmoorebest.com

A faithful copy of the live Squarespace site, written as plain HTML/CSS with no build step, ready for GitHub Pages. The text, layout, colors, and sizes come from the live page as of Oct 29, 2026. Start polishing from here.

- `index.html`: the whole site (intro, bio + photo, contact form)
- `styles.css`: all styling (Squarespace's 24-column grid and type scale)
- `contact.js`: contact form behavior
- `assets/`: headshot (original file from Squarespace) and favicon
- `CNAME`: tells GitHub Pages the domain

Preview locally: `cd ~/rachelmoorebest-site && python3 serve.py`, then open http://localhost:8765. It turns off browser caching, so a normal refresh always shows your latest edits.

## Known differences from Squarespace

1. **Fonts.** Squarespace uses Adobe Fonts *Orpheus Pro* (headings) and *Interface* (text) under its own license. This copy uses the free look-alikes Cormorant Garamond and Jost, so body text wraps a little differently. To use the real fonts, create a Web Project at fonts.adobe.com (included with Creative Cloud) with both fonts, add `rachelmoorebest.com` as a domain, and paste its `<link rel="stylesheet" href="https://use.typekit.net/....css">` tag into `index.html`. `styles.css` already uses `orpheus-pro` and `interface` first, so nothing else changes.
2. **Contact form.** GitHub Pages can't receive form submissions, so the form sends through Web3Forms, which emails each message to you. The access key is on the `<form>` in `index.html` (`data-access-key`). It's meant to be public, so it's fine in the HTML.
3. **Favicon.** Squarespace shows its own default logo. This copy uses a simple RMB icon.

## Put it online (GitHub Pages)

1. Push this folder's `main` branch to a **public** GitHub repository named `rachelmoorebest-site`.
2. Open **Settings → Pages**, set Source to "Deploy from a branch", and pick `main`, then `/ (root)`.
3. Enter `www.rachelmoorebest.com` under **Custom domain**. Tick **Enforce HTTPS** once it becomes available.

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
