import Link from "next/link";
import { notFound } from "next/navigation";

const apiBase = (process.env.EVTY_API_URL || process.env.NEXT_PUBLIC_EVTY_API_URL || "http://localhost:4000/api/v1").replace(/\/+$/, "");

function formatCurrency(amountMinor, currency) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Lagos"
  }).format(new Date(value));
}

export default async function EventDetailPage({ params }) {
  const { eventId } = await params;
  let response;
  let payload;

  try {
    response = await fetch(apiBase + "/events/" + encodeURIComponent(eventId), {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (response.ok) payload = await response.json();
  } catch {
    return (
      <main style={{ maxWidth: 760, margin: "80px auto", padding: "0 24px", color: "#171815" }}>
        <Link href="/" style={{ color: "inherit" }}>← Back to discover</Link>
        <h1 style={{ fontSize: 42, letterSpacing: "-.05em" }}>We couldn’t load this event.</h1>
        <p style={{ color: "#777872", lineHeight: 1.7 }}>The event service is temporarily unavailable. Please try again in a moment.</p>
      </main>
    );
  }

  if (response.status === 404 || !payload?.data) notFound();
  if (!response.ok) {
    return (
      <main style={{ maxWidth: 760, margin: "80px auto", padding: "0 24px", color: "#171815" }}>
        <Link href="/" style={{ color: "inherit" }}>← Back to discover</Link>
        <h1 style={{ fontSize: 42, letterSpacing: "-.05em" }}>We couldn’t load this event.</h1>
        <p style={{ color: "#777872", lineHeight: 1.7 }}>The event service returned an error. Please try again in a moment.</p>
      </main>
    );
  }
  const event = payload.data;

  return (
    <main style={{ minHeight: "100vh", background: "#f8f7f4", color: "#171815", padding: "28px 6.5% 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e3dd", paddingBottom: 22 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-.08em", color: "inherit", textDecoration: "none" }}>evty<span style={{ color: "#a4c934" }}>.</span></Link>
        <Link href="/" style={{ color: "#66675f", fontSize: 13 }}>← Discover events</Link>
      </header>

      <section style={{ maxWidth: 900, margin: "70px auto 0" }}>
        <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: ".12em", color: "#777872" }}>EVTY EVENT DETAILS</p>
        <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 1.02, letterSpacing: "-.07em", fontWeight: 600, margin: "18px 0" }}>{event.title}</h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: "#6d6e67", maxWidth: 720 }}>{event.description || "Join the experience. Review the event details and available ticket options below."}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, margin: "36px 0 46px" }}>
          <div style={{ background: "#fff", border: "1px solid #e5e3dd", borderRadius: 10, padding: 20 }}>
            <p style={{ margin: 0, color: "#8b8c84", fontSize: 10, letterSpacing: ".1em" }}>DATE & TIME</p>
            <strong style={{ display: "block", marginTop: 10, lineHeight: 1.5 }}>{formatDateTime(event.startsAt)}</strong>
            <span style={{ color: "#777872", fontSize: 13 }}>Ends {formatDateTime(event.endsAt)}</span>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e5e3dd", borderRadius: 10, padding: 20 }}>
            <p style={{ margin: 0, color: "#8b8c84", fontSize: 10, letterSpacing: ".1em" }}>LOCATION</p>
            <strong style={{ display: "block", marginTop: 10 }}>{event.venueName}</strong>
            <span style={{ color: "#777872", fontSize: 13 }}>{event.city}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e3dd", paddingTop: 28 }}>
          <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: ".12em", color: "#777872" }}>TICKET OPTIONS</p>
          <h2 style={{ fontSize: 32, letterSpacing: "-.05em", margin: "10px 0 22px" }}>Choose your experience.</h2>
          {event.ticketTypes.length === 0 ? (
            <p style={{ color: "#777872" }}>Ticket sales are not open yet. Please check back closer to the event.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {event.ticketTypes.map((ticket) => {
                const available = Math.max(0, ticket.capacity - ticket.soldCount);
                return (
                  <article key={ticket.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18, background: "#fff", border: "1px solid #e5e3dd", borderRadius: 10, padding: 22 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18 }}>{ticket.name}</h3>
                      <p style={{ color: "#777872", margin: "7px 0 0", fontSize: 13 }}>{ticket.description || "Event admission"}</p>
                      <p style={{ color: available > 0 ? "#5d7027" : "#9a4d40", margin: "8px 0 0", fontSize: 12 }}>{available > 0 ? available + " available" : "Sold out"}</p>
                    </div>
                    <strong style={{ fontSize: 20 }}>{formatCurrency(ticket.priceMinor, ticket.currency)}</strong>
                  </article>
                );
              })}
            </div>
          )}
          <p style={{ marginTop: 24, padding: 18, background: "#eeede8", borderRadius: 8, color: "#686960", fontSize: 13, lineHeight: 1.7 }}>
            Secure checkout is not enabled yet. EVTY will accept orders only after payment verification, inventory reservation, and ticket issuance safeguards are active.
          </p>
        </div>
      </section>
    </main>
  );
}
