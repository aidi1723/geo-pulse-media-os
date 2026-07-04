import React from "react";

const classMap = {
  live: "status-live",
  watch: "status-watch",
  locked: "status-locked",
};

export default function StatusBadge({ status, label }) {
  return <span className={`status-pill ${classMap[status]}`}>{label}</span>;
}
