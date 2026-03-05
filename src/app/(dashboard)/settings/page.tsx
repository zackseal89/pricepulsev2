"use client";

import React from "react";
import { User, Shield, CreditCard, Bell, Mail, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Platform Settings</h1>
                <p className="text-muted-foreground mt-1 text-lg">Manage your account, billing, and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Navigation */}
                <div className="space-y-1">
                    {[
                        { label: "Profile", icon: User, active: true },
                        { label: "Subscription", icon: CreditCard },
                        { label: "Alerts Control", icon: Bell },
                        { label: "Security", icon: Lock },
                    ].map((item) => (
                        <Button
                            key={item.label}
                            variant={item.active ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 rounded-xl font-bold py-6 text-sm"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Button>
                    ))}
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-xl font-black">Account Information</CardTitle>
                            <CardDescription>Update your personal details and contact email.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                                    <Input placeholder="Your Name" className="bg-muted/30 border-none rounded-xl py-6" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Email</Label>
                                    <Input placeholder="alerts@example.com" className="bg-muted/30 border-none rounded-xl py-6" />
                                </div>
                            </div>
                            <Button className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20">Save Profile</Button>

                            <Separator className="my-8 opacity-50" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60">Subscription Status</h3>
                                <div className="flex items-center justify-between p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight">PricePulse Pro Plan</p>
                                            <p className="text-xs text-muted-foreground">Full access to autonomous monitoring agents.</p>
                                        </div>
                                    </div>
                                    <Badge className="rounded-full px-4 py-1.5 uppercase font-black text-[10px] tracking-widest">Active</Badge>
                                </div>
                                <Button variant="outline" className="w-full rounded-2xl py-8 border-dashed border-2 font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                                    Manage Plan in Stripe
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
