'use client';

import { Toaster as Sonner } from "sonner"
import useDesignStore from "@/store/useDesignStore"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    // Use store for theme if next-themes is not used, or use next-themes if available.
    // The user code snippet used `useDesignStore` for `isDarkMode`.
    const isDarkMode = useDesignStore(state => state.isDarkMode)

    return (
        <Sonner
            theme={isDarkMode ? "dark" : "light"}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
