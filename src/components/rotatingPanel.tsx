import React, { useCallback, useEffect, useRef, useState } from "react"

type RotatingPanel = {
    width: number
    height: number

    faces: PanelFace[]

    rotation: {
        axis: "x" | "y" | "z"
        /**
         * Duration of each rotation animation in milliseconds.
         */
        duration: number
    }

    autoRotate?: {
        enabled: boolean
        /**
         * Time between the start of each rotation.
         */
        interval: number
        direction: 1 | -1
    }
}

type PanelFace = {
    id: string
    content: OverlayContent
    background?: string
}

type OverlayContent =
    | {
        type: "text"
        text: string
    }
    | {
        type: "image"
        src: string
    }
    | {
        type: "custom"
        component: React.ReactNode
    }

export type RotatingPanelRef = {
    next: () => void
    previous: () => void
    goTo: (index: number) => void
    getCurrentIndex: () => number
}

type Props = {
    config: RotatingPanel
    className?: string
    style?: React.CSSProperties
    onChange?: (index: number, face: PanelFace) => void
}

export const RotatingPanel = React.forwardRef<
    RotatingPanelRef,
    Props
>(function RotatingPanel(
    {
        config,
        className,
        style,
        onChange,
    },
    ref,
) {
    const {
        width,
        height,
        faces,
        rotation,
        autoRotate,
    } = config

    const [currentIndex, setCurrentIndex] = useState(0)

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    )

    const faceCount = faces.length

    /*
     * ---------------------------------------------------------
     * Navigation
     * ---------------------------------------------------------
     */

    const goTo = useCallback(
        (index: number) => {
            if (faceCount === 0) return

            const normalized =
                ((index % faceCount) + faceCount) % faceCount

            setCurrentIndex(normalized)

            const face = faces[normalized]

            if (face) {
                onChange?.(normalized, face)
            }
        },
        [faceCount, faces, onChange],
    )

    const next = useCallback(() => {
        if (faceCount <= 1) return

        goTo(currentIndex + 1)
    }, [currentIndex, faceCount, goTo])

    const previous = useCallback(() => {
        if (faceCount <= 1) return

        goTo(currentIndex - 1)
    }, [currentIndex, faceCount, goTo])

    /*
     * ---------------------------------------------------------
     * Expose API through ref
     * ---------------------------------------------------------
     */

    React.useImperativeHandle(
        ref,
        () => ({
            next,
            previous,
            goTo,
            getCurrentIndex: () => currentIndex,
        }),
        [
            next,
            previous,
            goTo,
            currentIndex,
        ],
    )

    /*
     * ---------------------------------------------------------
     * Auto rotate timer
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!autoRotate?.enabled) return

        if (faceCount <= 1) return

        const interval = Math.max(
            autoRotate.interval,
            rotation.duration,
        )

        timerRef.current = setInterval(() => {
            const direction = autoRotate.direction ?? 1

            if (direction === 1) {
                next()
            } else {
                previous()
            }
        }, interval)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [
        autoRotate?.enabled,
        autoRotate?.interval,
        autoRotate?.direction,
        rotation.duration,
        faceCount,
        next,
        previous,
    ])

    /*
     * ---------------------------------------------------------
     * Current face
     * ---------------------------------------------------------
     */

    const currentFace = faces[currentIndex]

    /*
     * ---------------------------------------------------------
     * Render
     * ---------------------------------------------------------
     */

    if (!currentFace) {
        return null
    }

    return (
        <div
            className={className}
            style={{
                width,
                height,
                perspective: "1000px",
                ...style,
            }}
        >
            <PanelStage
                axis={rotation.axis}
                duration={rotation.duration}
                currentIndex={currentIndex}
                direction={transitionDirection}
            />
        </div>
    )
})

/*
 * ============================================================
 * Panel Stage
 * ============================================================
 */

type PanelStageProps = {
    axis: "x" | "y" | "z"
    duration: number
    currentIndex: number
    faces: PanelFace[]
}

function PanelStage({
    axis,
    duration,
    currentIndex,
    faces,
}: PanelStageProps) {
    const faceCount = faces.length

    const [rotation, setRotation] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    const previousIndexRef = useRef(currentIndex)

    const currentFace = faces[currentIndex]

    const previousIndex = previousIndexRef.current

    const direction =
        currentIndex > previousIndex
            ? 1
            : -1

    const nextFace =
        faces[
        ((currentIndex + direction) % faceCount + faceCount) %
        faceCount
        ]

    useEffect(() => {
        if (currentIndex === previousIndexRef.current) {
            return
        }

        setIsAnimating(true)

        setRotation(prev => prev + direction * 180)

        const timer = setTimeout(() => {
            previousIndexRef.current = currentIndex
            setIsAnimating(false)
        }, duration)

        return () => clearTimeout(timer)
    }, [
        currentIndex,
        direction,
        duration,
    ])

    if (!currentFace || !nextFace) {
        return null
    }

    const transform =
        axis === "x"
            ? `rotateX(${rotation}deg)`
            : axis === "y"
                ? `rotateY(${rotation}deg)`
                : `rotateZ(${rotation}deg)`

    const backTransform =
        axis === "x"
            ? "rotateX(180deg)"
            : axis === "y"
                ? "rotateY(180deg)"
                : "rotateZ(180deg)"

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",

                transformStyle: "preserve-3d",

                transform,

                transition: isAnimating
                    ? `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
                    : "none",

                willChange: "transform",
            }}
        >
            {/* Front */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,

                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                <PanelFaceRenderer
                    face={currentFace}
                />
            </div>

            {/* Back */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,

                    transform: backTransform,

                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                <PanelFaceRenderer
                    face={nextFace}
                />
            </div>
        </div>
    )
}

/*
 * ============================================================
 * Face renderer
 * ============================================================
 */

type PanelFaceRendererProps = {
    face: PanelFace
}

function PanelFaceRenderer({
    face,
}: PanelFaceRendererProps) {
    const content = face.content

    return (
        <div
            data-face-id={face.id}
            style={{
                position: "absolute",
                inset: 0,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                overflow: "hidden",

                background: face.background ?? "transparent",

                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
            }}
        >
            {content.type === "text" && (
                <span>{content.text}</span>
            )}

            {content.type === "image" && (
                <img
                    src={content.src}
                    alt=""
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            )}

            {content.type === "custom" &&
                content.component}
        </div>
    )
}