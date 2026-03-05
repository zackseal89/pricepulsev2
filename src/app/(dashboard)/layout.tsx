import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
    Bell,
    Search,
    Plus,
    UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AddCompetitorDialog } from "@/components/AddCompetitorDialog";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col">
                {/* Top Header */}
                <header className="h-16 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <div className="h-6 w-[1px] bg-border hidden md:block" />
                        <div className="relative w-72 hidden md:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search competitors..."
                                className="pl-9 h-10 w-full bg-muted/50 border-none rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="rounded-full relative border-none hover:bg-muted">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                        </Button>
                        <AddCompetitorDialog />
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                            <UserCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-10 bg-muted/20 overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
