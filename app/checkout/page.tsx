// app/checkout/page.tsx
export const dynamic = "force-dynamic";
export default function CheckoutPage(){
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-3">Checkout</h1>
      <p className="text-neutral-600">Bu sayfa örnektir. Gerçek ödeme entegrasyonu için backend gereklidir.</p>
    </div>
  );
}
