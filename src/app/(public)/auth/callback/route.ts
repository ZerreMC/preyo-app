import {NextResponse} from "next/server";
import {createClient} from "@/shared/api/supabase/serverClient";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL("/lists", request.url));
}