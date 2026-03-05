const TINYFISH_BASE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse";

// TinyFish SSE event types that come back in the stream
interface TinyFishEvent {
    type: "STEP" | "COMPLETE" | "ERROR" | "PROGRESS";
    status?: "COMPLETED" | "FAILED" | "RUNNING";
    message?: string;        // progress message like "Navigating to page..."
    resultJson?: any;        // final structured data — only on COMPLETE
    error?: string;
}

// Options for the scrape call
interface ScrapeOptions {
    url: string;
    goal: string;
    browserProfile?: "stealth" | "default" | "lite";
    proxyEnabled?: boolean;
    proxyCountry?: string;
    onStep?: (message: string) => void;   // callback for each streaming step
    onComplete?: (data: any) => void;
    onError?: (error: string) => void;
}

// Main function — reads SSE stream and calls callbacks in real-time
export async function runTinyFishScrape(options: ScrapeOptions): Promise<{
    resultJson: any;
    steps: string[];
    durationMs: number;
}> {
    const startTime = Date.now();
    const steps: string[] = [];

    const response = await fetch(TINYFISH_BASE_URL, {
        method: "POST",
        headers: {
            "X-API-Key": process.env.TINYFISH_API_KEY!,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: options.url,
            goal: options.goal,
            browser_profile: options.browserProfile ?? "stealth",
            proxy_config: {
                enabled: options.proxyEnabled ?? true,
                country_code: options.proxyCountry ?? "US",
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`TinyFish API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let resultJson: any = null;
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";  // keep incomplete line in buffer

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
                const event: TinyFishEvent = JSON.parse(line.slice(6));

                if (event.type === "STEP" || event.type === "PROGRESS") {
                    const msg = event.message ?? "Working...";
                    steps.push(msg);
                    options.onStep?.(msg);
                }

                if (event.type === "COMPLETE" && event.status === "COMPLETED") {
                    resultJson = event.resultJson;
                    options.onComplete?.(event.resultJson);
                }

                if (event.type === "ERROR") {
                    options.onError?.(event.error ?? "Unknown error");
                    throw new Error(event.error ?? "TinyFish agent error");
                }
            } catch (parseErr) {
                // Skip non-JSON lines (comments, keep-alives)
                continue;
            }
        }
    }

    return {
        resultJson,
        steps,
        durationMs: Date.now() - startTime,
    };
}

// Normalize raw price strings to float
export function normalizePrice(raw: string | null | undefined): number {
    if (!raw) return 0;
    const cleaned = raw.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
}

// Goal prompt templates — one per use case
export const SCRAPE_GOALS = {
    productListing: `Extract all products visible on this page as a JSON array. 
    Return: [{"name": string, "sku": string|null, "price": string, "in_stock": boolean, 
    "url": string|null, "discount_label": string|null, "image_url": string|null}]
    Return ONLY the JSON array, no explanation.`,

    promoDetection: `Check if there is an active sale, discount banner, countdown timer, 
    or promotional campaign on this page. 
    Return: {"has_promo": boolean, "promo_description": string|null, "discount_pct": number|null, 
    "promo_label": string|null, "ends_at": string|null}`,

    stockCheck: `For the product shown on this page, extract availability and pricing.
    Return: {"product_name": string, "in_stock": boolean, "stock_level": string, 
    "price": string, "price_was": string|null}`,

    newProducts: `Find all products tagged as new, "just dropped", "new arrival", or recently launched.
    Return: [{"name": string, "price": string, "tag": string, "url": string|null}]`,
};
