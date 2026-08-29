import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react"

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
    onChange?: (
        index: number,
        face: PanelFace,
    ) => void
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

    /*
     * =========================================================
     * State
     * =========================================================
     */

    const [currentIndex, setCurrentIndex] =
        useState(0)

    /*
     * Keep the index available synchronously.
     *
     * This is important because next()/previous()
     * can be called before React has committed a render.
     */
    const currentIndexRef =
        useRef(0)

    /*
     * Direction of the current transition.
     */
    const directionRef =
        useRef<1 | -1>(1)

    /*
     * Prevent navigation while the current
     * rotation animation is running.
     */
    const isAnimatingRef =
        useRef(false)

    const faceCount = faces.length

    /*
     * =========================================================
     * Helpers
     * =========================================================
     */

    const normalizeIndex = useCallback(
        (index: number) => {
            if (faceCount === 0) {
                return 0
            }

            return (
                ((index % faceCount) +
                    faceCount) %
                faceCount
            )
        },
        [faceCount],
    )

    const commitNavigation = useCallback(
        (
            index: number,
            direction: 1 | -1,
        ) => {
            if (faceCount <= 1) {
                return
            }

            if (isAnimatingRef.current) {
                return
            }

            const normalized =
                normalizeIndex(index)

            if (
                normalized ===
                currentIndexRef.current
            ) {
                return
            }

            directionRef.current =
                direction

            currentIndexRef.current =
                normalized

            setCurrentIndex(normalized)

            const face =
                faces[normalized]

            if (face) {
                onChange?.(
                    normalized,
                    face,
                )
            }
        },
        [
            faceCount,
            faces,
            normalizeIndex,
            onChange,
        ],
    )

    /*
     * =========================================================
     * Navigation
     * =========================================================
     */

    const goTo = useCallback(
        (index: number) => {
            if (faceCount <= 1) {
                return
            }

            if (isAnimatingRef.current) {
                return
            }

            const current =
                currentIndexRef.current

            const target =
                normalizeIndex(index)

            if (current === target) {
                return
            }

            const forward =
                (target -
                    current +
                    faceCount) %
                faceCount

            const backward =
                (current -
                    target +
                    faceCount) %
                faceCount

            const direction =
                forward <= backward
                    ? 1
                    : -1

            commitNavigation(
                target,
                direction,
            )
        },
        [
            faceCount,
            normalizeIndex,
            commitNavigation,
        ],
    )

    /*
     * =========================================================
     * Next
     * =========================================================
     */

    const next = useCallback(() => {
        commitNavigation(
            currentIndexRef.current + 1,
            1,
        )
    }, [commitNavigation])

    /*
     * =========================================================
     * Previous
     * =========================================================
     */

    const previous = useCallback(() => {
        commitNavigation(
            currentIndexRef.current - 1,
            -1,
        )
    }, [commitNavigation])

    /*
     * =========================================================
     * Ref API
     * =========================================================
     */

    useImperativeHandle(
        ref,
        () => ({
            next,
            previous,
            goTo,

            getCurrentIndex: () =>
                currentIndexRef.current,
        }),
        [
            next,
            previous,
            goTo,
        ],
    )

    /*
     * =========================================================
     * Dynamic faces
     * =========================================================
     *
     * If faces are changed dynamically and the old index
     * no longer exists, normalize it.
     * =========================================================
     */

    useEffect(() => {
        if (faceCount === 0) {
            currentIndexRef.current = 0
            setCurrentIndex(0)
            return
        }

        const normalized =
            normalizeIndex(
                currentIndexRef.current,
            )

        if (
            normalized !==
            currentIndexRef.current
        ) {
            currentIndexRef.current =
                normalized

            setCurrentIndex(normalized)
        }
    }, [
        faceCount,
        normalizeIndex,
    ])

    /*
     * =========================================================
     * Auto rotation
     * =========================================================
     */

    useEffect(() => {
        if (!autoRotate?.enabled) {
            return
        }

        if (faceCount <= 1) {
            return
        }

        /*
         * interval means:
         *
         * "time between the START of each rotation"
         *
         * Therefore it should never be shorter
         * than the animation itself.
         */
        const interval = Math.max(
            autoRotate.interval,
            rotation.duration,
        )

        const timer = setInterval(() => {
            if (
                isAnimatingRef.current
            ) {
                return
            }

            if (
                autoRotate.direction ===
                1
            ) {
                next()
            } else {
                previous()
            }
        }, interval)

        return () => {
            clearInterval(timer)
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
     * =========================================================
     * Current / next face
     * =========================================================
     */

    const currentFace =
        faces[currentIndex]

    if (!currentFace) {
        return null
    }

    /*
     * IMPORTANT:
     *
     * PanelStage receives exactly TWO faces.
     *
     * It does not know faceCount.
     */

    const nextIndex = normalizeIndex(
        currentIndex +
        directionRef.current,
    )

    const nextFace =
        faces[nextIndex]

    if (!nextFace) {
        return null
    }

    /*
     * =========================================================
     * Render
     * =========================================================
     */

    return (
        <div
            className={className}
            style={{
                width,
                height,

                perspective:
                    "1000px",

                ...style,
            }}
        >
            <PanelStage
                axis={rotation.axis}
                duration={
                    rotation.duration
                }
                currentFace={
                    currentFace
                }
                nextFace={
                    nextFace
                }
                direction={
                    directionRef.current
                }
                onAnimationStart={() => {
                    isAnimatingRef.current =
                        true
                }}
                onAnimationEnd={() => {
                    isAnimatingRef.current =
                        false
                }}
            />
        </div>
    )
})

/*
 * ============================================================
 * Panel Stage
 * ============================================================
 *
 * PanelStage deliberately knows NOTHING about:
 *
 * - face count
 * - indexes
 * - circular navigation
 * - auto rotation
 *
 * It only knows:
 *
 * currentFace
 * nextFace
 * direction
 *
 * Its responsibility is to perform ONE 3D transition.
 * ============================================================
 */

type PanelStageProps = {
    axis: "x" | "y" | "z"

    duration: number

    currentFace: PanelFace

    nextFace: PanelFace

    direction: 1 | -1

    onAnimationStart?: () => void

    onAnimationEnd?: () => void
}

function PanelStage({
    axis,
    duration,
    currentFace,
    nextFace,
    direction,
    onAnimationStart,
    onAnimationEnd,
}: PanelStageProps) {
    /*
     * =========================================================
     * Physical faces
     * =========================================================
     *
     * These states represent what physically exists
     * inside the 3D stage.
     *
     * DO NOT directly render currentFace prop here.
     */

    const [frontFace, setFrontFace] =
        useState(currentFace)

    const [backFace, setBackFace] =
        useState(nextFace)

    /*
     * Current rotation angle.
     */
    const [angle, setAngle] =
        useState(0)

    /*
     * Whether CSS transition is active.
     */
    const [isAnimating, setIsAnimating] =
        useState(false)

    /*
     * Keep track of the last transition.
     */
    const lastFaceIdRef =
        useRef(currentFace.id)

    /*
     * =========================================================
     * Start transition
     * =========================================================
     */

    useEffect(() => {
        /*
         * Same face means there is no transition.
         */
        if (
            currentFace.id ===
            lastFaceIdRef.current
        ) {
            return
        }

        /*
         * Remember this transition.
         */
        lastFaceIdRef.current =
            currentFace.id

        /*
         * IMPORTANT:
         *
         * The old front face stays where it is.
         *
         * The new current face becomes the BACK face.
         */
        setBackFace(currentFace)

        /*
         * Start from zero.
         */
        setAngle(0)

        setIsAnimating(true)

        onAnimationStart?.()

        /*
         * We need at least one rendered frame
         * at 0deg before changing to 180deg.
         *
         * Otherwise the browser may optimize both
         * state changes into a single render and
         * no transition will occur.
         */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAngle(
                    direction * 180,
                )
            })
        })
    }, [
        currentFace.id,
        direction,
        onAnimationStart,
    ])

    /*
     * =========================================================
     * Transition end
     * =========================================================
     */

    const handleTransitionEnd = (
        event: React.TransitionEvent<HTMLDivElement>,
    ) => {
        /*
         * Ignore transitions from children.
         */
        if (
            event.target !==
            event.currentTarget
        ) {
            return
        }

        /*
         * Only care about transform.
         */
        if (
            event.propertyName !==
            "transform"
        ) {
            return
        }

        /*
         * The back face has now become
         * the visible face.
         */
        setFrontFace(backFace)

        /*
         * Disable CSS transition FIRST.
         */
        setIsAnimating(false)

        /*
         * Reset rotation to zero.
         *
         * Since transition is disabled,
         * this happens instantly.
         */
        setAngle(0)

        onAnimationEnd?.()
    }

    /*
     * =========================================================
     * Transform
     * =========================================================
     */

    const transform =
        axis === "x"
            ? `rotateX(${angle}deg)`
            : axis === "y"
                ? `rotateY(${angle}deg)`
                : `rotateZ(${angle}deg)`

    /*
     * The second face is turned 180 degrees
     * so it becomes visible from the opposite
     * side during the flip.
     */
    const backTransform =
        axis === "x"
            ? "rotateX(180deg)"
            : axis === "y"
                ? "rotateY(180deg)"
                : "rotateZ(180deg)"

    /*
     * =========================================================
     * Render
     * =========================================================
     */

    return (
        <div
            style={{
                width: "100%",
                height: "100%",

                position: "relative",

                transformStyle:
                    "preserve-3d",

                transform,

                transition:
                    isAnimating
                        ? `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
                        : "none",

                willChange:
                    "transform",
            }}
            onTransitionEnd={
                handleTransitionEnd
            }
        >
            {/* =================================================
                FRONT FACE
            ================================================= */}

            <div
                style={{
                    position:
                        "absolute",

                    inset: 0,

                    backfaceVisibility:
                        "hidden",

                    WebkitBackfaceVisibility:
                        "hidden",
                }}
            >
                <PanelFaceRenderer
                    face={frontFace}
                />
            </div>

            {/* =================================================
                BACK FACE
            ================================================= */}

            <div
                style={{
                    position:
                        "absolute",

                    inset: 0,

                    transform:
                        backTransform,

                    backfaceVisibility:
                        "hidden",

                    WebkitBackfaceVisibility:
                        "hidden",
                }}
            >
                <PanelFaceRenderer
                    face={backFace}
                />
            </div>
        </div>
    )
}

/*
 * ============================================================
 * Face Renderer
 * ============================================================
 */

type PanelFaceRendererProps = {
    face: PanelFace
}

function PanelFaceRenderer({
    face,
}: PanelFaceRendererProps) {
    const content =
        face.content

    return (
        <div
            data-face-id={
                face.id
            }
            style={{
                position:
                    "absolute",

                inset: 0,

                display: "flex",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                overflow:
                    "hidden",

                background:
                    face.background ??
                    "transparent",
            }}
        >
            {content.type ===
                "text" && (
                    <span>
                        {content.text}
                    </span>
                )}

            {content.type ===
                "image" && (
                    <img
                        src={content.src}
                        alt=""
                        draggable={false}
                        style={{
                            width:
                                "100%",

                            height:
                                "100%",

                            objectFit:
                                "cover",

                            display:
                                "block",
                        }}
                    />
                )}

            {content.type ===
                "custom" &&
                content.component}
        </div>
    )
}