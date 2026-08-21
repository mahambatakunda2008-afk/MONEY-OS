import { createClient } from "../../lib/supabase";

export type RouteQuote = { id: string; railId: string; name: string; railType: string; feeMinor: number; fee: number; eta: string; currency: string; destinationCountry: string; sufficientBalance: boolean };

export async function getRouteQuote(amount: number, currency: string, destinationCountry: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("money-route-quote-v2", {
    body: { amount, currency, destinationCountry },
  });
  if (error) throw error;
  return data as { quotedAt: string; availableMinor: number; requestedMinor: number; routes: RouteQuote[]; liveProviderQuote: boolean };
}
