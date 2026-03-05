"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentStreamViewer } from "./AgentStreamViewer";
import { toast } from "sonner";

export function AgentChat() {
    const [prompt, setPrompt] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);
    const [activeUrl, setActiveUrl] = useState("");

    const handleDeploy = (customPrompt?: string, customLink?: string) => {
        const finalPrompt = customPrompt || prompt;
        if (!finalPrompt.trim()) return;

        let finalUrl = customLink || urlInput;
        if (!finalUrl && finalPrompt) {
            const urlMatch = finalPrompt.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                finalUrl = urlMatch[0];
            }
        }

        if (!finalUrl || !finalUrl.startsWith("http")) {
            toast.error("Please enter a valid Target URL starting with http:// or https://");
            return;
        }

        setPrompt(finalPrompt);
        setActiveUrl(finalUrl);
        setIsDeploying(true);
    };

    return (
        <div className="space-y-6">
            {!isDeploying ? (
                <Card className="border-none shadow-2xl bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden animate-in fade-in zoom-in duration-500">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-5 h-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Autonomous Intelligence</span>
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight">Agent Command Center</CardTitle>
                        <CardDescription className="text-sm font-medium">
                            Talk to your AI agent in natural language to perform complex research.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Target URL</label>
                            <Input
                                placeholder="https://example.com"
                                className="bg-muted/30 border-none rounded-xl py-6"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
                            />
                        </div>
                        <div className="relative group space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex justify-between">
                                Custom Agent Instruction
                                <span className="text-[10px] text-primary/60 normal-case tracking-normal">Multi-step workflows supported</span>
                            </label>
                            <div className="absolute -inset-1 top-6 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col bg-background border rounded-2xl shadow-inner overflow-hidden">
                                <textarea
                                    placeholder="e.g. 'Search for Nike Shoes, sort by Lowest Price, and extract the top 5 results'"
                                    className="w-full min-h-[120px] resize-none border-none focus-visible:ring-0 text-md p-4 bg-transparent outline-none placeholder:text-muted-foreground/50"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleDeploy())}
                                />
                                <div className="flex justify-between items-center bg-muted/20 p-2 border-t border-border/50">
                                    <div className="text-xs text-muted-foreground pl-2 font-medium">Shift + Enter for new line</div>
                                    <Button
                                        onClick={() => handleDeploy()}
                                        disabled={!prompt.trim() || !urlInput.trim()}
                                        className="rounded-xl px-8 py-5 font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Launch Agent
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                onClick={() => handleDeploy("Check if there are any active promos on https://adidas.com")}
                                className="text-[10px] font-bold bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full transition-colors text-muted-foreground border border-border/50"
                            >
                                Scan adidas.com Promos
                            </button>
                            <button
                                onClick={() => handleDeploy("Extract all new arrivals from https://puma.com")}
                                className="text-[10px] font-bold bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full transition-colors text-muted-foreground border border-border/50"
                            >
                                Check Puma New Arrivals
                            </button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="relative group animate-in slide-in-from-bottom duration-700">
                    <button
                        onClick={() => setIsDeploying(false)}
                        className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-background border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <AgentStreamViewer
                        competitorId="custom-run"
                        customUrl={activeUrl}
                        customGoal={prompt}
                        className="shadow-2xl border-primary/20 h-[500px]"
                    />
                </div>
            )}
        </div>
    );
}
