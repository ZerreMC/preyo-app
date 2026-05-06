import type {HomeScreenProps} from "./HomeScreen";

export const homeMockData: HomeScreenProps = {
    greeting: "Buenos días",
    displayName: "Ana",
    activeList: {
        id: "compra-semanal",
        title: "Compra semanal",
        progress: 0.53,
        checkedCount: 4,
        totalCount: 10,
        estimatedTotalLabel: "34,50 €",
        subtitle: "Con Marc · Actualizado hace 5 min",
        imageSrc: "/mock/grocery-bag.svg",
        collaborators: [
            {id: "ana", initials: "AG", color: "#39B86B"},
            {id: "marc", initials: "MP", color: "#FF8A3D"},
        ],
    },
    savings: {
        title: "Podrías ahorrar esta semana",
        subtitle: "Comprando frescos en Aldi · Ver recomendaciones",
        amountLabel: "4,20 €",
    },
    quickActions: {
        primary: {href: "/lists", label: "Nueva lista", sub: "Crear rápido"},
        secondary: {href: "/compare", label: "Recomendaciones", sub: "4 sugerencias"},
    },
    volverAComprar: [
        {id: "milk", name: "Leche semidesnatada 1L", priceLabel: "0,96 €", imageSrc: "/mock/milk.svg"},
        {id: "rice", name: "Arroz redondo 1kg", priceLabel: "1,18 €", imageSrc: "/mock/rice.svg"},
        {id: "chicken", name: "Pechuga de pollo", priceLabel: "5,80 €", imageSrc: "/mock/chicken.svg"},
        {id: "oil", name: "Aceite de oliva virgen", priceLabel: "7,35 €", imageSrc: "/mock/oil.svg"},
        {id: "eggs", name: "Huevos camperos docena", priceLabel: "2,45 €", imageSrc: "/mock/eggs.svg"},
        {id: "bread", name: "Pan integral", priceLabel: "1,29 €", imageSrc: "/mock/bread.svg"},
    ],
    recentLists: [
        {
            id: "compra-semanal",
            title: "Compra semanal",
            meta: "10 productos · hace 5 min",
            status: "en-compra",
            emoji: "🛒"
        },
        {id: "cena-sabado", title: "Cena sábado", meta: "8 productos · ayer", status: "compartida", emoji: "🍝"},
        {id: "basicos-casa", title: "Básicos casa", meta: "14 productos · lunes", status: "borrador", emoji: "🏠"},
    ],
    supermarkets: [
        {
            id: "mercadona",
            name: "Mercadona",
            emoji: "🟢",
            bgClassName: "bg-[rgba(57,184,107,0.12)]",
            textClassName: "text-brand-active"
        },
        {id: "lidl", name: "Lidl", emoji: "🔵", bgClassName: "bg-[#EDF0FF]", textClassName: "text-[#4557DB]"},
        {
            id: "aldi",
            name: "Aldi",
            emoji: "🟡",
            bgClassName: "bg-[rgba(246,201,76,0.28)]",
            textClassName: "text-[#8B6914]"
        },
        {id: "carrefour", name: "Carrefour", emoji: "🔴", bgClassName: "bg-[#FFF0F0]", textClassName: "text-error"},
    ],
    recommendation: {
        title: "Cambia a aceite de Lidl y ahorra 1,10 €",
        subtitle: "Ver todas las recomendaciones →",
        imageSrc: "/mock/oil.svg",
    },
};
