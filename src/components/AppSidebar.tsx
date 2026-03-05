"use client";

import {
    LayoutDashboard,
    Search,
    Bell,
    Settings,
    PlusCircle,
    TrendingDown,
    ShieldCheck,
    Power
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Competitors",
        url: "/competitors",
        icon: Search,
    },
    {
        title: "Alerts",
        url: "/alerts",
        icon: Bell,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="h-16 flex items-center px-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">PricePulse <span className="text-primary tracking-tighter italic">AI</span></span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={pathname === item.url}
                                        className={cn(
                                            "transition-all duration-200",
                                            pathname === item.url ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                        )}
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Account</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Subscription">
                                    <Link href="/settings/billing">
                                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                                        <span>Manage Pro Plan</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Power className="w-5 h-5" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
