'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { HOLOGRAM_FIGURE_SVG } from './hologramFigure'

type HologramAvatarProps = {
  active: boolean
  listening: boolean
  speaking: boolean
  thinking: boolean
}

const FIGURE_ASPECT = 600 / 800
const PARTICLE_COUNT = 110

const figureVertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.x += sin(pos.y * 6.0 + uTime * 1.6) * 0.004 * (0.6 + uIntensity);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const figureFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColorB;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uReady;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    if (uReady < 0.5) discard;

    float ca = 0.0028 * (0.6 + uIntensity);
    vec4 sR = texture2D(uMap, vUv + vec2(ca, 0.0));
    vec4 sG = texture2D(uMap, vUv);
    vec4 sB = texture2D(uMap, vUv - vec2(ca, 0.0));

    float baseA = max(max(sR.a, sG.a), sB.a);
    if (baseA < 0.02) discard;

    vec3 baseColor = sG.rgb;

    float scan = sin(vUv.y * 320.0 - uTime * 3.4) * 0.5 + 0.5;
    scan = pow(scan, 1.4);

    float bandPos = fract(uTime * 0.11);
    float band = 1.0 - smoothstep(0.0, 0.14, abs(bandPos - vUv.y));
    band = pow(max(band, 0.0), 2.0);

    float grain = (hash(vUv * 900.0 + uTime * 0.3) - 0.5) * 0.12;
    float flicker = 0.96 + sin(uTime * 23.0) * 0.018 + sin(uTime * 7.3) * 0.018;

    vec3 holo = mix(uColor, uColorB, scan * 0.55);
    vec3 emissive = holo * (0.55 + scan * 0.22 + band * 0.95 + uIntensity * 0.45);
    vec3 tinted = mix(baseColor, holo, 0.55);
    vec3 finalColor = tinted * 0.55 + emissive * 0.7 + vec3(grain);

    finalColor.r += (sR.a - sG.a) * 0.6;
    finalColor.b += (sB.a - sG.a) * 0.6;

    float edge = smoothstep(0.0, 0.25, baseA) * (1.0 - smoothstep(0.25, 0.6, baseA));
    finalColor += holo * edge * 0.6;

    float alpha = baseA * uOpacity * flicker * (0.78 + scan * 0.15 + band * 0.2);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function useFigureTexture(svg: string) {
  const [ready, setReady] = useState(false)
  const texture = useMemo(() => {
    const t = new THREE.Texture()
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipMapLinearFilter
    t.magFilter = THREE.LinearFilter
    t.anisotropy = 8
    t.generateMipmaps = true
    return t
  }, [])

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      texture.image = img
      texture.needsUpdate = true
      setReady(true)
    }
    img.onerror = () => {
      console.error('No se pudo cargar el SVG de la figura holográfica.')
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    return () => {
      cancelled = true
    }
  }, [svg, texture])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  return { texture, ready }
}

function MedicalHologramFigure({ active, listening, speaking, thinking }: HologramAvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { texture, ready } = useFigureTexture(HOLOGRAM_FIGURE_SVG)
  const targetIntensity = listening ? 1.4 : speaking ? 1.2 : thinking ? 0.95 : active ? 0.7 : 0.45

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#22c55e') },
        uColorB: { value: new THREE.Color('#d9ffe8') },
        uIntensity: { value: targetIntensity },
        uOpacity: { value: 0.95 },
        uReady: { value: 0 },
      },
      vertexShader: figureVertexShader,
      fragmentShader: figureFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture])

  useEffect(() => {
    material.uniforms.uMap.value = texture
    material.uniforms.uReady.value = ready ? 1 : 0
  }, [material, ready, texture])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    material.uniforms.uTime.value = t
    material.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      material.uniforms.uIntensity.value,
      targetIntensity,
      0.06,
    )

    if (meshRef.current) {
      const breath = Math.sin(t * 1.35) * 0.025
      const speakPulse = speaking ? Math.sin(t * 15) * 0.012 : 0
      meshRef.current.position.y = breath + speakPulse
      meshRef.current.rotation.y = Math.sin(t * 0.4) * 0.06
      const target = active ? 1 : 0.95
      const scale = target + Math.sin(t * 1.35) * 0.005
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.08)
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, scale, 0.08)
    }
  })

  const height = 3.6
  const width = height * FIGURE_ASPECT

  return (
    <mesh ref={meshRef} material={material} position={[0, 0.1, 0]}>
      <planeGeometry args={[width, height, 1, 1]} />
    </mesh>
  )
}

function HoloFloor({ listening, speaking }: HologramAvatarProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const ringRef2 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.6
      const scale = 1 + Math.sin(t * 1.8) * 0.04 + (speaking ? Math.sin(t * 10) * 0.05 : 0)
      ringRef.current.scale.setScalar(scale)
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.4
      const scale = 1 + Math.cos(t * 1.4) * 0.05 + (listening ? Math.sin(t * 6) * 0.04 : 0)
      ringRef2.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[0, -1.85, 0]} rotation={[Math.PI / 2.05, 0, 0]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.95, 0.012, 8, 96]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.82} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringRef2}>
        <torusGeometry args={[0.7, 0.008, 8, 80]} />
        <meshBasicMaterial color="#bbf7d0" transparent opacity={0.68} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <ringGeometry args={[0, 0.58, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function ParticleField({ active, listening, speaking }: HologramAvatarProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = PARTICLE_COUNT

  const { positions, speeds } = useMemo(() => {
    const particlePositions = new Float32Array(count * 3)
    const particleSpeeds = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      const r = 0.4 + seededRandom(i + 1) * 1.4
      const theta = seededRandom(i + 101) * Math.PI * 2
      particlePositions[i * 3] = Math.cos(theta) * r
      particlePositions[i * 3 + 1] = -1.6 + seededRandom(i + 201) * 3.6
      particlePositions[i * 3 + 2] = Math.sin(theta) * r * 0.4
      particleSpeeds[i] = 0.05 + seededRandom(i + 301) * 0.25
    }

    return { positions: particlePositions, speeds: particleSpeeds }
  }, [count])

  const energy = listening ? 1.4 : speaking ? 1.25 : active ? 0.85 : 0.5

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const geom = pointsRef.current.geometry as THREE.BufferGeometry
    const attr = geom.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array

    for (let i = 0; i < count; i += 1) {
      arr[i * 3 + 1] += speeds[i] * delta * (0.6 + energy * 0.5)
      if (arr[i * 3 + 1] > 2.4) {
        arr[i * 3 + 1] = -1.8
      }
    }

    attr.needsUpdate = true
    pointsRef.current.rotation.y += delta * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#34d399"
        size={0.022 + energy * 0.008}
        transparent
        opacity={0.32 + energy * 0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function HologramAvatar(props: HologramAvatarProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 5.6], fov: 32 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.6} />
      <MedicalHologramFigure {...props} />
      <HoloFloor {...props} />
      <ParticleField {...props} />
    </Canvas>
  )
}
