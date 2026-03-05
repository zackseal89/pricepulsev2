import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = user.id;

        const { count: totalCompetitors } = await supabase
            .from('competitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: activeCompetitors } = await supabase
            .from('competitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true);

        // Unread count
        const { count: alertsUnread } = await supabase
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        // Today's alerts
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const { count: alertsToday } = await supabase
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('triggered_at', startOfToday.toISOString());

        // Approximate total products (based on latest snapshot per monitor URL)
        let totalProducts = 0;
        const { data: latestSnapshots } = await supabase
            .from('price_snapshots')
            .select('products, url')
            .eq('user_id', userId)
            .order('scraped_at', { ascending: false })
            .limit(50);

        if (latestSnapshots) {
            const urlMap = new Map();
            for (const snap of latestSnapshots) {
                if (!urlMap.has(snap.url)) {
                    urlMap.set(snap.url, Array.isArray(snap.products) ? snap.products.length : 0);
                }
            }
            totalProducts = Array.from(urlMap.values()).reduce((a, b) => a + b, 0);
        }

        // Biggest drop in 24h
        const { data: biggestPriceDropData } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', userId)
            .eq('alert_type', 'price_drop')
            .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('change_pct', { ascending: true }) // most negative first
            .limit(1);

        const biggestPriceDrop = biggestPriceDropData?.[0];

        const { data: lastScrapeAtData } = await supabase
            .from('competitors')
            .select('last_scraped_at')
            .eq('user_id', userId)
            .order('last_scraped_at', { ascending: false })
            .limit(1);

        const lastScrapeAt = lastScrapeAtData?.[0]?.last_scraped_at;

        // Fetch recent alerts for UI
        const { data: recentAlerts } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', userId)
            .order('triggered_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            totalCompetitors: totalCompetitors || 0,
            activeCompetitors: activeCompetitors || 0,
            totalProducts,
            alertsToday: alertsToday || 0,
            alertsUnread: alertsUnread || 0,
            biggestPriceDrop: biggestPriceDrop ? {
                productName: biggestPriceDrop.product_name,
                competitor: biggestPriceDrop.competitor_name,
                changePct: biggestPriceDrop.change_pct,
                triggeredAt: biggestPriceDrop.triggered_at
            } : null,
            lastScrapeAt: lastScrapeAt,
            recentAlerts: recentAlerts || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
