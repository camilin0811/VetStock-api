import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group } from 'three'
import { Pill } from './Pill'

function Spin({ active }: { active: boolean }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => { if (active && g.current) g.current.rotation.y += dt * 0.4 })
  return (
    <Float speed={1.6} floatIntensity={0.6} rotationIntensity={0.3}>
      <group ref={g} rotation={[0.3, 0, -0.5]} scale={1.15}><Pill length={1} radius={0.32} /></group>
    </Float>
  )
}

export default function LoginCanvas({ active }: { active: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 6], fov: 30 }} gl={{ alpha: true, powerPreference: 'low-power' }} aria-hidden="true">
      <hemisphereLight args={['#ffffff', '#b9a9f0', 1.2]} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <Spin active={active} />
    </Canvas>
  )
}
