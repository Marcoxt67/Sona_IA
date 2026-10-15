import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimationMixer, Group, LoopOnce, LoopRepeat } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Asset } from "../lib/api";
export class AvatarBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="avatar-fallback">
        Visualização 3D indisponível neste dispositivo.
        <br />A mensagem e o histórico continuam disponíveis.
      </div>
    ) : (
      this.props.children
    );
  }
}
// Neutral placeholder model. No signing or hand gestures are generated.
function NeutralAvatar() {
  const body = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (body.current)
      body.current.position.y =
        -1.1 +
        (window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : Math.sin(clock.elapsedTime * 1.4) * 0.008);
  });
  const skin = "#b97550",
    shirt = "#7430E8";
  return (
    <group ref={body} position={[0, -1.1, 0]}>
      <mesh position={[0, 1.22, 0]} scale={[0.57, 0.76, 0.32]}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.93, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.32, 24]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 2.32, 0]} scale={[0.36, 0.44, 0.34]}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, -0.04]} scale={[0.37, 0.23, 0.33]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#282033" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.13, 2.37, 0.31]}>
            <sphereGeometry args={[0.033, 16, 16]} />
            <meshStandardMaterial color="#211c29" />
          </mesh>
          <mesh
            position={[side * 0.62, 1.14, 0]}
            rotation={[0, 0, side * 0.13]}
          >
            <capsuleGeometry args={[0.135, 0.86, 8, 20]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh position={[side * 0.68, 0.5, 0.01]} scale={[0.12, 0.19, 0.1]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.27, 0.34]} scale={[0.06, 0.085, 0.07]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 2.13, 0.307]} scale={[0.1, 0.018, 0.025]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#6d382f" />
      </mesh>
    </group>
  );
}
function ValidatedAnimation({
  asset,
  playing,
  speed,
  repeat,
  restart,
  onTime,
  onEnd,
}: AvatarProps & { asset: Asset }) {
  const gltf = useLoader(GLTFLoader, asset.url);
  const mixer = useRef<AnimationMixer | null>(null);
  useEffect(() => {
    const clip = gltf.animations.find((c) => c.name === asset.clip);
    if (!clip)
      throw new Error("A animação validada não contém o clipe especificado.");
    const instance = new AnimationMixer(gltf.scene);
    mixer.current = instance;
    const action = instance.clipAction(clip);
    action.setLoop(repeat ? LoopRepeat : LoopOnce, repeat ? Infinity : 1);
    action.clampWhenFinished = true;
    action.play();
    const finish = () => onEnd();
    instance.addEventListener("finished", finish);
    return () => {
      instance.removeEventListener("finished", finish);
      instance.stopAllAction();
      instance.uncacheRoot(gltf.scene);
    };
  }, [gltf, asset, repeat, restart, onEnd]);
  useFrame((_, delta) => {
    if (mixer.current && playing) {
      mixer.current.update(delta * speed);
      const action = mixer.current.existingAction(
        gltf.animations.find((c) => c.name === asset.clip)!,
      );
      onTime(action?.time ?? 0);
    }
  });
  return <primitive object={gltf.scene} />;
}
type AvatarProps = {
  asset?: Asset;
  playing: boolean;
  speed: number;
  repeat: boolean;
  restart: number;
  onTime: (t: number) => void;
  onEnd: () => void;
};
export default function Avatar(props: AvatarProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.55, 5.3], fov: 34 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.45, 0)}
      fallback={
        <div className="avatar-fallback">
          Seu dispositivo não oferece suporte a WebGL.
        </div>
      }
      aria-label={
        props.asset
          ? "Avatar com animação validada em Libras"
          : "Avatar ilustrativo em postura neutra, sem tradução em Libras"
      }
    >
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 4]} intensity={3} />
      <directionalLight position={[-3, 2, 1]} intensity={1} color="#d8ccff" />
      <Suspense fallback={null}>
        {props.asset ? (
          <ValidatedAnimation {...props} asset={props.asset} />
        ) : (
          <NeutralAvatar />
        )}
      </Suspense>
    </Canvas>
  );
}
