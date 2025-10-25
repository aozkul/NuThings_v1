# PayPal Integration (Server-side Orders)

## Dosyalar
- src/lib/paypal.ts
- src/pages/api/paypal/create-order.ts
- src/pages/api/paypal/capture-order.ts
- src/components/payment/CheckoutPayPal.tsx
- src/pages/paypal-demo.tsx
- .env.local.example

## Kurulum
1) `.env.local.example` dosyasını `.env.local` olarak kopyalayın ve anahtarları doldurun.
2) Sandbox için `PAYPAL_ENV=sandbox` bırakın. Canlıya geçince `PAYPAL_ENV=live` yapın ve canlı anahtarları girin.
3) `npm install` ve `npm run dev` ardından `http://localhost:3000/paypal-demo` adresine gidin.

## Not
- Order create/capture sunucu tarafında yapılır. Frontend sadece butonu gösterir ve API'leri çağırır.
- Ücretlendirme ve sipariş kayıt akışınızı capture sonrası sunucu tarafında ekleyin.
