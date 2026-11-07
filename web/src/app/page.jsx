"use client";

import { useMemo, useState } from "react";

const categories = ["All events", "Music", "Technology", "Arts & culture", "Business", "Food & drink"];

const events = [
  {
    id: "lagos-live",
    title: "Lagos Live: The City Sessions",
    category: "Music",
    date: "NOV 22",
    time: "7:00 PM",
    place: "Muri Okunola Park, Victoria Island",
    city: "Lagos",
    price: "From ₦8,500",
    tag: "Trending",
    visual: "visual-music",
    mark: "LIVE",
  },
  {
    id: "build-africa",
    title: "Build Africa Summit 2026",
    category: "Technology",
    date: "DEC 04",
    time: "9:00 AM",
    place: "Landmark Event Centre",
    city: "Lagos",
    price: "From ₦25,000",
    tag: "Featured",
    visual: "visual-tech",
    mark: "BA",
  },
  {
    id: "art-after-hours",
    title: "Art After Hours",
    category: "Arts & culture",
    date: "NOV 29",
    time: "6:30 PM",
    place: "Thought Pyramid Art Centre",
    city: "Abuja",
    price: "From ₦5,000",
    tag: "Just added",
    visual: "visual-art",
    mark: "A/H",
  },
  {
    id: "founders-table",
    title: "The Founders’ Table",
    category: "Business",
    date: "DEC 12",
    time: "5:00 PM",
    place: "The Wheatbaker",
    city: "Lagos",
    price: "From ₦15,000",
    tag: "Limited seats",
    visual: "visual-business",
    mark: "FT",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All events");

  const visibleEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const categoryMatches = category === "All events" || event.category === category;
      const queryMatches =
        !normalized ||
        [event.title, event.category, event.place, event.city].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      return categoryMatches && queryMatches;
    });
  }, [query, category]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="EVTY home">
          <span className="brand-symbol">e</span>
          <span>evty<span className="brand-period">.</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="active" href="#discover">Discover</a>
          <a href="#categories">Categories</a>
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
        <div className="section-topline"><span className="eyebrow">CURATED FOR YOU</span><span className="section-note">THE GOOD STUFF, ALL IN ONE PLACE</span></div>
        <div className="section-heading">
          <h2>What’s happening<span className="heading-dot">.</span></h2>
          <p>From spontaneous plans to nights you’ll remember.<br />There’s something with your name on it.</p>
        </div>
        <div className="category-tabs" id="categories" role="group" aria-label="Filter events by category">
          {categories.map((item) => (
            <button key={item} type="button" className={category === item ? "category active" : "category"} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="event-grid">
          {visibleEvents.map((event) => (
            <article className="event-card" key={event.id}>
              <a className={`event-visual ${event.visual}`} href={`/events/${event.id}`} aria-label={`View ${event.title}`}>
                <span className="event-tag">{event.tag}</span>
                <span className="visual-mark">{event.mark}</span>
                <span className="visual-lines" aria-hidden="true" />
                <span className="event-date">{event.date}</span>
              </a>
              <div className="event-meta"><span>{event.category.toUpperCase()}</span><span>{event.city.toUpperCase()}</span></div>
              <h3><a href={`/events/${event.id}`}>{event.title}</a></h3>
              <p className="event-place">{event.place}</p>
              <div className="event-bottom"><span>{event.time}</span><strong>{event.price}</strong></div>
            </article>
          ))}
          {visibleEvents.length === 0 && <p className="empty-state">No events match that search yet. Try another term or category.</p>}
        </div>
        <div className="browse-more"><a className="button button-outline" href="/events">Explore all events <span aria-hidden="true">→</span></a></div>
      </section>

      <section className="host-banner" id="host">
        <div><span className="eyebrow">MADE FOR THE PEOPLE WHO MAKE IT HAPPEN</span><h2>Your event.<br /><em>Your kind of crowd.</em></h2><p>Bring your people together. Create an event, manage your tickets, and keep every moment moving with EVTY.</p></div>
        <a className="button button-light" href="/organizer/events/new">Start hosting <span aria-hidden="true">↗</span></a>
        <div className="host-decoration" aria-hidden="true">✳</div>
      </section>

      <footer className="site-footer"><a className="brand brand-footer" href="/"><span className="brand-symbol">e</span><span>evty<span className="brand-period">.</span></span></a><span>Find your people. Make a moment.</span><span>© EVTY 2026</span></footer>
    </main>
  );
}
