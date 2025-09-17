export const dynamic = "force-dynamic";

export default function AdminLayout({children}: { children: React.ReactNode }) {
  // Not: Panel kart/menü düzeni artık her alt bölümün kendi layout’unda.
  // /admin için AdminPanel kendi kartını çiziyor; /admin/newsletter ise newsletter/layout.tsx kullanıyor.
  return <>{children}</>;
}
