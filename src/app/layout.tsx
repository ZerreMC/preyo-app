import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "@/shared/styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Preyo",
    description: "Comparador y gestor colaborativo de listas de compra.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={inter.variable} data-scroll-behavior="smooth">
        <body>{children}</body>
        </html>
    );
}