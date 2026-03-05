"use client";

import React, { useState } from "react";
import { Plus, Globe, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddCompetitorDialog({ onAdd }: { onAdd?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [monitorUrls, setMonitorUrls] = useState<string[]>([""]);

    const handleAddUrl = () => setMonitorUrls([...monitorUrls, ""]);

    const handleUrlChange = (index: number, value: string) => {
        const next = [...monitorUrls];
        next[index] = value;
        setMonitorUrls(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/competitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    baseUrl,
                    monitorUrls: monitorUrls.filter(u => u.trim() !== ""),
                }),
            });

            if (!response.ok) throw new Error("Failed to add competitor");

            toast.success("Monitor added successfully");
            setOpen(false);
            setName("");
            setBaseUrl("");
            setMonitorUrls([""]);
            onAdd?.();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl px-4 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4" />
                    <span>New Monitor</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Add New Monitor</DialogTitle>
                    <DialogDescription>
                        Deploy an autonomous agent to track prices and stock levels.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold">Competitor Name</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="e.g. Nike Official Store"
                                    className="pl-9 bg-muted/30 border-none rounded-xl"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="baseUrl" className="text-sm font-bold">Base URL (Domain)</Label>
                            <Input
                                id="baseUrl"
                                placeholder="https://nike.com"
                                className="bg-muted/30 border-none rounded-xl"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold">Specific Product URLs</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary"
                                    onClick={handleAddUrl}
                                >
                                    + Add URL
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                {monitorUrls.map((url, i) => (
                                    <div key={i} className="relative">
                                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="https://nike.com/p/air-zoom-..."
                                            className="pl-9 bg-muted/30 border-none rounded-xl"
                                            value={url}
                                            onChange={(e) => handleUrlChange(i, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full rounded-xl py-6 font-bold shadow-xl shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            Initialize Monitor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
