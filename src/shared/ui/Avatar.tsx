import * as React from "react";
import Image from "next/image";

import {cn} from "@/shared/lib";

const avatarSizes = {
    sm: "size-7 text-[9px]",
    default: "size-8 text-[10px]",
    lg: "size-10 text-[11px]",
} as const;

export type AvatarProps = React.ComponentProps<"div"> & {
    src?: string;
    alt?: string;
    initials?: string;
    color?: string;
    size?: keyof typeof avatarSizes;
};

function Avatar({
                    src,
                    alt = "",
                    initials,
                    color = "#39B86B",
                    size = "default",
                    className,
                    style,
                    ...props
                }: AvatarProps) {
    return (
        <div
            className={cn(
                "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-divider font-extrabold text-white",
                avatarSizes[size],
                className,
            )}
            style={{backgroundColor: src ? undefined : color, ...style}}
            {...props}
        >
            {src ? (
                <Image src={src} alt={alt} fill sizes="40px" className="object-cover" unoptimized/>
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}

export type AvatarStackItem = Pick<
    AvatarProps,
    "src" | "alt" | "initials" | "color"
> & {
    id?: string | number;
};

export type AvatarStackProps = React.ComponentProps<"div"> & {
    avatars: AvatarStackItem[];
    max?: number;
    size?: keyof typeof avatarSizes;
};

function AvatarStack({
                         avatars,
                         max = 3,
                         size = "default",
                         className,
                         ...props
                     }: AvatarStackProps) {
    const visibleAvatars = avatars.slice(0, max);
    const overflowCount = Math.max(avatars.length - visibleAvatars.length, 0);
    const stackCount = visibleAvatars.length + (overflowCount > 0 ? 1 : 0);

    return (
        <div className={cn("flex -space-x-2", className)} {...props}>
            {visibleAvatars.map(({id, ...avatar}, index) => (
                <Avatar
                    key={id ?? avatar.src ?? avatar.initials ?? index}
                    {...avatar}
                    size={size}
                    style={{zIndex: stackCount - index}}
                />
            ))}

            {overflowCount > 0 ? (
                <Avatar
                    initials={`+${overflowCount}`}
                    color="var(--color-divider)"
                    size={size}
                    className="text-text-muted"
                    style={{zIndex: 0}}
                />
            ) : null}
        </div>
    );
}

export {Avatar, AvatarStack};
