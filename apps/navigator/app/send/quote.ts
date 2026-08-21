import { createClient } from "../../lib/supabase";

export type RouteQuote = { id: string; rail: string; fee: number; eta: string; total: number; currency: string; destinationCountry: string };

export async function getRouteQuote(amount: number, currency: string, destinationCountry: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("money-route-quote", {
    body: { amount, currency, destinationCountry },
  });
  if (error) throw error;
  return data as { quotedAt: string; routes: RouteQuote[]; liveProviderQuote: boolean };
}
