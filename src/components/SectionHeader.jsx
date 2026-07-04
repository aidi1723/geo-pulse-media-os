import React from "react";

export default function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="panel-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {action}
    </div>
  );
}
