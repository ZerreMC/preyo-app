export const routes = {
    landing: "/landing",
    home: "/",
    signIn: "/sign-in",
    signUp: "/sign-up",
    lists: "/lists",
    listDetail: (listId: string) => `/lists/${listId}`,
    compare: "/compare",
    settings: "/settings",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const bottomNavigationItems = [
    {
        id: "home",
        label: "Inicio",
        shortLabel: "I",
        href: routes.home,
    },
    {
        id: "lists",
        label: "Listas",
        shortLabel: "L",
        href: routes.lists,
    },
    {
        id: "compare",
        label: "Tiendas",
        shortLabel: "T",
        href: routes.compare,
    },
    {
        id: "settings",
        label: "Perfil",
        shortLabel: "P",
        href: routes.settings,
    },
] as const;