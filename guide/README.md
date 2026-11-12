# SLG Stakeholders Golf Day — Golfers' Guide

Static golfers' guide for the SLG Stakeholders Golf Day, hosted by Spring Lights Gas: Thursday 26 November 2026, Zimbali Lakes Resort, registration 09h00, tee-off 10h00. The website lives in `dist/` and needs no packages, database or backend. Copied from the CCQ golf day guide and rebranded.

## Check locally

Run `node scripts/check.mjs` from this directory. To preview, run `python3 -m http.server 8765 --directory dist` and visit `http://localhost:8765`.

## Publish

The guide is served by the draw site at `/info/`: after editing `dist/`, run `npm run sync:guide` in `../draw`.

## Content

From the client's flyer and WhatsApp notes (12 November 2026): date, venue, registration and tee-off times, RSVP (by 30 October 2026) on (031) 812 0555 or olivia@slgas.co.za. Refreshments: halfway house, drinks cart, and stations on holes 5, 15 and 18; one halfway voucher per guest, on their cart. The SLG logo comes from slgas.co.za (`dist/assets/slg-logo-card.png`). Countdown dates are in `dist/countdown.js`.

Not yet supplied, so not on the page: format, entry fee, dress code, hole sponsors, competitions, prize-giving/lunch time, and a host message from SLG (the current one is placeholder wording).

Brand colours: navy `#141a4a`, orange `#f37d23`.
