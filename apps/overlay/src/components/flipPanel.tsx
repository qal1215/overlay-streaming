import { useState } from "react";

type FlipPanelProps = {
    front: React.ReactNode;
    back: React.ReactNode;
    width?: number;
    height?: number;
};

export function FlipPanel({
    front,
    back,
    width = 400,
    height = 120,
}: FlipPanelProps) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            style={{
                width,
                height,
                perspective: "1000px",
                cursor: "pointer",
            }}
            onClick={() => setFlipped((value) => !value)}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",

                    position: "relative",

                    transformStyle: "preserve-3d",

                    transform: flipped
                        ? "rotateX(180deg)"
                        : "rotateX(0deg)",

                    transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
            >
                {/* FRONT */}
                <PanelFace>
                    {front}
                </PanelFace>

                {/* BACK */}
                <PanelFace
                    style={{
                        transform: "rotateX(180deg)",
                    }}
                >
                    {back}
                </PanelFace>
            </div>
        </div>
    );
}

type PanelFaceProps = {
    children: React.ReactNode;
    style?: React.CSSProperties;
};

function PanelFace({
    children,
    style,
}: PanelFaceProps) {
    return (
        <div
            style={{
                position: "absolute",

                inset: 0,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background: "#111",
                borderRadius: 12,

                color: "white",

                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",

                overflow: "hidden",

                ...style,
            }}
        >
            {children}
        </div>
    );
}