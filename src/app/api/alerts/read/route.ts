import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { alertId, all = false } = await req.json();
        const userId = user.id;

        if (all) {
            await supabase
                .from('alerts')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);
        } else if (alertId) {
            await supabase
                .from('alerts')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('id', alertId);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
