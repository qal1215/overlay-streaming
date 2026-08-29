import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react"; // Thêm Suspense từ react
import * as THREE from "three";
import { TextureLoader } from "three";
import AlertRenderer, { type AlertEvent } from "./alerts/AlertRenderer";

type OverlayObjectProps = {
  src: string;
};

function OverlayObject({ src }: OverlayObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useLoader(TextureLoader, src);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Floating
    meshRef.current.position.y = Math.sin(t * 1.2) * 0.08;

    // Small rotation
    meshRef.current.rotation.y = Math.sin(t * 0.7) * 0.04;
    meshRef.current.rotation.x = Math.cos(t * 0.5) * 0.02;

    // Subtle breathing effect
    const scale = 1 + Math.sin(t * 1.5) * 0.015;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[8, 4]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function StreamOverlay3D() {
  const [currentAlert, setCurrentAlert] = useState<AlertEvent | null>(null);

  // Example: Mock receiving a donation event for testing (Press 't' to trigger)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "t") {
        setCurrentAlert({
          id: Date.now().toString(),
          theme: "cyberpunk",
          donorName: "Neo_Hacker",
          amount: "$50.00",
          message: "Wake up, Neo. The matrix has you...",
        });
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div
      style={{
        width: "100vw", // Đổi thành vw/vh để đảm bảo luôn có kích thước
        height: "100vh",
        background: "transparent",
        position: "absolute", // Thêm absolute nếu đây là overlay đè lên stream
        top: 0,
        left: 0,
      }}
    >
      {/* Alert Engine Rendering Layer */}
      <AlertRenderer
        currentAlert={currentAlert}
        onComplete={() => setCurrentAlert(null)}
      />
    </div>
  );
}

// <Canvas
//   camera={{
//     position: [0, 0, 8],
//     fov: 35,
//   }}
//   gl={{
//     alpha: true,
//     antialias: true,
//   }}
// >
//   {/* Bọc OverlayObject trong Suspense */}
//   <Suspense fallback={null}>
//     <OverlayObject src="/overlay.png" />
//   </Suspense>
// </Canvas>
