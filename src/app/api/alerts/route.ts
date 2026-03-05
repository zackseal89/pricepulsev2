import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = user.id;

        const { data: alerts, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', userId)
            .order('triggered_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ alerts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
