"use client";
import {useEffect, useRef, useState, useId} from "react";

type Props = {
  amount: string | number;
  currency?: string;
  referenceId?: string;
  onApprove?: (orderID: string) => void;
};

export default function CheckoutPayPal({amount, currency = "EUR", referenceId, onApprove}: Props) {
  const id = useId().replace(/[:]/g, "");
  const containerId = `pp-btns-${id}`;
  const refId = (referenceId && referenceId.trim()) || `ref-${id}`;
  const amountRef = useRef(String(amount));
  const readyRef = useRef(false);
  const renderedRef = useRef(false);
  const [err, setErr] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "CLIENT_ID_PLACEHOLDER";
  const disableCard = (process.env.NEXT_PUBLIC_PAYPAL_DISABLE_CARD || "false").toLowerCase() === "true";

  // keep latest amount
  useEffect(() => {
    amountRef.current = String(amount);
  }, [amount]);

  // load SDK once and render once
  useEffect(() => {
    if (!clientId || clientId === "CLIENT_ID_PLACEHOLDER") {
      setErr("NEXT_PUBLIC_PAYPAL_CLIENT_ID yok (.env.local).");
      return;
    }

    const scriptId = "paypal-sdk";
    const url = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons&disable-funding=card&commit=true`;

    function inject(): Promise<void> {
      return new Promise((resolve) => {
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
          // stale script without paypal global → remove and re-add
          if (!(window as any).paypal) {
            try {
              existing.remove();
            } catch {
            }
          } else return resolve();
        }
        if (!document.getElementById(scriptId)) {
          const s = document.createElement("script");
          s.id = scriptId;
          s.src = url;
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => setErr("PayPal SDK yüklenemedi.");
          document.head.appendChild(s);
        } else {
          resolve();
        }
      });
    }

    function renderOnce() {
      if (renderedRef.current) return;
      const paypalAny: any = (window as any).paypal;
      const el = document.getElementById(containerId);
      if (!paypalAny || !paypalAny.Buttons || !el) return;

      const inst = paypalAny.Buttons({
        createOrder: function () {
          return fetch("/api/paypal/create-order", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({amount: amountRef.current, currency, reference_id: referenceId}),
          })
            .then((r: any) => (r.ok ? r.json() : r.text().then((t: any) => {
              throw new Error(t);
            })))
            .then((d: any) => d.id as string);
        },
        onApprove: function (data: any) {
          return fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({orderID: data && data.orderID}),
          })
            .then((r: any) => r.json().then((j: any) => ({ok: r.ok, body: j})))
            .then((res: any) => {
              if (!res.ok) {
                setErr("Capture başarısız.");
                return;
              }
              if (onApprove) onApprove(data.orderID);
              alert("Ödeme tamamlandı.");
            });
        },
        onError: function (e: any) {
          setErr("PayPal buton hatası: " + (e && e.toString ? e.toString() : "unknown"));
        },
      });

      try {
        inst.render(`#${containerId}`);
        renderedRef.current = true;
      } catch (e: any) {
        setErr("Render hatası: " + (e && e.toString ? e.toString() : "unknown"));
      }
    }

    inject().then(() => {
      readyRef.current = true;
      // poll briefly until window.paypal and the container exist, then render once
      let tries = 0;
      const iv = setInterval(() => {
        if ((window as any).paypal && document.getElementById(containerId)) {
          clearInterval(iv);
          renderOnce();
        } else if (++tries > 30) {
          clearInterval(iv);
          setErr("PayPal SDK/Container hazır değil.");
        }
      }, 100);
    });

    // unmount: don't remove the DOM node to avoid "container removed" error when HMR toggles
    return () => { /* no-op */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, currency, referenceId]);

  // IMPORTANT: fixed id div; React will not remove it across renders
  return (
    <div>
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
      <div id={containerId} style={{minHeight: 45, minWidth: 260}}/>
    </div>
  );
}
