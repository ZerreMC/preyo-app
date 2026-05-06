import type {CSSProperties, HTMLAttributes} from "react";
import Image from "next/image";

import {cn} from "@/shared/lib";

const avatarSizes = {
    sm: "size-7 text-[9px]",
    default: "size-8 text-[10px]",
    lg: "size-10 text-[11px]",
} as const;

export type AvatarProps = Omit<HTMLAttributes<HTMLDivElement>, "color"> & {
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
    name?: string;
    email?: string;
    role?: string;
};

export type AvatarStackProps = HTMLAttributes<HTMLDivElement> & {
    avatars: AvatarStackItem[];
    max?: number;
    size?: keyof typeof avatarSizes;
};

function getAvatarSortKey(avatar: AvatarStackItem) {
    return String(avatar.email ?? avatar.name ?? avatar.id ?? avatar.alt ?? avatar.initials ?? avatar.src ?? "");
}

function getAvatarKey(avatar: AvatarStackItem) {
    return String(avatar.id ?? avatar.email ?? avatar.name ?? avatar.src ?? avatar.initials ?? "");
}

function AvatarStack({
                         avatars,
                         max = 3,
                         size = "default",
                         className,
                         ...props
                     }: AvatarStackProps) {
    const sortedAvatars = [...avatars].sort((a, b) => getAvatarSortKey(a).localeCompare(getAvatarSortKey(b)));
    const visibleAvatars = sortedAvatars.slice(0, max);
    const overflowCount = Math.max(sortedAvatars.length - visibleAvatars.length, 0);

    return (
        <div className={cn("flex -space-x-2", className)} {...props}>
            {visibleAvatars.map((avatar, index) => {
                const {src, alt, initials, color} = avatar;
                const stackStyle: CSSProperties = {zIndex: visibleAvatars.length - index};

                return (
                    <Avatar
                        key={getAvatarKey(avatar)}
                        src={src}
                        alt={alt}
                        initials={initials}
                        color={color}
                        size={size}
                        style={stackStyle}
                    />
                );
            })}

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
