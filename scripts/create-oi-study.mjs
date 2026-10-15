// Manual keyframe study from the user-provided reference, NOT motion capture or validated Libras.
import * as T from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mkdirSync, writeFileSync } from "node:fs";
// GLTFExporter uses the browser FileReader API for binary packing; Node supplies Blob.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`;
      this.onloadend?.();
    });
  }
};
const scene = new T.Scene();
scene.name = "Icaro_Oi_Experimental";
const skin = new T.MeshStandardMaterial({ color: "#b97550", roughness: 0.72 });
const shirt = new T.MeshStandardMaterial({ color: "#7430e8", roughness: 0.85 });
const dark = new T.MeshStandardMaterial({ color: "#282033", roughness: 0.9 });
const white = new T.MeshStandardMaterial({ color: "#fff8ed" });
const mouthMaterial = new T.MeshStandardMaterial({ color: "#4f2425" });
function ellipsoid(parent, name, position, scale, material = skin) {
  const mesh = new T.Mesh(new T.SphereGeometry(1, 20, 16), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}
function group(parent, name, position = [0, 0, 0]) {
  const node = new T.Group();
  node.name = name;
  node.position.set(...position);
  parent.add(node);
  return node;
}
function segment(parent, name, length, radius, material = skin) {
  const mesh = new T.Mesh(
    new T.CapsuleGeometry(radius, Math.max(0.001, length - 2 * radius), 5, 12),
    material,
  );
  mesh.name = name;
  mesh.position.y = length / 2;
  parent.add(mesh);
  return mesh;
}
ellipsoid(scene, "Torso", [0, -0.02, 0], [0.43, 0.58, 0.25], shirt);
ellipsoid(scene, "ShoulderLine", [0, 0.4, 0], [0.51, 0.22, 0.235], shirt);
ellipsoid(scene, "Hips", [0, -0.6, -0.02], [0.35, 0.19, 0.22], dark);
ellipsoid(scene, "Neck", [0, 0.65, 0], [0.12, 0.2, 0.12]);
const head = group(scene, "Head", [0, 1.03, 0]);
ellipsoid(head, "Face", [0, 0, 0], [0.3, 0.375, 0.28]);
ellipsoid(head, "Hair", [0, 0.245, -0.045], [0.31, 0.17, 0.275], dark);
for (const side of [-1, 1]) {
  ellipsoid(head, `Ear${side}`, [side * 0.294, 0, 0], [0.045, 0.09, 0.055]);
  ellipsoid(
    head,
    `EyeWhite${side}`,
    [side * 0.105, 0.065, 0.247],
    [0.053, 0.035, 0.021],
    white,
  );
  ellipsoid(
    head,
    `Eye${side}`,
    [side * 0.105, 0.063, 0.265],
    [0.023, 0.028, 0.012],
    dark,
  );
  const brow = ellipsoid(
    head,
    `Brow${side}`,
    [side * 0.107, 0.137, 0.24],
    [0.065, 0.013, 0.018],
    dark,
  );
  brow.rotation.z = side * -0.08;
}
ellipsoid(head, "Nose", [0, -0.012, 0.28], [0.045, 0.068, 0.045]);
const mouth = ellipsoid(
  head,
  "Mouth",
  [0, -0.145, 0.254],
  [0.065, 0.014, 0.018],
  mouthMaterial,
);
const arms = {};
for (const side of [-1, 1]) {
  const tag = side === -1 ? "Right" : "Left";
  const upper = group(scene, `${tag}UpperArm`, [side * 0.45, 0.39, 0]);
  segment(upper, `${tag}Sleeve`, 0.46, 0.103, shirt);
  const lower = group(scene, `${tag}Forearm`);
  segment(lower, `${tag}ForearmSkin`, 0.43, 0.072);
  const hand = group(scene, `${tag}Hand`);
  ellipsoid(hand, `${tag}Palm`, [0, 0.09, 0], [0.104, 0.123, 0.043]);
  const fingers = [];
  const dimensions = [
    ["Index", 0.071, 0.205],
    ["Middle", 0.021, 0.225],
    ["Ring", -0.03, 0.207],
    ["Little", -0.077, 0.166],
  ];
  for (const [name, x, length] of dimensions) {
    const root = group(hand, `${tag}${name}Base`, [x * -side, 0.177, 0]);
    const joints = [root];
    let parent = root;
    const lengths = [length * 0.44, length * 0.32, length * 0.24];
    for (let i = 0; i < 3; i++) {
      const radius = (name === "Little" ? 0.018 : 0.021) * (1 - i * 0.12);
      segment(parent, `${tag}${name}Phalanx${i}`, lengths[i], radius);
      if (i < 2) {
        parent = group(parent, `${tag}${name}Joint${i + 1}`, [
          0,
          lengths[i],
          0,
        ]);
        joints.push(parent);
      }
    }
    fingers.push({ name, joints });
  }
  const thumb = group(hand, `${tag}ThumbBase`, [0.092 * -side, 0.045, 0.016]);
  thumb.rotation.z = side * 0.8;
  thumb.rotation.x = 0.35;
  segment(thumb, `${tag}ThumbProximal`, 0.085, 0.027);
  const thumbMid = group(thumb, `${tag}ThumbJoint`, [0, 0.085, 0]);
  thumbMid.rotation.z = -side * 0.85;
  thumbMid.rotation.x = 0.65;
  segment(thumbMid, `${tag}ThumbDistal`, 0.075, 0.023);
  arms[tag] = { side, upper, lower, hand, fingers, thumb, thumbMid };
}
const duration = 5.2,
  frames = 157;
const times = Array.from(
  { length: frames },
  (_, i) => (i * duration) / (frames - 1),
);
const animated = [
  ...Object.values(arms).flatMap((a) => [
    a.upper,
    a.lower,
    a.hand,
    ...a.fingers.flatMap((f) => f.joints),
    a.thumb,
    a.thumbMid,
  ]),
  head,
];
const data = new Map(
  animated.map((n) => [n, { position: [], quaternion: [] }]),
);
const mouthScales = [];
const smooth = (a, b, t) => {
  const x = T.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
function poseArm(arm, wrist, rotation) {
  const { side, upper, lower, hand } = arm;
  const shoulder = new T.Vector3(side * 0.45, 0.39, 0);
  // Two-bone IK: fixed limb lengths, elbow in a stable outward/downward plane.
  const target = new T.Vector3(...wrist),
    delta = target.clone().sub(shoulder);
  const length = delta.length(),
    direction = delta.normalize(),
    l1 = 0.46,
    l2 = 0.43;
  const along = (l1 * l1 - l2 * l2 + length * length) / (2 * length);
  const bend = new T.Vector3(side * 0.65, -1, -0.08);
  bend.addScaledVector(direction, -bend.dot(direction)).normalize();
  const elbow = shoulder
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, l1 * l1 - along * along)));
  upper.position.copy(shoulder);
  lower.position.copy(elbow);
  hand.position.copy(target);
  upper.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    elbow.clone().sub(shoulder).normalize(),
  );
  lower.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    target.clone().sub(elbow).normalize(),
  );
  hand.rotation.set(...rotation);
}
for (const t of times) {
  const raised = smooth(0.35, 1.15, t) * (1 - smooth(4.25, 4.95, t));
  const little = smooth(2.15, 2.7, t) * (1 - smooth(4.15, 4.65, t));
  poseArm(
    arms.Right,
    [-0.3 - 0.2 * raised, -0.42 + 0.91 * raised, 0.24 + 0.22 * raised],
    [0, -0.65 * raised, 0.35 * (1 - raised)],
  );
  poseArm(arms.Left, [0.12, -0.37, 0.3], [0, 0, 1.22]);
  for (const [tag, arm] of Object.entries(arms)) {
    for (const { name, joints } of arm.fingers) {
      const curl =
        tag === "Right"
          ? 0.35 + 0.75 * raised - (name === "Little" ? 1.08 * little : 0)
          : 0.3;
      joints.forEach(
        (joint, i) =>
          (joint.rotation.x = curl * (i === 0 ? 1 : i === 1 ? 1.15 : 0.85)),
      );
      joints[0].rotation.z = name === "Little" ? -0.1 * raised : 0;
    }
    if (tag === "Right") {
      const thumbDirection = new T.Vector3(-0.4, 0.65, 0.64).normalize();
      arm.thumb.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        thumbDirection,
      );
      const distalWorld = new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        new T.Vector3(-0.35, 0.6, 0.72).normalize(),
      );
      arm.thumbMid.quaternion
        .copy(arm.thumb.quaternion)
        .invert()
        .multiply(distalWorld);
    }
  }
  head.rotation.y = -0.07 * raised;
  head.rotation.z = -0.025 * raised;
  mouth.scale.set(
    0.065 - 0.022 * raised * (1 - little),
    0.014 + 0.036 * raised * (1 - little),
    0.018,
  );
  mouthScales.push(...mouth.scale.toArray());
  for (const node of animated) {
    const entry = data.get(node);
    entry.position.push(...node.position.toArray());
    entry.quaternion.push(...node.quaternion.toArray());
  }
}
const tracks = [];
for (const node of animated) {
  const entry = data.get(node);
  tracks.push(
    new T.VectorKeyframeTrack(`${node.name}.position`, times, entry.position),
    new T.QuaternionKeyframeTrack(
      `${node.name}.quaternion`,
      times,
      entry.quaternion,
    ),
  );
}
tracks.push(new T.VectorKeyframeTrack("Mouth.scale", times, mouthScales));
const clip = new T.AnimationClip("oi-study-v1", duration, tracks);
// Reset transforms to the first keyframe for a coherent paused initial view.
const mixer = new T.AnimationMixer(scene);
mixer.clipAction(clip).play();
mixer.setTime(0);
scene.updateMatrixWorld(true);
scene.traverse((node) => {
  if (node.isMesh) node.geometry.normalizeNormals();
});
const binary = await new GLTFExporter().parseAsync(scene, {
  binary: true,
  animations: [clip],
  onlyVisible: true,
});
mkdirSync("public/animations", { recursive: true });
writeFileSync("public/animations/oi-experimental.glb", Buffer.from(binary));
const manifest = {
  id: "oi-study",
  title: "Oi · estudo de movimento",
  status: "experimental",
  source: "https://www.youtube.com/watch?v=HYuNejbG8eo",
  sourceCredit: "LibrasLab · vídeo fornecido pelo usuário",
  method:
    "Keyframes manuais por observação de vídeo monocular, sem captura de movimento.",
  review: null,
  limitations: [
    "Profundidade e contato entre dedos aproximados.",
    "Expressões faciais simplificadas.",
    "Sem validação linguística ou aprovação dos autores da referência.",
  ],
  asset: {
    kind: "gltf",
    url: "/animations/oi-experimental.glb",
    clip: clip.name,
    version: "experimental-1",
    duration,
    captions: [
      { start: 0, end: 1.15, text: "Estudo experimental · preparação" },
      {
        start: 1.15,
        end: 2.15,
        text: "Estudo experimental · primeira configuração",
      },
      {
        start: 2.15,
        end: 4.25,
        text: "Estudo experimental · transição e extensão do mínimo",
      },
      {
        start: 4.25,
        end: duration,
        text: "Estudo experimental · retorno ao repouso",
      },
    ],
  },
};
writeFileSync(
  "public/animations/oi-experimental.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Estudo experimental exportado: ${binary.byteLength} bytes, ${tracks.length} trilhas, ${duration}s. Não é uma tradução validada.`,
);
