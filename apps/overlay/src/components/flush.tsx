import type { CSSProperties, ReactNode } from "react";

type OverlayComponentProps = {
    children: ReactNode;

    barColor?: string;
    barHeight?: number;

    width?: number | string;
    height?: number | string;

    backgroundColor?: string;
    borderRadius?: number;

    className?: string;
};

export function OverlayComponent({
    children,
    barColor = "#ffffff",
    barHeight = 6,

    width = 400,
    height = 120,

    backgroundColor = "#111111",
    borderRadius = 8,

    className,
}: OverlayComponentProps) {
    const style: CSSProperties = {
        position: "relative",

        width,
        height,

        backgroundColor,
        borderRadius,

        overflow: "hidden",

        boxSizing: "border-box",
    };

    return (
        <div
            className={className}
            style={style}
        >
            {/* Top bar */}
            < div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,

                    height: barHeight,

                    backgroundColor: barColor,
                }
                }
            />

            {/* Content */}
            <div
                style={
                    {
                        width: "100%",
                        height: "100%",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        padding: `${barHeight + 8}px 16px 16px`,
                        boxSizing: "border-box",
                    }
                }
            >
                {children}
            </div>
        </div>
    );
}