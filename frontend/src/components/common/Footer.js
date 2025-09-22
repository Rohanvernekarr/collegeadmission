// SimpleFooter.jsx
import React from "react";

export default function SimpleFooter({ name = "College admission portal" }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-light text-center py-3 border-top">
      <span className="fw-semibold text-dark">
        © {year} {name}
      </span>
    </footer>
  );
}
