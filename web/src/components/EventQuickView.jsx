"use client";

import { useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_EVTY_API_URL || "http://localhost:4000/api/v1").replace(/\\/+$/, "");

function formatDate(value) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value));
}

function formatPrice(ticket) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: ticket.currency,
    maximumFractionDigits: 2
  }).format(ticket.priceMinor / 100);
}

export default function EventQuickView({ event }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function showDetails() {
    setDetails(null);
    setError("");
    setLoading(true);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    fetch(apiBase + "/events/" + encodeURIComponent(event.id), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store"
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Event details could not be loaded.");
      if (!payload.data) throw new Error("The event service returned an unexpected response.");
      setDetails(payload.data);
    }).catch((requestError) => {
      if (requestError.name !== "AbortError") setError(requestError.message || "Please try again.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [open, event.id]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button className="event-directory-quick-view" type="button" onClick={showDetails} aria-haspopup="dialog">
        Quick view <span aria-hidden="true">↗</span>
      </button>
      {open && (
        <div className="event-dialog-backdrop" role="presentation" onMouseDown={(mouseEvent) => {
          if (mouseEvent.target === mouseEvent.currentTarget) setOpen(false);
        }}>
          <section className="event-dialog event-dialog-directory" role="dialog" aria-modal="true" aria-labelledby={"quick-view-title-" + event.id}>
            <button className="event-dialog-close" type="button" onClick={() => setOpen(false)} aria-label="Close event details">×</button>
            <div className="event-dialog-visual visual-tech" aria-hidden="true"><span>{event.title.slice(0, 4).toUpperCase()}</span></div>
            <div className="event-dialog-content">
              <p className="eyebrow">EVENT DETAILS · {event.city}</p>
              <h2 id={"quick-view-title-" + event.id}>{details?.title || event.title}</h2>
              {loading && <p className="event-dialog-status" role="status">Loading event details…</p>}
              {error && <p className="event-dialog-error" role="alert">{error}</p>}
              {details && (
                <>
                  <p className="event-dialog-description">{details.description || "Join the experience. Discover the details and choose the ticket that suits you."}</p>
                  <div className="event-dialog-facts">
                    <div><span>DATE & TIME</span><strong>{formatDate(details.startsAt)}</strong></div>
                    <div><span>VENUE</span><strong>{details.venueName}</strong><small>{details.city}</small></div>
                    <div><span>ORGANISED BY</span><strong>{details.organizer?.displayName || "EVTY organiser"}</strong></div>
                  </div>
                  <div className="event-dialog-tickets">
                    <h3>Tickets</h3>
                    {details.ticketTypes?.length ? details.ticketTypes.map((ticket) => (
                      <div className="event-dialog-ticket" key={ticket.id}>
                        <div><strong>{ticket.name}</strong><small>{ticket.available > 0 ? ticket.available + " available" : "Sold out"}</small></div>
                        <b>{formatPrice(ticket)}</b>
                      </div>
                    )) : <p>Ticket options will be announced soon.</p>}
                  </div>
                </>
              )}
              <div className="event-dialog-actions">
                <a className="button button-dark" href={"/events/" + encodeURIComponent(event.id)}>Full event page <span aria-hidden="true">↗</span></a>
                <button className="button button-outline" type="button" onClick={() => setOpen(false)}>Back to events</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
