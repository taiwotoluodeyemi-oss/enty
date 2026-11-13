# Attendee event discovery and quick view

## User experience

- The homepage event grid loads published events from `GET /api/v1/events`.
- Search and city filters are applied to the live event API.
- Selecting an event poster or title on the homepage opens an in-place quick-view dialog.
- The all-events directory provides a **Quick view** action on each listing.
- The dialog loads current public event details from `GET /api/v1/events/:eventId`, including description, start/end times, venue, organiser display name, ticket categories, prices, and remaining ticket availability.
- The dialog can be dismissed using its close control, the Escape key, or by selecting the backdrop. It also links to the full event page.
- The full event page remains available as a direct route and shows the organiser and ticket options.

## Configuration

Set `NEXT_PUBLIC_EVTY_API_URL` to the public base URL of the EVTY API, including `/api/v1`, in the web application's deployment environment. The development fallback is `http://localhost:4000/api/v1`.

The API must allow browser requests from the deployed web origin through its configured CORS policy.

## Current product boundaries

- Only events with `PUBLISHED` status are exposed by the public discovery and detail endpoints.
- The current event schema does not yet include a cover-image URL or public organiser profile, so the interface uses the existing abstract event artwork and the organiser's display name.
- Ticket prices and availability are informational. Checkout, payment confirmation, inventory reservation, and ticket issuance are not enabled by this quick-view workstream.
- Build, browser, accessibility, and end-to-end checks still need to be run in a connected execution/CI environment before this change is called production-verified.
