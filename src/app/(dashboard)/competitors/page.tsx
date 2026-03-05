"use client";

import React, { useEffect, useState } from "react";
import {
    Globe,
    MoreVertical,
    ExternalLink,
    Play,
    Trash2,
    Settings2,
    Loader2
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { RunAgentDialog } from "@/components/RunAgentDialog";

export default function CompetitorsPage() {
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCompetitors = async () => {
        try {
            const res = await fetch("/api/competitors");
            const data = await res.json();
            setCompetitors(data.competitors || []);
        } catch (err) {
            toast.error("Failed to fetch competitors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitors();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete all history.")) return;
        try {
            const res = await fetch(`/api/competitors/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Monitor removed");
                fetchCompetitors();
            }
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Competitor Monitors</h1>
                <p className="text-muted-foreground mt-1">Manage your fleet of autonomous research agents.</p>
            </div>

            <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-bold">Source</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Last Scrape</TableHead>
                            <TableHead className="font-bold">URLs</TableHead>
                            <TableHead className="font-bold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {competitors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No monitors deployed yet. Click "New Monitor" to start.
                                </TableCell>
                            </TableRow>
                        ) : competitors.map((c) => (
                            <TableRow key={c._id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{c.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{new URL(c.baseUrl).hostname}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={c.isActive ? "default" : "outline"} className="rounded-lg px-2 py-0 text-[10px] uppercase font-black">
                                        {c.isActive ? "Active" : "Paused"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                    {c.lastScrapedAt ? formatDistanceToNow(new Date(c.lastScrapedAt)) + " ago" : "Never"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="rounded-lg text-[10px]">{c.monitorUrls?.length || 0} Products</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <RunAgentDialog
                                            competitorId={c._id}
                                            competitorName={c.name}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-2xl">
                                                <DropdownMenuItem className="gap-2 font-medium">
                                                    <Settings2 className="w-4 h-4" /> Edit Config
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 font-medium">
                                                    <ExternalLink className="w-4 h-4" /> View Site
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 font-medium text-destructive focus:text-destructive"
                                                    onClick={() => handleDelete(c._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Remove Monitor
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
