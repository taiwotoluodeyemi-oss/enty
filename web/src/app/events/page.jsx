import Link from "next/link";

const apiBase = (process.env.EVTY_API_URL || process.env.NEXT_PUBLIC_EVTY_API_URL || "http://localhost:4000/api/v1").replace(/\/+$/, "");

function formatPrice(ticket, currency) {
  if (!ticket) return "Tickets coming soon";
  return "From " + new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: ticket.currency || currency,
    maximumFractionDigits: 2
  }).format(ticket.priceMinor / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function EventsPage({ searchParams }) {
  const filters = await searchParams;
  const query = typeof filters.q === "string" ? filters.q.slice(0, 120) : "";
  const city = typeof filters.city === "string" ? filters.city.slice(0, 120) : "";
  const params = new URLSearchParams({ page: "1", limit: "50" });
  if (query) params.set("q", query);
  if (city) params.set("city", city);

  let events = [];
  let unavailable = false;
  try {
    const response = await fetch(apiBase + "/events?" + params.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Event API request failed");
    const payload = await response.json();
    events = Array.isArray(payload.data) ? payload.data : [];
  } catch {
    unavailable = true;
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8f7f4", color: "#171815", padding: "28px 6.5% 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e3dd", paddingBottom: 22 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-.08em", color: "inherit", textDecoration: "none" }}>evty<span style={{ color: "#a4c934" }}>.</span></Link>
        <Link href="/" style={{ color: "#66675f", fontSize: 13 }}>← Home</Link>
      </header>
      <section style={{ maxWidth: 1100, margin: "58px auto 0" }}>
        <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: ".12em", color: "#777872" }}>DISCOVER EVTY</p>
        <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", letterSpacing: "-.07em", margin: "12px 0 24px" }}>All events<span style={{ color: "#a4c934" }}>.</span></h1>
        <form action="/events" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 30 }}>
          <input name="q" defaultValue={query} placeholder="Search events, venues or cities" aria-label="Search events" style={{ flex: "1 1 260px", minWidth: 0, padding: "14px 16px", border: "1px solid #deddd7", borderRadius: 8, background: "#fff" }} />
          <input name="city" defaultValue={city} placeholder="City" aria-label="Filter by city" style={{ flex: "0 1 190px", minWidth: 0, padding: "14px 16px", border: "1px solid #deddd7", borderRadius: 8, background: "#fff" }} />
          <button type="submit" style={{ padding: "14px 22px", border: 0, borderRadius: 8, background: "#171815", color: "#fff", fontWeight: 600 }}>Search events</button>
        </form>

        {unavailable ? (
          <p role="alert" style={{ padding: 24, background: "#fff", border: "1px solid #e5e3dd", borderRadius: 10, color: "#777872" }}>EVTY event discovery is temporarily unavailable. Please try again shortly.</p>
        ) : events.length === 0 ? (
          <p style={{ padding: 24, background: "#fff", border: "1px solid #e5e3dd", borderRadius: 10, color: "#777872" }}>No published events match your search yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {events.map((event) => (
              <article key={event.id} style={{ background: "#fff", border: "1px solid #e5e3dd", borderRadius: 10, padding: 22 }}>
                <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: ".08em", color: "#85867f" }}>{event.city.toUpperCase()} · {formatDate(event.startsAt)}</p>
                <h2 style={{ fontSize: 21, lineHeight: 1.2, letterSpacing: "-.04em" }}>
                  <Link href={"/events/" + encodeURIComponent(event.id)} style={{ color: "inherit", textDecoration: "none" }}>{event.title}</Link>
                </h2>
                <p style={{ fontSize: 13, color: "#777872" }}>{event.venueName}</p>
                <div style={{ borderTop: "1px solid #e5e3dd", paddingTop: 14, marginTop: 18, display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
                  <span>{formatPrice(event.ticketTypes?.[0], event.currency)}</span>
                  <Link href={"/events/" + encodeURIComponent(event.id)} style={{ color: "#52651f", fontWeight: 700 }}>Details →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
