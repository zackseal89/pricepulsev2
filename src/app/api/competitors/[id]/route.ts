import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const competitorId = (await params).id;

        const { data: competitor, error } = await supabase
            .from('competitors')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', competitorId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        if (!competitor) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });

        return NextResponse.json({ competitor });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const competitorId = (await params).id;
        const userId = user.id;

        // Cascade delete snapshots and alerts is handled by Supabase foreign keys with ON DELETE CASCADE
        const { data: result, error } = await supabase
            .from('competitors')
            .delete()
            .eq('id', competitorId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        if (!result) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
