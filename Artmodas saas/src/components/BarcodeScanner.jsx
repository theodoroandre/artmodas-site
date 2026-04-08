import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function BarcodeScanner({ onScan, onClose }) {
  const ref = useRef(null);
  const scannerRef = useRef(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const id = "barcode-reader-" + Date.now();
    ref.current.id = id;
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 120 } },
      (text) => {
        scanner.stop().catch(() => {});
        onScan(text);
      },
      () => {}
    ).catch((e) => {
      setErr("Nao foi possivel acessar a camera. Verifique as permissoes.");
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ zIndex: 200 }}>
      <div className="mod" style={{ maxWidth: 400, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sy" style={{ fontWeight: 700, fontSize: 16 }}>Escanear Codigo de Barras</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {err
          ? <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", padding: 20 }}>{err}</p>
          : <div ref={ref} style={{ width: "100%", borderRadius: 8, overflow: "hidden" }} />
        }
        <p style={{ color: "#64748b", fontSize: 11, textAlign: "center", marginTop: 10 }}>Aponte a camera para o codigo de barras</p>
      </div>
    </div>
  );
}
