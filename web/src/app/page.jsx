"use client";

import { useEffect, useMemo, useState } from "react";

const cityFilters = ["All events", "Lagos", "Abuja", "Port Harcourt"];
const visualStyles = ["visual-music", "visual-tech", "visual-art", "visual-business"];
const apiBase = (process.env.NEXT_PUBLIC_EVTY_API_URL || "http://localhost:4000/api/v1").replace(/\/+$/, "");

function formatEventDate(value) {
  return new Intl.DateTimeFormat("en-NG", { month: "short", day: "2-digit" }).format(new Date(value)).toUpperCase();
}

function formatEventTime(value) {
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatStartingPrice(ticketType, eventCurrency) {
  if (!ticketType) return "Tickets coming soon";
  return "From " + new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: ticketType.currency || eventCurrency,
    maximumFractionDigits: 2
  }).format(ticketType.priceMinor / 100);
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All events");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  function openEventQuickView(event) {
    setEventDetails(null);
    setDetailsError("");
    setDetailsLoading(true);
    setSelectedEvent(event);
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const url = new URL(apiBase + "/events");
        const normalizedQuery = query.trim();
        if (normalizedQuery) url.searchParams.set("q", normalizedQuery);
        if (city !== "All events") url.searchParams.set("city", city);
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "24");

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store"
        });
        if (!response.ok) throw new Error("The event service returned an error. Please try again.");
        const payload = await response.json();
        if (!Array.isArray(payload.data)) throw new Error("The event service returned an unexpected response.");
        setEvents(payload.data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setEvents([]);
          setError(requestError.message || "EVTY could not load events. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, city, reload]);

  useEffect(() => {
    if (!selectedEvent) return undefined;
    const controller = new AbortController();
    fetch(apiBase + "/events/" + encodeURIComponent(selectedEvent.id), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store"
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Event details could not be loaded.");
      if (!payload.data) throw new Error("The event service returned an unexpected response.");
      setEventDetails(payload.data);
    }).catch((requestError) => {
      if (requestError.name !== "AbortError") setDetailsError(requestError.message || "Please try again.");
    }).finally(() => {
      if (!controller.signal.aborted) setDetailsLoading(false);
    });
    return () => controller.abort();
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setSelectedEvent(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedEvent]);

  const visibleEvents = useMemo(() => events.map((event, index) => {
    const ticketType = event.ticketTypes?.[0];
    return {
      ...event,
      date: formatEventDate(event.startsAt),
      time: formatEventTime(event.startsAt),
      place: event.venueName + ", " + event.city,
      price: formatStartingPrice(ticketType, event.currency),
      tag: ticketType ? "Tickets available" : "Coming soon",
      visual: visualStyles[index % visualStyles.length],
      mark: event.title.slice(0, 4).toUpperCase()
    };
  }), [events]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="EVTY home">
          <span className="brand-symbol">e</span>
          <span>evty<span className="brand-period">.</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="active" href="#discover">Discover</a>
          <a href="#categories">Cities</a>
          <a href="#host">Host an event</a>
        </nav>
        <div className="header-actions">
          <a className="sign-in" href="/login">Sign in</a>
          <a className="button button-dark button-small" href="/signup">Get started <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero" id="discover">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> THE CITY IS YOURS TO EXPLORE</div>
          <h1>Find your next<br /><em>“I was there.”</em></h1>
          <p className="hero-description">
            The people, places, and moments worth showing up for. Discover events
            happening around you—and book your place.
          </p>
          <form className="search-bar" onSubmit={(event) => { event.preventDefault(); document.getElementById("event-list")?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              aria-label="Search events"
              placeholder="Try “live music in Lagos”"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
            <button className="button button-dark search-submit" type="submit">Find events <span aria-hidden="true">↗</span></button>
          </form>
          <div className="popular-searches">
            <span>Popular:</span>
            {["Live music", "Tech", "This weekend"].map((term) => (
              <button key={term} type="button" onClick={() => setQuery(term)}>{term}</button>
            ))}
          </div>
        </div>
        <div className="hero-art" aria-label="Illustration of a lively event crowd">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-ticket"><span>YOUR<br />NIGHT<br /><b>OUT</b></span><i>✳</i></div>
          <div className="art-caption"><span>01 / 04</span><span>GOOD THINGS<br />HAPPEN HERE</span></div>
          <div className="art-spark spark-one">✳</div>
          <div className="art-spark spark-two">✦</div>
        </div>
        <div className="hero-foot"><span>DISCOVER WHAT’S HAPPENING</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="events-section" id="event-list">
        <div className="section-topline"><span className="eyebrow">LIVE EVENT LISTINGS</span><span className="section-note">PUBLISHED EVENTS FROM EVTY ORGANISERS</span></div>
        <div className="section-heading">
          <h2>What’s happening<span className="heading-dot">.</span></h2>
          <p>Real listings, current ticket availability, and clear prices.<br />Find the next reason to get together.</p>
        </div>
        <div className="category-tabs" id="categories" role="group" aria-label="Filter events by city">
          {cityFilters.map((item) => (
            <button key={item} type="button" className={city === item ? "category active" : "category"} onClick={() => setCity(item)}>{item}</button>
          ))}
        </div>
        {loading && <p className="empty-state" role="status">Finding events for you…</p>}
        {error && (
          <div className="empty-state" role="alert">
            <p>{error}</p>
            <button className="button button-outline" type="button" onClick={() => setReload((value) => value + 1)}>Try again</button>
          </div>
        )}
        {!loading && !error && (
          <div className="event-grid">
            {visibleEvents.map((event) => (
              <article className="event-card" key={event.id}>
                <button className={"event-visual event-visual-button " + event.visual} type="button" onClick={() => openEventQuickView(event)} aria-label={"Quick view: " + event.title} aria-haspopup="dialog">
                  <span className="event-tag">{event.tag}</span>
                  <span className="visual-mark">{event.mark}</span>
                  <span className="visual-lines" aria-hidden="true" />
                  <span className="event-date">{event.date}</span>
                </button>
                <div className="event-meta"><span>EVENT</span><span>{event.city.toUpperCase()}</span></div>
                <h3><button className="event-title-button" type="button" onClick={() => openEventQuickView(event)} aria-haspopup="dialog">{event.title}</button></h3>
                <p className="event-place">{event.place}</p>
                <div className="event-bottom"><span>{event.time}</span><strong>{event.price}</strong></div>
              </article>
            ))}
            {visibleEvents.length === 0 && <p className="empty-state">No published events match that search yet. Try another city or search term.</p>}
          </div>
        )}
        <div className="browse-more"><a className="button button-outline" href="/events">Explore all events <span aria-hidden="true">→</span></a></div>
      </section>

      {selectedEvent && (
        <div className="event-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEvent(null); }}>
          <section className="event-dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" aria-describedby="event-dialog-description">
            <button className="event-dialog-close" type="button" onClick={() => setSelectedEvent(null)} aria-label="Close event details">×</button>
            <div className={"event-dialog-visual " + (selectedEvent.visual || "visual-music")} aria-hidden="true"><span>{(selectedEvent.title || "EVTY").slice(0, 4).toUpperCase()}</span></div>
            <div className="event-dialog-content">
              <p className="eyebrow">EVENT DETAILS · {selectedEvent.city}</p>
              <h2 id="event-dialog-title">{eventDetails?.title || selectedEvent.title}</h2>
              {detailsLoading && <p className="event-dialog-status" role="status">Loading event details…</p>}
              {detailsError && <p className="event-dialog-error" role="alert">{detailsError}</p>}
              {eventDetails && (
                <>
                  <p id="event-dialog-description" className="event-dialog-description">{eventDetails.description || "Join the experience. Discover the details and choose the ticket that suits you."}</p>
                  <div className="event-dialog-facts">
                    <div><span>DATE & TIME</span><strong>{formatEventDate(eventDetails.startsAt)} · {formatEventTime(eventDetails.startsAt)}</strong></div>
                    <div><span>VENUE</span><strong>{eventDetails.venueName}</strong><small>{eventDetails.city}</small></div>
                  </div>
                  <div className="event-dialog-tickets">
                    <h3>Tickets</h3>
                    {eventDetails.ticketTypes?.length ? eventDetails.ticketTypes.map((ticket) => {
                      const available = Math.max(0, ticket.capacity - ticket.soldCount);
                      return <div className="event-dialog-ticket" key={ticket.id}><div><strong>{ticket.name}</strong><small>{available > 0 ? available + " available" : "Sold out"}</small></div><b>{formatStartingPrice(ticket, eventDetails.currency).replace("From ", "")}</b></div>;
                    }) : <p>Ticket options will be announced soon.</p>}
                  </div>
                </>
              )}
              <div className="event-dialog-actions">
                <a className="button button-dark" href={"/events/" + encodeURIComponent(selectedEvent.id)}>Full event page <span aria-hidden="true">↗</span></a>
                <button className="button button-outline" type="button" onClick={() => setSelectedEvent(null)}>Back to events</button>
              </div>
            </div>
          </section>
        </div>
      )}

      <section className="host-banner" id="host">
        <div><span className="eyebrow">MADE FOR THE PEOPLE WHO MAKE IT HAPPEN</span><h2>Your event.<br /><em>Your kind of crowd.</em></h2><p>Bring your people together. Create an event, manage your tickets, and keep every moment moving with EVTY.</p></div>
        <a className="button button-light" href="/organizer/events/new">Start hosting <span aria-hidden="true">↗</span></a>
        <div className="host-decoration" aria-hidden="true">✳</div>
      </section>

      <footer className="site-footer"><a className="brand brand-footer" href="/"><span className="brand-symbol">e</span><span>evty<span className="brand-period">.</span></span></a><span>Find your people. Make a moment.</span><span>© EVTY 2026</span></footer>
    </main>
  );
}
