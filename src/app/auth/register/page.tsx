"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Loader2, Sparkles, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                toast.error(error.message || "Registration failed");
            } else {
                toast.success("Account created! Please check your email or login.");
                router.push("/auth/login");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <div className="w-full max-w-[450px] space-y-8">
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-2xl">
                            <Bot className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">PricePulse AI</span>
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">Device Registration</h1>
                    <p className="text-muted-foreground font-medium">Join the elite network of e-commerce agents.</p>
                </div>

                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-background/80 backdrop-blur-xl rounded-[2.5rem] p-4">
                    <CardHeader className="text-center">
                        <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-primary/60">New Operative</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Identity (Name)</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Alex Thompson"
                                        className="pl-12 bg-muted/30 border-none rounded-2xl h-14 font-medium"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Terminal ID (Email)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="agent@pricepulse.ai"
                                        className="pl-12 bg-muted/30 border-none rounded-2xl h-14 font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key (Password)</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12 bg-muted/30 border-none rounded-2xl h-14 font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform" disabled={loading}>
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <Sparkles className="w-5 h-5 fill-white" />
                                        Initialize Account
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm font-medium text-muted-foreground">
                    Already active? <Link href="/auth/login" className="text-primary font-black hover:underline">Secure Login</Link>
                </p>
            </div>
        </div>
    );
}
