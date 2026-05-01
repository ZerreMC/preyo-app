export const routes = {
    home: "/",
    lists: "/lists",
    compare: "/compare",
    settings: "/settings",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const bottomNavigationItems = [
    {
        label: "Inicio",
        shortLabel: "I",
        href: routes.home,
    },
    {
        label: "Listas",
        shortLabel: "L",
        href: routes.lists,
    },
    {
        label: "Tiendas",
        shortLabel: "T",
        href: routes.compare,
    },
    {
        label: "Perfil",
        shortLabel: "P",
        href: routes.settings,
    },
] as const;