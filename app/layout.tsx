import React from "react";
import "./globals.css";
import DarkModeButton from "@/components/DarkModeButton";
import AdminButton from "@/components/AdminButton";

export const metadata = {
  title: "MIDI Device Database Editor",
  description: "Edit MIDI device parameters and upload icons",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=yes"
        />
      </head>
      <body>
        <header
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid var(--border-color)",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            MIDI Device Database Editor
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <AdminButton />
            <DarkModeButton />
          </div>
        </header>
        <main
          style={{ minHeight: "100vh" }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
