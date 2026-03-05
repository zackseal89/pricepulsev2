"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { AgentStreamViewer } from "./AgentStreamViewer";

interface RunAgentDialogProps {
    competitorId: string;
    competitorName: string;
    trigger?: React.ReactNode;
}

export function RunAgentDialog({ competitorId, competitorName, trigger }: RunAgentDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10">
                        <Play className="w-4 h-4 fill-primary" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Mission Active</span>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Deploying Agent: {competitorName}</DialogTitle>
                    <DialogDescription className="font-medium">
                        Autonomous web agent is initializing to synchronize market intelligence.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 pt-2">
                    <AgentStreamViewer
                        competitorId={competitorId}
                        onComplete={() => {
                            // Keep open to see the final logs, or close?
                            // Let's keep it open so they see success.
                        }}
                        className="border-none shadow-none h-[450px]"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
