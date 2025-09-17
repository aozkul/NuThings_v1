import {createClient} from "@supabase/supabase-js";
import ClientCampaign from "./ClientCampaign";

export const dynamic = "force-dynamic";

export default async function CampaignPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ✅ sadece mevcut kolonlar
  const {data, error} = await supabase
    .from("products")
    .select("id, name, description, price, image_url")
    .order("created_at", {ascending: false})
    .limit(100);

  if (error) {
    return <div className="p-6 text-red-600">Hata: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-2"><h2 className="text-lg font-semibold">Kampanya Gönderimi</h2></div>
      <ClientCampaign products={(data as any[]) || []} />
    </div>
  );
}
