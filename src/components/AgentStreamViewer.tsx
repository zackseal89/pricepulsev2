"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Terminal,
    Globe,
    Search,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Step {
    id: string;
    type: "start" | "navigate" | "step" | "extracted" | "processing" | "complete" | "error";
    message: string;
    timestamp: Date;
}

interface AgentStreamViewerProps {
    competitorId?: string;
    customUrl?: string; // For NLP runs
    customGoal?: string; // For NLP runs
    onComplete?: () => void;
    className?: string;
}

export function AgentStreamViewer({
    competitorId,
    customUrl,
    customGoal,
    onComplete,
    className
}: AgentStreamViewerProps) {
    const [steps, setSteps] = useState<Step[]>([]);
    const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [steps]);

    // Auto-start if it's a custom run
    useEffect(() => {
        if (customUrl || (competitorId && competitorId !== 'demo-id')) {
            startScrape();
        }
    }, [customUrl, competitorId]);

    const startScrape = async () => {
        if (status === "running") return;

        setSteps([]);
        setStatus("running");
        setProgress(5);

        try {
            const response = await fetch("/api/scrape/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    competitorId,
                    customUrl,
                    customGoal
                }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        const newStep: Step = {
                            id: Math.random().toString(36).substr(2, 9),
                            type: data.type.replace("agent_", "") as any,
                            message: data.message,
                            timestamp: new Date(),
                        };

                        setSteps(prev => [...prev, newStep]);

                        if (data.type === "agent_start") setProgress(15);
                        if (data.type === "agent_navigate") setProgress(prev => Math.min(prev + 10, 60));
                        if (data.type === "agent_extracted") setProgress(prev => Math.min(prev + 15, 85));
                        if (data.type === "agent_processing") setProgress(95);

                        if (data.type === "agent_complete") {
                            setStatus("complete");
                            setProgress(100);
                            onComplete?.();
                        }

                        if (data.type === "agent_error") {
                            setStatus("error");
                        }
                    } catch (e) {
                        console.error("Error parsing SSE data", e);
                    }
                }
            }
        } catch (error: any) {
            setStatus("error");
            setSteps(prev => [...prev, {
                id: "err-" + Date.now(),
                type: "error",
                message: error.message || "Failed to connect to agent stream",
                timestamp: new Date()
            }]);
        }
    };

    const getIcon = (type: Step["type"]) => {
        switch (type) {
            case "start": return <Bot className="w-4 h-4 text-primary" />;
            case "navigate": return <Globe className="w-4 h-4 text-blue-400" />;
            case "step": return <Search className="w-4 h-4 text-muted-foreground" />;
            case "extracted": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case "processing": return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
            case "complete": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case "error": return <XCircle className="w-4 h-4 text-destructive" />;
            default: return <Terminal className="w-4 h-4" />;
        }
    };

    return (
        <Card className={cn("overflow-hidden border-2 transition-all duration-500",
            status === "complete" ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10" :
                status === "error" ? "border-destructive/50" : "border-border",
            className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-full", status === "running" ? "bg-primary/10 animate-pulse" : "bg-muted")}>
                        <Bot className={cn("w-5 h-5", status === "running" ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold">Autonomous Scrape Agent</CardTitle>
                        <p className="text-xs text-muted-foreground">TinyFish Web Engine v1.0</p>
                    </div>
                </div>
                <Badge variant={
                    status === "running" ? "default" :
                        status === "complete" ? "secondary" :
                            status === "error" ? "destructive" : "outline"
                } className="capitalize">
                    {status}
                </Badge>
            </CardHeader>

            <CardContent className="p-0">
                <div className="px-6 py-4 space-y-4">
                    {status === "idle" ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                                <Bot className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="max-w-[280px]">
                                <h3 className="text-sm font-semibold">Agent Ready</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ready to deploy an autonomous agent to analyze competitor pricing.
                                </p>
                            </div>
                            <button
                                onClick={startScrape}
                                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Launch Agent Now
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    <span>Operation Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                            </div>

                            <div
                                ref={scrollRef}
                                className="h-[300px] overflow-y-auto bg-black/90 rounded-xl p-4 font-mono text-xs border border-white/5 shadow-inner"
                            >
                                <div className="space-y-2">
                                    <AnimatePresence mode="popLayout">
                                        {steps.map((step) => (
                                            <motion.div
                                                key={step.id}
                                                initial={{ opacity: 0, x: -10, y: 5 }}
                                                animate={{ opacity: 1, x: 0, y: 0 }}
                                                className="flex items-start gap-3 border-l border-white/10 pl-3 py-0.5"
                                            >
                                                <div className="mt-0.5">{getIcon(step.type)}</div>
                                                <div className="flex-1">
                                                    <span className="text-white/40 mr-2">[{step.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                    <span className={cn(
                                                        "break-all",
                                                        step.type === "error" ? "text-destructive" :
                                                            step.type === "extracted" ? "text-emerald-400" :
                                                                step.type === "navigate" ? "text-blue-300" : "text-white/80"
                                                    )}>
                                                        {step.message}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {status === "running" && steps.length === 0 && (
                                        <div className="flex items-center gap-3 pl-3 py-2">
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                <div className="w-1.5 h-3 bg-primary animate-pulse rounded-full" />
                                            </div>
                                            <span className="text-primary animate-pulse uppercase tracking-widest text-[10px] font-bold">Initializing opertive...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
