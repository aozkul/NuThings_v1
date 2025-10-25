# Go-Live Checklist (PayPal)

1) **Use LIVE credentials**
   - Set in `.env.local`:
     - `PAYPAL_ENV=live`
     - `NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID`
     - `PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID`
     - `PAYPAL_CLIENT_SECRET=YOUR_LIVE_CLIENT_SECRET`
   - Restart your server after changes.

2) **UI funding options (optional)**
   - If you want to hide card funding in the button UI, set:
     - `NEXT_PUBLIC_PAYPAL_DISABLE_CARD=true`
   - Otherwise leave it `false` (recommended for live).

3) **CSP & Networking**
   - Allow these domains in production hosting (already configured in `public/_headers` and addendum):
     - `https://www.paypal.com`
     - `https://www.paypalobjects.com`
     - `https://api-m.paypal.com`
   - If your platform has its own CSP layer (Vercel/Netlify/Nginx), merge the same directives there.

4) **Server capture & order storage**
   - You already have server-side create/capture at:
     - `/api/paypal/create-order`
     - `/api/paypal/capture-order`
   - Persist successful captures in your DB (order id, amount, payer, status).

5) **(Optional) Webhooks**
   - For highest integrity, add a webhook for `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.COMPLETED`.
   - Compare webhook payload with your local order data before fulfillment.

6) **Test Live**
   - Deploy with live keys, make a small-value real transaction using a real PayPal account.
   - Verify capture response and your order records.

