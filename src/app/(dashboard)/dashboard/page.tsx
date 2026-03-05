"use client";

import React from "react";
import {
    TrendingDown,
    TrendingUp,
    Activity,
    Package,
    AlertCircle,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AgentChat } from "@/components/AgentChat";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const [summary, setSummary] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch("/api/dashboard/summary");
                const data = await res.json();
                setSummary(data);
            } catch (err) {
                console.error("Failed to fetch summary:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const dashboardStats = [
        {
            title: "Active Monitors",
            value: summary?.activeCompetitors || "0",
            icon: Activity,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Total Products",
            value: summary?.totalProducts || "0",
            icon: Package,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Alerts Today",
            value: summary?.alertsToday || "0",
            icon: TrendingDown,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Unread Alerts",
            value: summary?.alertsUnread || "0",
            icon: AlertCircle,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
        },
    ];

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Intelligence Feed</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Autonomous e-commerce surveillance active since Jan 2025.</p>
                </div>
                <div className="flex items-center gap-2 bg-background/50 border rounded-2xl px-4 py-2 text-sm font-medium shadow-sm">
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                    <span>{loading ? "Agent Synchronizing..." : "System Healthy"}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full ml-1", loading ? "bg-amber-500" : "bg-emerald-500")} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardStats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-md bg-background/60 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground">{stat.title}</CardTitle>
                            <div className={stat.bg + " p-2.5 rounded-xl transition-transform group-hover:scale-110"}>
                                <stat.icon className={"h-5 w-5 " + stat.color} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tighter">
                                {loading ? "..." : stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">+12%</span> from last week
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Centerpiece Agent Chat/Viewer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                            Agent Command
                        </h2>
                    </div>

                    <AgentChat />
                </div>

                {/* Recent Alerts Feed */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Recent Intelligence</h2>
                    <Card className="border-none shadow-lg bg-background/40 backdrop-blur-md h-[500px] flex flex-col">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="text-sm">Critical Activity</CardTitle>
                            <CardDescription>Real-time market shifts</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
                            {!summary || !summary.recentAlerts || summary.recentAlerts.length === 0 ? (
                                <div className="text-center py-20 opacity-40 flex flex-col items-center">
                                    <AlertCircle className="w-8 h-8 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-tight">No Market Shifts Detected</p>
                                </div>
                            ) : summary.recentAlerts.map((alert: any) => (
                                <div key={alert.id} className="flex gap-4 group cursor-pointer hover:bg-muted/30 p-2 rounded-xl transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <TrendingDown className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold leading-none">{alert.product_name}</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            {alert.alert_type === 'price_drop' ? `Dropped to $${alert.new_value}` : "Agent researching..."}
                                        </p>
                                        <p className="text-[10px] text-primary/60 font-medium">
                                            {formatDistanceToNow(new Date(alert.triggered_at))} ago
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <div className="p-4 border-t border-white/5 text-center">
                            <Link href="/alerts" className="text-xs text-primary font-bold hover:underline">View All Alerts</Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
