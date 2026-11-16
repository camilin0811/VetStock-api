import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { Pill } from './Pill'

const RING_R = 2.3

function Vial() {
  return (
    <group>
      <RoundedBox args={[1.35, 1.9, 1.35]} radius={0.42} smoothness={4} position={[0, 0, 0]}>
        <meshPhysicalMaterial color="#f3eefe" roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} transparent opacity={0.92} />
      </RoundedBox>
      <RoundedBox args={[1.38, 1.0, 1.38]} radius={0.38} smoothness={4} position={[0, -0.32, 0]}>
        <meshPhysicalMaterial color="#cbbcf5" roughness={0.25} clearcoat={0.6} transparent opacity={0.55} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.7, 0.06]} radius={0.05} position={[0, 0.0, 0.7]}>
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.04, 0.74]}><boxGeometry args={[0.38, 0.1, 0.02]} /><meshStandardMaterial color="#6a4fcb" /></mesh>
      <mesh position={[0, 0.04, 0.74]}><boxGeometry args={[0.1, 0.38, 0.02]} /><meshStandardMaterial color="#6a4fcb" /></mesh>
      <mesh position={[0, -0.24, 0.74]}><boxGeometry args={[0.7, 0.05, 0.02]} /><meshStandardMaterial color="#bcaef0" /></mesh>
      <RoundedBox args={[1.1, 0.55, 1.1]} radius={0.22} smoothness={4} position={[0, 1.2, 0]}>
        <meshPhysicalMaterial color="#6a4fcb" roughness={0.3} clearcoat={0.8} />
      </RoundedBox>
    </group>
  )
}

function Orbit({ active }: { active: boolean }) {
  const bead = useRef<Group>(null)
  const pill = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!active) return
    const t = clock.elapsedTime
    const a = t * 0.45
    bead.current?.position.set(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R)
    const b = t * 0.45 + Math.PI
    pill.current?.position.set(Math.cos(b) * RING_R, 0, Math.sin(b) * RING_R)
    if (pill.current) pill.current.rotation.y = -b
  })
  return (
    <group rotation={[0.18, 0, 0]} position={[0, -0.85, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_R, 0.014, 12, 160]} />
        <meshBasicMaterial color="#a897ea" transparent opacity={0.8} />
      </mesh>
      <group ref={bead}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.07, 0.2, 6, 16]} />
          <meshPhysicalMaterial color="#6a4fcb" clearcoat={1} roughness={0.3} />
        </mesh>
      </group>
      <group ref={pill}><group scale={0.5}><Pill /></group></group>
    </group>
  )
}

function Rig({ active }: { active: boolean }) {
  const g = useRef<Group>(null)
  const p = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const move = (e: PointerEvent) => {
      p.current.x = (e.clientX / window.innerWidth) * 2 - 1
      p.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])
  useFrame((_, dt) => {
    if (!active || !g.current) return
    const k = 1 - Math.exp(-dt * 3)
    g.current.rotation.y += (p.current.x * 0.45 - g.current.rotation.y) * k
    g.current.rotation.x += (p.current.y * 0.18 - g.current.rotation.x) * k
  })
  return (
    <group ref={g}>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.55} floatingRange={[-0.08, 0.1]}>
        <group position={[0, 0.15, 0]} rotation={[0, -0.35, 0.05]}><Vial /></group>
        <group position={[1.55, -0.55, 0.9]} rotation={[0.3, 0.4, 0.5]}><Pill /></group>
      </Float>
      <Orbit active={active} />
    </group>
  )
}

export default function HeroCanvas({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0.9, 8.4], fov: 32 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      aria-hidden="true"
    >
      <hemisphereLight args={['#ffffff', '#b9a9f0', 1.15]} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#fff7ff" />
      <pointLight position={[-4, 1, 2]} intensity={14} color="#a995f0" />
      <Rig active={active} />
    </Canvas>
  )
}
