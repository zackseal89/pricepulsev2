"use client";

import React, { useEffect, useState } from "react";
import {
    Bell,
    TrendingDown,
    TrendingUp,
    Package,
    AlertCircle,
    CheckCheck,
    Filter,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const res = await fetch("/api/alerts"); // We'll need to create this route
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (err) {
            toast.error("Failed to fetch alerts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const markRead = async (id: string) => {
        try {
            await fetch("/api/alerts/read", {
                method: "PATCH",
                body: JSON.stringify({ alertId: id }),
            });
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/alerts/read", {
                method: "PATCH",
                body: JSON.stringify({ all: true }),
            });
            setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
            toast.success("All alerts marked as read");
        } catch (err) {
            toast.error("Failed to update alerts");
        }
    };

    const getAlertStyle = (type: string) => {
        switch (type) {
            case 'price_drop': return { icon: TrendingDown, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
            case 'price_increase': return { icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' };
            case 'out_of_stock': return { icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' };
            default: return { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' };
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Intelligence Inbox</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Detailed record of every detected market shift.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl font-bold gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                    <Button
                        onClick={markAllRead}
                        className="rounded-xl font-bold gap-2"
                        disabled={alerts.every(a => a.isRead)}
                    >
                        <CheckCheck className="w-4 h-4" /> Mark All Read
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <Card className="p-12 text-center border-dashed bg-muted/20">
                        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold">No Alerts Yet</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                            Deploy your agents to start receiving price and inventory alerts.
                        </p>
                    </Card>
                ) : alerts.map((alert) => {
                    const style = getAlertStyle(alert.alertType);
                    return (
                        <Card
                            key={alert._id}
                            onClick={() => !alert.isRead && markRead(alert._id)}
                            className={cn(
                                "border-none shadow-md hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden",
                                !alert.isRead ? "bg-background ring-1 ring-primary/20" : "bg-background/40 opacity-70"
                            )}
                        >
                            {!alert.isRead && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            )}
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex gap-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", style.bg)}>
                                        <style.icon className={cn("w-6 h-6", style.color)} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-sm uppercase tracking-tight">
                                                {alert.competitorName}: {alert.alertType.replace('_', ' ')}
                                            </h3>
                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                {formatDistanceToNow(new Date(alert.triggeredAt))} ago
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold tracking-tight leading-tight">
                                            {alert.productName}
                                        </p>
                                        <div className="flex items-center gap-4 pt-1">
                                            {alert.changePct && (
                                                <Badge variant={alert.changePct < 0 ? "default" : "destructive"} className="rounded-lg px-2 text-[10px] font-black">
                                                    {alert.changePct}%
                                                </Badge>
                                            )}
                                            <div className="text-xs font-medium text-muted-foreground">
                                                <span className="line-through mr-2 opacity-50">${alert.oldValue}</span>
                                                <span className="text-foreground font-black">${alert.newValue}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
