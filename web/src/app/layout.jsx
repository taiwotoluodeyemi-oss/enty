import "./globals.css";

export const metadata = {
  title: "EVTY — Find your next experience",
  description:
    "Discover live events, workshops, festivals, and experiences. Find your people and book with confidence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
