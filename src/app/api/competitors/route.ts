import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: competitors, error } = await supabase
            .from('competitors')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ competitors });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        // Plan check from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan, max_competitors')
            .eq('id', user.id)
            .single();

        const { count } = await supabase
            .from('competitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const limit = profile?.max_competitors || (profile?.plan === 'pro' ? 50 : 5);
        if (count && count >= limit) {
            return NextResponse.json({ error: `Plan limit reached (${limit} competitors)` }, { status: 403 });
        }

        const { data: competitor, error } = await supabase
            .from('competitors')
            .insert({
                ...body,
                user_id: user.id,
                last_status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ competitor, message: "Competitor added successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
