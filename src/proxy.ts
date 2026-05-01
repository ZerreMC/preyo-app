import {createServerClient, type CookieOptions} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";
import {env} from "@/shared/config/env";

const privateRoutes = ["/lists", "/compare", "/settings"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },

            setAll(
                cookiesToSet: Array<{
                    name: string;
                    value: string;
                    options: CookieOptions;
                }>,
            ) {
                cookiesToSet.forEach(({name, value}) => {
                    request.cookies.set(name, value);
                });

                response = NextResponse.next({
                    request,
                });

                cookiesToSet.forEach(({name, value, options}) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    const {
        data: {user},
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const isPrivateRoute = privateRoutes.some((route) =>
        pathname.startsWith(route),
    );

    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (!user && isPrivateRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/sign-in";
        redirectUrl.searchParams.set("redirectTo", pathname);

        return NextResponse.redirect(redirectUrl);
    }

    if (user && isAuthRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/lists";

        return NextResponse.redirect(redirectUrl);
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};