interface Product {
    name: string;
    price: number;
    inStock: boolean;
    promoLabel: string | null;
}

interface AlertPayload {
    alertType: 'price_drop' | 'price_increase' | 'restock' | 'out_of_stock' | 'new_product' | 'promo_detected';
    productName: string;
    oldValue: number | null;
    newValue: number | null;
    changePct: number | null;
    severity: 'high' | 'medium' | 'low';
    promoLabel?: string | null;
}

export function detectChanges(
    prevProducts: Product[],
    newProducts: Product[],
    priceDropThresholdPct: number = 2
): AlertPayload[] {
    const changes: AlertPayload[] = [];
    const prevMap = new Map(prevProducts.map(p => [
        p.name.toLowerCase().trim(), p
    ]));
    const newNames = new Set(newProducts.map(p => p.name.toLowerCase().trim()));

    for (const newProd of newProducts) {
        const key = newProd.name.toLowerCase().trim();
        const prev = prevMap.get(key);

        if (!prev) {
            // New product appeared
            changes.push({
                alertType: "new_product",
                productName: newProd.name,
                oldValue: null,
                newValue: newProd.price,
                changePct: null,
                severity: "medium",
            });
            continue;
        }

        // Price change
        if (prev.price > 0 && newProd.price > 0) {
            const changePct = ((newProd.price - prev.price) / prev.price) * 100;

            if (changePct <= -priceDropThresholdPct) {
                changes.push({
                    alertType: "price_drop",
                    productName: newProd.name,
                    oldValue: prev.price,
                    newValue: newProd.price,
                    changePct: parseFloat(changePct.toFixed(1)),
                    severity: Math.abs(changePct) >= 15 ? "high" : Math.abs(changePct) >= 5 ? "medium" : "low",
                });
            } else if (changePct >= 5) {
                changes.push({
                    alertType: "price_increase",
                    productName: newProd.name,
                    oldValue: prev.price,
                    newValue: newProd.price,
                    changePct: parseFloat(changePct.toFixed(1)),
                    severity: "low",
                });
            }
        }

        // Stock changes
        if (prev.inStock && !newProd.inStock) {
            changes.push({
                alertType: "out_of_stock",
                productName: newProd.name,
                oldValue: null, newValue: null, changePct: null,
                severity: "medium",
            });
        }
        if (!prev.inStock && newProd.inStock) {
            changes.push({
                alertType: "restock",
                productName: newProd.name,
                oldValue: null, newValue: null, changePct: null,
                severity: "medium",
            });
        }

        // New promo
        if (!prev.promoLabel && newProd.promoLabel) {
            changes.push({
                alertType: "promo_detected",
                productName: newProd.name,
                promoLabel: newProd.promoLabel,
                oldValue: null, newValue: null, changePct: null,
                severity: "high",
            });
        }
    }

    // Check for products that disappeared
    for (const [key, prev] of prevMap) {
        if (!newNames.has(key)) {
            changes.push({
                alertType: "out_of_stock",  // treat removal as out of stock
                productName: prev.name,
                oldValue: null, newValue: null, changePct: null,
                severity: "low",
            });
        }
    }

    return changes;
}
