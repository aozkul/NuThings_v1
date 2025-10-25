"use client";
import { useState } from "react";
import CheckoutPayPal from "@/src/components/payment/CheckoutPayPal";

export default function PayPalDemoPage() {
  const [amount, setAmount] = useState<string>("9.99");
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  return (
    <main style={{ padding: 20, maxWidth: 680 }}>
      <h1>PayPal Ödeme Demo</h1>
      <p>Server-side <code>create</code> ve <code>capture</code> akışı kullanılır. .env ayarlarınızı doldurun.</p>

      <label style={{ display: "block", margin: "16px 0 8px" }}>Tutar (EUR)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="9.99"
        style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
      />

      <div style={{ marginTop: 24 }}>
        <CheckoutPayPal amount={amount} onApprove={(id) => setLastOrder(id)} />
      </div>

      {lastOrder && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <strong>Son başarılı orderID:</strong> {lastOrder}
        </div>
      )}
    </main>
  );
}
