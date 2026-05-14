"use client";

import {createContext, useContext} from "react";

interface LayoutContextValue {
    sidebarVisible: boolean;
    setSidebarVisible: (visible: boolean) => void;
    toggleSidebar: () => void;

    sidebarMobileOpen: boolean;
    openSidebarMobile: () => void;
    closeSidebarMobile: () => void;
    toggleSidebarMobile: () => void;

    intelligenceVisible: boolean;
    setIntelligenceVisible: (visible: boolean) => void;
    toggleIntelligence: () => void;

    intelligenceMobileOpen: boolean;
    openIntelligenceMobile: () => void;
    closeIntelligenceMobile: () => void;
    toggleIntelligenceMobile: () => void;
}

const noop = () => {
};

export const LayoutContext = createContext<LayoutContextValue>({
    sidebarVisible: true,
    setSidebarVisible: noop,
    toggleSidebar: noop,

    sidebarMobileOpen: false,
    openSidebarMobile: noop,
    closeSidebarMobile: noop,
    toggleSidebarMobile: noop,

    intelligenceVisible: true,
    setIntelligenceVisible: noop,
    toggleIntelligence: noop,

    intelligenceMobileOpen: false,
    openIntelligenceMobile: noop,
    closeIntelligenceMobile: noop,
    toggleIntelligenceMobile: noop,
});

export function useLayout(): LayoutContextValue {
    return useContext(LayoutContext);
}
