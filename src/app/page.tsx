import Link from "next/link";
import { TrendingDown, Bot, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">PricePulse <span className="text-primary tracking-tighter italic">AI</span></h1>
        </div>

        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
          Autonomous E-commerce <span className="text-primary">Intelligence.</span>
        </h2>

        <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
          Deploy AI agents that monitor competitors, detect price shifts, and alert you in real-time.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="rounded-2xl px-8 py-7 text-lg font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-105">
          <Link href="/dashboard">Launch Dashboard</Link>
        </Button>
        <Button variant="outline" size="lg" className="rounded-2xl px-8 py-7 text-lg font-bold hover:bg-muted transition-all">
          View Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-4xl">
        {[
          { icon: Bot, title: "AI Agents", text: "Autonomous web navigation via TinyFish API" },
          { icon: Zap, title: "Real-time", text: "SSE streaming for zero-latency intelligence" },
          { icon: ShieldCheck, title: "Stealth", text: "Encapsulated proxies & fingerprint rotation" }
        ].map((f) => (
          <div key={f.title} className="p-6 rounded-3xl bg-muted/30 border border-border/50 text-left space-y-3">
            <f.icon className="w-6 h-6 text-primary" />
            <h3 className="font-bold">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-snug">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
