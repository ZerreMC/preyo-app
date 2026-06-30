import {NextResponse} from "next/server";

// Lightweight liveness endpoint for CI/CD smoke tests and uptime checks.
// No auth, no DB: must stay cheap and always-on.
export const dynamic = "force-dynamic";

export function GET() {
    return NextResponse.json({status: "ok", service: "preyo-app"});
}
