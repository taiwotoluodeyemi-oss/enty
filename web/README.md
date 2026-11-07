# EVTY Web — discovery UI starter

This is a separate Next.js App Router frontend workspace alongside the existing Express/Prisma API. It applies the supplied Eventra reference's editorial event-discovery direction (search-first hero, category filters, responsive event cards, and host CTA) while keeping EVTY's brand and ticketing-marketplace direction.

## Run locally

```bash
cd web
npm install
npm run dev
```

The initial event cards are illustrative UI data, not live listings or confirmed event inventory. The current page is a design foundation; it does not yet connect to EVTY API endpoints, create orders, collect payments, issue tickets, or implement organizer authentication. Those workflows must be wired to the API with server-side payment verification and inventory protections before launch.

## Reference integration

The supplied Eventra archive is a design/interaction reference. Do not copy its brand identity, API assumptions, auth storage behavior, or unrelated hackathon/project product scope into EVTY. Build EVTY-specific event detail, checkout, organizer, gate, and admin experiences against the EVTY API.
