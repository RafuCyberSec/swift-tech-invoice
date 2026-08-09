# Swift Tech Invoice Manager

Welcome to the official Swift Tech & Games Invoice Manager. We built this to be lightning fast, beautifully responsive, and incredibly easy to plug right into our SaaS ecosystem.

If you hate bloated software, you'll love this. It runs entirely on Next.js with a snappy local SQLite database, meaning it's lightweight, completely secure, and requires zero messy cloud configuration to get going.

## What makes it special?

* **No lag, no wait.** It boots instantly. The database runs completely locally and dumps to a single `.db` file.
* **Pixel-perfect A4 printing.** When you hit print, you get a gorgeous, perfectly scaled A4 invoice that looks identical on screen and on paper.
* **Fluid mobile design.** Generate invoices from your phone without fighting the layout. The UI actively watches your screen size and scales the live preview so nothing ever gets cut off.
* **Plug and play.** It's built to slide right into the Swift Tech SaaS suite. 
* **Built-in authentication.** Secure admin accounts, session persistence, and instant login out of the box.

## Getting it running

You don't need a DevOps degree to spin this up. Just grab the code, install the dependencies, and start the engine.

1. Install the packages:
```bash
npm install
```

2. Boot the development server:
```bash
npm run dev
```

3. Open your browser and head to `http://localhost:3000`. 

That's literally it. The database auto-generates itself on the first run.

## Default Credentials

If you're booting this up for the first time, you can log in right away using the baked-in admin account. 

**Email:** `rafay@swifttechngames.com`
**Password:** `RafuCyberSec@2001`

We highly recommend changing this password immediately after your first login if you plan on exposing this to the web.

## Tech Stack

We kept it modern and clean:
* **Next.js 16** for the framework and API routing.
* **NextAuth** handling the security and session cookies.
* **SQL.js** managing the local database.
* **Puppeteer** doing the heavy lifting for perfectly rendered PDF generation.
* **Vanilla CSS** because frameworks like Tailwind sometimes just get in the way of building a truly custom, beautiful interface.

## Notes on Deployment

If you are throwing this onto a server or VPS, just make sure the `database` folder has write permissions so the `.db` file can save your invoices safely. If you are deploying to a serverless environment like Vercel, be aware that local SQLite files wipe on every new deployment, so you'll want to map the storage to something persistent.

Enjoy generating invoices that actually look good!
