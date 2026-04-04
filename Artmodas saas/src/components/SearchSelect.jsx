import { useState, useRef, useEffect } from "react";

export default function SearchSelect({ options, value, onChange, placeholder = "Buscar..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 160 }}>
      <div
        className="inp"
        onClick={() => { setOpen(!open); setSearch(""); }}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 38 }}
      >
        <span style={{ color: selected ? "#e2e8f0" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ color: "#64748b", fontSize: 10, marginLeft: 6 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e2230", border: "1px solid #334155", borderRadius: 8, marginTop: 4, zIndex: 100, maxHeight: 220, display: "flex", flexDirection: "column" }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            style={{ padding: "8px 10px", border: "none", borderBottom: "1px solid #334155", background: "transparent", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <div style={{ overflowY: "auto", maxHeight: 170 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>Nenhum resultado</div>
            )}
            {filtered.map((o) => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                style={{
                  padding: "8px 12px", cursor: "pointer", fontSize: 13,
                  background: o.value === value ? "#6366f122" : "transparent",
                  color: o.value === value ? "#818cf8" : "#e2e8f0",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#6366f122"}
                onMouseLeave={(e) => e.currentTarget.style.background = o.value === value ? "#6366f122" : "transparent"}
              >
                {o.label}
                {o.sub && <span style={{ color: "#64748b", fontSize: 11, marginLeft: 6 }}>{o.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
