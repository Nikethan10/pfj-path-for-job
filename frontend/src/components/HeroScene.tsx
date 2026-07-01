import { Canvas } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial } from '@react-three/drei';

/**
 * Subtle floating 3D accent for the landing hero. Lazy-loaded and only mounted on
 * large screens without a reduced-motion preference (see Landing.jsx guard).
 */
export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <Float speed={1.1} rotationIntensity={0.5} floatIntensity={1.1}>
        <Icosahedron args={[1.7, 6]}>
          <MeshDistortMaterial color="#9a3412" roughness={0.35} metalness={0.15} distort={0.26} speed={1.3} />
        </Icosahedron>
      </Float>
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.9} position={[2.6, 1.3, -1]}>
        <Icosahedron args={[0.5, 3]}>
          <MeshDistortMaterial color="#b45309" roughness={0.4} distort={0.3} speed={1.5} />
        </Icosahedron>
      </Float>
    </Canvas>
  );
}
