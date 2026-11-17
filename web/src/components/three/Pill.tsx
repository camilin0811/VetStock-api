/** Capsula farmaceutica hecha con primitivas: dos mitades de color con tapas esfericas. */
export function Pill({ length = 0.8, radius = 0.26, a = '#6a4fcb', b = '#ffffff' }: { length?: number; radius?: number; a?: string; b?: string }) {
  const h = length / 2
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[radius, radius, h, 32]} />
        <meshPhysicalMaterial color={a} roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <sphereGeometry args={[radius, 32, 16]} />
        <meshPhysicalMaterial color={a} roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, -h / 2, 0]}>
        <cylinderGeometry args={[radius, radius, h, 32]} />
        <meshPhysicalMaterial color={b} roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, -h, 0]}>
        <sphereGeometry args={[radius, 32, 16]} />
        <meshPhysicalMaterial color={b} roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
    </group>
  )
}
