# Swift Tech Invoice Manager

Welcome to the official Swift Tech & Games Invoice Manager. 

We built this application with a single goal in mind: to create the fastest, most stunning, and completely frictionless invoicing experience possible. This isn't just another boring utility app—it's a premium piece of software designed to look incredible while getting out of your way.

## Why it stands out

**Instant Everything**
There is no loading screen. There is no cloud-sync delay. Powered by an ultra-optimized local SQLite engine, the entire application boots instantly and saves your data the millisecond you hit the button.

**Pixel-Perfect Printing**
What you see on the screen is exactly what comes out of the printer. The live preview engine perfectly maps your digital inputs into a beautiful, print-ready A4 document in real-time. 

**Flawless on Mobile**
We hate it when web apps break on a phone screen. We custom-built a dynamic scaling engine that actively measures your device width and perfectly frames the invoice preview, whether you are on a massive desktop monitor or a tiny iPhone. Zero clipping, zero scrolling issues.

**Premium Aesthetics**
We completely ditched bulky CSS frameworks. Every single pixel, animation, and layout was handcrafted using vanilla CSS to match the sleek, modern branding of Swift Tech & Games. 

## Administration

Because this is designed to be deployed as part of your SaaS ecosystem, security is fully handled through your server's environment variables. 

To take ownership of the application on your server (like Vercel), simply add these two environment variables to your project settings:

`ADMIN_EMAIL` (Set this to your login email)
`ADMIN_PASSWORD` (Set this to your preferred plain-text password)

The system is smart enough to automatically encrypt and securely hash your password the very first time the server boots up. No manual hashing, no headaches. Just deploy and log in.

Enjoy your new invoice engine!
