export const routes = {
    landing: "/landing",
    home: "/",
    signIn: "/sign-in",
    signUp: "/sign-up",
    lists: "/lists",
    newList: "/lists/new",
    listDetail: (listId: string) => `/lists/${listId}`,
    addProducts: (listId: string) => `/lists/${listId}/add`,
    shareList: (listId: string) => `/lists/${listId}/share`,
    planRoute: (listId: string) => `/lists/${listId}/route`,
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