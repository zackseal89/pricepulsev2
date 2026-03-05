import { NextRequest } from "next/server";
import { runTinyFishScrape, SCRAPE_GOALS, normalizePrice } from "@/lib/tinyfish";
import { detectChanges } from "@/lib/diffEngine";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { competitorId, urls, customGoal, customUrl } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Set up SSE response
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Helper: send SSE event to frontend
        const sendEvent = async (type: string, data: object) => {
            const payload = `data: ${JSON.stringify({ type, ...data })}\n\n`;
            await writer.write(encoder.encode(payload));
        };

        // Start scraping in background
        (async () => {
            try {
                await sendEvent("agent_start", {
                    message: "🤖 Agent initialized. Launching browser...",
                    competitorId: competitorId || "custom"
                });

                let targetUrls = urls;
                let userId = user?.id;
                let competitorName = "Custom Run";
                let browserProfile: "stealth" | "default" | "lite" = "stealth";
                let proxyEnabled = true;

                if (competitorId && competitorId !== "custom-run") {
                    const { data: competitor, error } = await supabase
                        .from('competitors')
                        .select('*')
                        .eq('id', competitorId)
                        .single();

                    if (error || !competitor) throw new Error("Competitor not found");
                    targetUrls = urls || competitor.monitor_urls;
                    userId = competitor.user_id;
                    competitorName = competitor.name;
                    browserProfile = competitor.browser_profile || "stealth";
                    proxyEnabled = competitor.proxy_enabled ?? true;
                } else if (customUrl) {
                    targetUrls = [customUrl];
                }

                if (!targetUrls || targetUrls.length === 0) throw new Error("No target URLs provided");

                // Scrape all URLs
                const scrapePromises = targetUrls.map(async (url: string) => {
                    await sendEvent("agent_navigate", {
                        message: `🌐 Navigating to ${new URL(url).hostname}...`,
                        url
                    });

                    const result = await runTinyFishScrape({
                        url,
                        goal: customGoal || SCRAPE_GOALS.productListing,
                        browserProfile,
                        proxyEnabled,
                        onStep: async (message) => {
                            await sendEvent("agent_step", { message, url });
                        },
                    });

                    await sendEvent("agent_extracted", {
                        message: `✅ Agent execution complete on ${new URL(url).hostname}`,
                        url,
                        productCount: result.resultJson?.length ?? 0,
                    });

                    return { url, result };
                });

                const allResults = await Promise.all(scrapePromises);

                // If logged in and tracking a real competitor, save snapshots
                if (userId && competitorId && competitorId !== "custom-run") {
                    await sendEvent("agent_processing", { message: "🔍 Analyzing changes..." });

                    for (const { url, result } of allResults) {
                        const products = (result.resultJson ?? []).map((p: any) => ({
                            name: p.name,
                            price: normalizePrice(p.price),
                            priceRaw: p.price,
                            inStock: p.in_stock ?? true,
                            productUrl: p.url ?? null,
                            promoLabel: p.discount_label ?? null,
                            sku: p.sku ?? null,
                            imageUrl: p.image_url ?? null
                        }));

                        const { data: snapshotData, error: snapError } = await supabase
                            .from('price_snapshots')
                            .insert({
                                competitor_id: competitorId,
                                user_id: userId,
                                url,
                                products: products,
                                status: "completed",
                                duration_ms: result.durationMs,
                            })
                            .select()
                            .single();

                        if (!snapError && snapshotData) {
                            const { data: prevSnapshots } = await supabase
                                .from('price_snapshots')
                                .select('products')
                                .eq('competitor_id', competitorId)
                                .eq('url', url)
                                .neq('id', snapshotData.id)
                                .order('scraped_at', { ascending: false })
                                .limit(1);

                            if (prevSnapshots && prevSnapshots.length > 0) {
                                const prevProducts = prevSnapshots[0].products;
                                const changes = detectChanges(prevProducts, products, 0.05);
                                for (const change of changes) {
                                    await supabase.from('alerts').insert({
                                        user_id: userId,
                                        competitor_id: competitorId,
                                        competitor_name: competitorName,
                                        alert_type: change.alertType,
                                        product_name: change.productName,
                                        old_value: change.oldValue,
                                        new_value: change.newValue,
                                        change_pct: change.changePct,
                                        promo_label: change.promoLabel,
                                        is_read: false,
                                    });
                                }
                            }
                        }
                    }

                    await supabase
                        .from('competitors')
                        .update({
                            last_scraped_at: new Date().toISOString(),
                            last_status: "completed",
                        })
                        .eq('id', competitorId);
                }

                await sendEvent("agent_complete", {
                    message: customGoal ? "✅ Agent goal achieved successfully." : "✅ Scrape complete. Intelligence updated.",
                    competitorId,
                });

            } catch (error: any) {
                console.error("Scrape error:", error);
                await sendEvent("agent_error", { message: `❌ Error: ${error.message}` });
            } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
