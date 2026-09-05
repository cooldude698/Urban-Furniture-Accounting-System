import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Trash2,
  Plus,
  Lightbulb,
  Grid,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Sparkles,
  Compass,
} from 'lucide-react';

interface ShowroomModel {
  id: string;
  filename: string;
  name: string;
  category: string;
  defaultScale: number;
  defaultY: number;
  sizeBytes: number;
  sizeKB: string;
  url: string;
}

interface PlacedFurniture {
  instanceId: string;
  modelId: string;
  name: string;
  category: string;
  url: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

type AmbienceMode = 'morning' | 'studio' | 'dusk';
type CameraViewMode = 'walkin' | 'overview' | 'topdown';

export const PortalRoomStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preloadedModelUrl = searchParams.get('model');

  // Canvas & Three.js Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dracoLoaderRef = useRef<DRACOLoader | null>(null);

  // Mesh reference map for placed objects: instanceId -> THREE.Group
  const placedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const dropIndicatorRef = useRef<THREE.Mesh | null>(null);

  // Lighting & room refs
  const sunlightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ceilingSpot1Ref = useRef<THREE.PointLight | null>(null);
  const ceilingSpot2Ref = useRef<THREE.PointLight | null>(null);
  const lampLightRef = useRef<THREE.PointLight | null>(null);
  const ceilingLightGroupRef = useRef<THREE.Group | null>(null);
  const standingLampGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Camera animation ref
  const cameraAnimRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  }>({
    active: false,
    startTime: 0,
    duration: 500,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // Data states
  const [catalogModels, setCatalogModels] = useState<ShowroomModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [placedItems, setPlacedItems] = useState<PlacedFurniture[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Studio Settings
  const [cameraView, setCameraView] = useState<CameraViewMode>('walkin');
  const [ambience, setAmbience] = useState<AmbienceMode>('morning');
  const [ceilingLightOn, setCeilingLightOn] = useState<boolean>(true);
  const [standingLampOn, setStandingLampOn] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isDockOpen, setIsDockOpen] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<'presets' | 'lighting' | null>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState<boolean>(false);

  // 1. Fetch available models from API
  useEffect(() => {
    fetch('/api/portal/models')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          // Normalize URLs to uppercase /Models/ for consistency
          const normalized = json.data.map((m: ShowroomModel) => ({
            ...m,
            url: m.url.replace(/^\/models\//i, '/Models/'),
          }));
          setCatalogModels(normalized);
        }
      })
      .catch((err) => console.error('Failed to load models:', err));
  }, []);

  // 2. Initialise Three.js Studio Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    let animationFrameId: number;

    // DRACOLoader setup (served locally with zero external network requests)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoaderRef.current = dracoLoader;

    // High-performance antialiased renderer with ACESFilmic tone mapping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25; // Luminous, inviting Japandi interior exposure
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF9F6F0); // Warm luminous studio backdrop
    sceneRef.current = scene;

    // Camera — wide 56° lens positioned directly inside room entrance looking at living space
    const camera = new THREE.PerspectiveCamera(
      56,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Initial Walk-In perspective: standing at living room threshold looking towards sofa & sunlit window
    camera.position.set(0.2, 1.45, 0.4);
    cameraRef.current = camera;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    controls.minDistance = 0.8;
    controls.maxDistance = 14.0;
    controls.target.set(0.0, 0.85, -1.8); // Center look target on living room
    controlsRef.current = controls;

    // ── Luminous Architectural Lighting Setup ──
    // 1. Soft Hemisphere Light: sky white + warm floor bounce
    const hemiLight = new THREE.HemisphereLight(0xFFFAF2, 0xCDB69B, 1.2);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // 2. Ambient Fill Light
    const ambientLight = new THREE.AmbientLight(0xFFF7EB, 0.65);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // 3. Directional Window Sunlight: streaming golden light into the interior
    const sunlight = new THREE.DirectionalLight(0xFFE8D0, 1.6);
    sunlight.position.set(-4.5, 2.6, 0.2);
    sunlight.target.position.set(0, 0.2, 0);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 1024;
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.bias = -0.0006;
    sunlight.shadow.camera.near = 0.5;
    sunlight.shadow.camera.far = 15;
    sunlight.shadow.camera.left = -4;
    sunlight.shadow.camera.right = 4;
    sunlight.shadow.camera.top = 4;
    sunlight.shadow.camera.bottom = -4;
    scene.add(sunlight);
    scene.add(sunlight.target);
    sunlightRef.current = sunlight;

    // 4. Ceiling Recessed Interior Lights
    const spot1 = new THREE.PointLight(0xFFF2DE, 1.1, 8, 1.6);
    spot1.position.set(0, 2.7, 0.6);
    spot1.castShadow = true;
    scene.add(spot1);
    ceilingSpot1Ref.current = spot1;

    const spot2 = new THREE.PointLight(0xFFF2DE, 0.9, 8, 1.6);
    spot2.position.set(0, 2.7, -1.8);
    spot2.castShadow = true;
    scene.add(spot2);
    ceilingSpot2Ref.current = spot2;

    // 5. Standing Lamp light
    const lampLight = new THREE.PointLight(0xFFDEB0, 0.8, 5, 2.0);
    lampLight.position.set(-2.8, 1.5, -2.8);
    scene.add(lampLight);
    lampLightRef.current = lampLight;

    // ── Floor Reticle (Indicator for Dragging & Dropping) ──
    const reticleGeo = new THREE.RingGeometry(0.55, 0.62, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x4A3A34,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const dropIndicator = new THREE.Mesh(reticleGeo, reticleMat);
    dropIndicator.rotation.x = -Math.PI / 2;
    dropIndicator.position.y = 0.012;
    scene.add(dropIndicator);
    dropIndicatorRef.current = dropIndicator;

    // ── Selection Indicator Ring (drawn below selected item) ──
    const ringGeo = new THREE.RingGeometry(0.72, 0.8, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4A3A34,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.01;
    scene.add(selectionRing);
    selectionRingRef.current = selectionRing;

    // Floor placement grid helper (optional toggle)
    const grid = new THREE.GridHelper(9, 18, 0x4A3A34, 0xD0AE92);
    grid.position.y = 0.005;
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    grid.visible = false;
    scene.add(grid);
    gridHelperRef.current = grid;

    // ── Load Blank Room 3D Model (/Models/room_blank.compressed.glb) ──
    const roomLoader = new GLTFLoader();
    roomLoader.setDRACOLoader(dracoLoader);

    roomLoader.load(
      '/Models/room_blank.compressed.glb',
      (gltf) => {
        const roomRoot = gltf.scene;

        roomRoot.traverse((child) => {
          const lowerName = child.name.toLowerCase();

          // Hide ceiling mesh Object_6 so top & orbit views are open
          if (child.name.includes('Object_6') || lowerName.includes('roof') || lowerName.includes('ceiling')) {
            child.visible = false;
            return;
          }

          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.receiveShadow = true;
            mesh.castShadow = true;

            // Enhance materials for peaceful Japandi aesthetics
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;

              // Clean, bright, warm Japandi lime-wash plaster (strip dirty low-res texture)
              if (mat.name === 'beige_wall_001' || mat.name.includes('wall')) {
                mat.map = null; // Strips the muddy dark beige bitmap
                mat.color = new THREE.Color(0xFDFBF7); // Radiant, serene warm lime plaster
                mat.roughness = 0.94;
                mat.metalness = 0.0;
                mat.side = THREE.DoubleSide; // Prevents backface culling artifacts
                mat.needsUpdate = true;
              }

              // Laminate wood floor satin finish
              if (mat.name === 'laminate_floor_02' || mat.name.includes('floor')) {
                mat.roughness = 0.42;
                mat.metalness = 0.02;
                mat.needsUpdate = true;
              }

              // Baseboard / wood trim
              if (mat.name === 'plywood') {
                mat.roughness = 0.55;
                mat.needsUpdate = true;
              }

              // Architectural dark espresso window trim
              if (mat.name === 'Plastic') {
                mat.color = new THREE.Color(0x382E2B);
                mat.roughness = 0.5;
                mat.needsUpdate = true;
              }

              // Architectural glass windows
              if (mat.name === 'Glass') {
                mat.transparent = true;
                mat.opacity = 0.3;
                mat.roughness = 0.1;
                mat.needsUpdate = true;
              }
            }
          }
        });

        // Compute Bounding Box & Center grounded at y = 0
        const box = new THREE.Box3().setFromObject(roomRoot);
        const center = box.getCenter(new THREE.Vector3());

        roomRoot.position.x = -center.x;
        roomRoot.position.y = -box.min.y;
        roomRoot.position.z = -center.z;

        scene.add(roomRoot);
      },
      undefined,
      (err) => console.warn('Room structure model load warning:', err)
    );

    // ── Interactive Direct Dragging on Floor Canvas ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersect = new THREE.Vector3();

    let isPointerDown = false;
    let isDraggingPiece = false;
    let draggedGroup: THREE.Group | null = null;
    let activeInstanceId: string | null = null;
    let dragOffset = new THREE.Vector3();
    let pointerStart = { x: 0, y: 0 };

    const getCanvasMouse = (event: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return; // Left-click only

      isPointerDown = true;
      isDraggingPiece = false;
      draggedGroup = null;
      activeInstanceId = null;
      pointerStart = { x: event.clientX, y: event.clientY };

      const m = getCanvasMouse(event);
      mouse.x = m.x;
      mouse.y = m.y;
      raycaster.setFromCamera(mouse, camera);

      // Collect placed furniture objects
      const placedMeshes: THREE.Object3D[] = [];
      placedMeshesRef.current.forEach((group) => {
        placedMeshes.push(...group.children);
      });

      const intersects = raycaster.intersectObjects(placedMeshes, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        let matchedId: string | null = null;
        let matchedGroup: THREE.Group | null = null;

        while (obj && obj.parent) {
          for (const [id, group] of placedMeshesRef.current.entries()) {
            if (obj === group || obj.parent === group) {
              matchedId = id;
              matchedGroup = group;
              break;
            }
          }
          if (matchedId) break;
          obj = obj.parent;
        }

        if (matchedId && matchedGroup) {
          draggedGroup = matchedGroup;
          activeInstanceId = matchedId;
          controls.enabled = false; // Immediately lock OrbitControls so camera doesn't fight dragging
          setSelectedInstanceId(matchedId);

          if (raycaster.ray.intersectPlane(floorPlane, planeIntersect)) {
            dragOffset.set(
              matchedGroup.position.x - planeIntersect.x,
              0,
              matchedGroup.position.z - planeIntersect.z
            );
          }
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return;

      const dist = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);

      if (dist > 3 && draggedGroup) {
        isDraggingPiece = true;
      }

      if (isDraggingPiece && draggedGroup) {
        const m = getCanvasMouse(event);
        mouse.x = m.x;
        mouse.y = m.y;
        raycaster.setFromCamera(mouse, camera);

        if (raycaster.ray.intersectPlane(floorPlane, planeIntersect)) {
          // Keep within architectural living room floor
          const targetX = Math.max(-2.8, Math.min(2.8, planeIntersect.x + dragOffset.x));
          const targetZ = Math.max(-3.4, Math.min(0.8, planeIntersect.z + dragOffset.z));

          draggedGroup.position.x = targetX;
          draggedGroup.position.z = targetZ;

          if (selectionRingRef.current) {
            selectionRingRef.current.position.x = targetX;
            selectionRingRef.current.position.z = targetZ;
          }
        }
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      controls.enabled = true; // Always restore camera orbit controls on release

      if (isDraggingPiece && draggedGroup && activeInstanceId) {
        const finalX = draggedGroup.position.x;
        const finalZ = draggedGroup.position.z;

        // Persist final position in React state
        setPlacedItems((prev) =>
          prev.map((item) =>
            item.instanceId === activeInstanceId
              ? { ...item, position: [finalX, item.position[1], finalZ] }
              : item
          )
        );
      } else if (!isDraggingPiece && isPointerDown) {
        // Just a click — if clicked empty space, deselect
        const dist = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        if (dist < 4 && !draggedGroup) {
          setSelectedInstanceId(null);
        }
      }

      isPointerDown = false;
      isDraggingPiece = false;
      draggedGroup = null;
      activeInstanceId = null;
      controls.enabled = true;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop with smooth camera interpolation
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation
      if (cameraAnimRef.current.active) {
        const elapsed = performance.now() - cameraAnimRef.current.startTime;
        const progress = Math.min(1, elapsed / cameraAnimRef.current.duration);
        // Smooth easeInOutQuad curve
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        camera.position.lerpVectors(cameraAnimRef.current.startPos, cameraAnimRef.current.endPos, ease);
        controls.target.lerpVectors(cameraAnimRef.current.startTarget, cameraAnimRef.current.endTarget, ease);

        if (progress >= 1) {
          cameraAnimRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();
      dracoLoader.dispose();
      renderer.dispose();
    };
  }, []);

  // 3. Smooth Camera View Transitions
  const animateCameraTo = useCallback((targetPos: [number, number, number], targetLookAt: [number, number, number]) => {
    if (!cameraRef.current || !controlsRef.current) return;

    cameraAnimRef.current = {
      active: true,
      startTime: performance.now(),
      duration: 500,
      startPos: cameraRef.current.position.clone(),
      endPos: new THREE.Vector3(...targetPos),
      startTarget: controlsRef.current.target.clone(),
      endTarget: new THREE.Vector3(...targetLookAt),
    };
  }, []);

  const handleSetCameraView = (view: CameraViewMode) => {
    setCameraView(view);
    if (view === 'walkin') {
      // Eye level inside room facing living space
      animateCameraTo([0.2, 1.45, 0.4], [0.0, 0.85, -1.8]);
    } else if (view === 'overview') {
      // Elevated architectural dollhouse perspective (unobstructed diagonal downview)
      animateCameraTo([2.8, 5.5, 2.2], [0.0, 0.4, -1.4]);
    } else if (view === 'topdown') {
      // 2D/3D Top-down plan view directly over living room
      animateCameraTo([0.0, 8.5, -1.4], [0.0, 0.0, -1.4]);
    }
  };

  // 4. Handle Lighting Toggles & Ambience Presets
  useEffect(() => {
    if (!sunlightRef.current || !ambientLightRef.current || !hemiLightRef.current) return;

    if (ambience === 'morning') {
      sunlightRef.current.intensity = 1.6;
      sunlightRef.current.color.setHex(0xFFE8D0);
      hemiLightRef.current.intensity = 1.2;
      hemiLightRef.current.color.setHex(0xFFFAF2);
      ambientLightRef.current.intensity = 0.65;
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0xF9F6F0);
    } else if (ambience === 'studio') {
      sunlightRef.current.intensity = 1.0;
      sunlightRef.current.color.setHex(0xFFFFFF);
      hemiLightRef.current.intensity = 1.4;
      hemiLightRef.current.color.setHex(0xFFFFFF);
      ambientLightRef.current.intensity = 0.85;
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0xF6F3ED);
    } else if (ambience === 'dusk') {
      sunlightRef.current.intensity = 0.45;
      sunlightRef.current.color.setHex(0xFFA573);
      hemiLightRef.current.intensity = 0.6;
      hemiLightRef.current.color.setHex(0xEED9C4);
      ambientLightRef.current.intensity = 0.4;
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0xEDE6DB);
    }

    if (ceilingSpot1Ref.current && ceilingSpot2Ref.current) {
      const spotIntensity = ceilingLightOn ? (ambience === 'dusk' ? 1.4 : 1.1) : 0;
      ceilingSpot1Ref.current.intensity = spotIntensity;
      ceilingSpot2Ref.current.intensity = spotIntensity;
    }
    if (ceilingLightGroupRef.current) {
      ceilingLightGroupRef.current.visible = ceilingLightOn;
    }

    if (lampLightRef.current) {
      lampLightRef.current.intensity = standingLampOn ? (ambience === 'dusk' ? 1.3 : 0.8) : 0;
    }
    if (standingLampGroupRef.current) {
      standingLampGroupRef.current.visible = standingLampOn;
    }

    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [ambience, ceilingLightOn, standingLampOn, showGrid]);

  // 5. Update Selection Ring Indicator Position
  useEffect(() => {
    if (!selectionRingRef.current) return;

    if (!selectedInstanceId) {
      (selectionRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      return;
    }

    const mesh = placedMeshesRef.current.get(selectedInstanceId);
    if (mesh) {
      selectionRingRef.current.position.x = mesh.position.x;
      selectionRingRef.current.position.z = mesh.position.z;
      (selectionRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6;
    }
  }, [selectedInstanceId, placedItems]);

  // 6. Add Furniture Model to Scene
  const handleAddFurniture = useCallback((model: ShowroomModel, customPos?: [number, number, number]) => {
    if (!sceneRef.current) return;
    setLoadingModel(true);

    const instanceId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const loader = new GLTFLoader();
    if (dracoLoaderRef.current) {
      loader.setDRACOLoader(dracoLoaderRef.current);
    }

    // Default position: in front of the camera or staggered
    const pos: [number, number, number] = customPos || [
      (Math.random() - 0.5) * 2.2,
      0,
      (Math.random() - 0.5) * 2.0 - 0.4,
    ];

    const modelUrl = model.url.replace(/^\/models\//i, '/Models/');

    loader.load(
      modelUrl,
      (gltf) => {
        const group = new THREE.Group();
        const inner = gltf.scene;

        inner.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Compute Bounding Box & Scale to realistic architectural dimensions
        const rawBox = new THREE.Box3().setFromObject(inner);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const rawCenter = rawBox.getCenter(new THREE.Vector3());

        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        const targetDim = model.category === 'Beds' ? 2.3 : (model.category === 'Seating' && model.name.includes('Large') ? 2.2 : 1.5);
        const scale = maxDim > 0 ? (targetDim / maxDim) * model.defaultScale : 1;

        // Center inner model horizontally and ground its base flush at y = 0
        inner.position.set(-rawCenter.x, -rawBox.min.y, -rawCenter.z);
        group.add(inner);
        group.scale.set(scale, scale, scale);
        group.position.set(pos[0], 0, pos[2]);

        sceneRef.current?.add(group);
        placedMeshesRef.current.set(instanceId, group);

        const newItem: PlacedFurniture = {
          instanceId,
          modelId: model.id,
          name: model.name,
          category: model.category,
          url: modelUrl,
          position: [pos[0], 0, pos[2]],
          rotationY: 0,
          scale,
        };

        setPlacedItems((prev) => [...prev, newItem]);
        setSelectedInstanceId(instanceId);
        setLoadingModel(false);
      },
      undefined,
      (err) => {
        console.error('Error loading furniture model:', err);
        setLoadingModel(false);
      }
    );
  }, []);

  // 7. Handle Canvas Drag & Drop from Bottom Tray
  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDraggingOverCanvas) setIsDraggingOverCanvas(true);

    // Update 3D reticle on the floor
    if (canvasRef.current && cameraRef.current && dropIndicatorRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(normX, normY), cameraRef.current);
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersect = new THREE.Vector3();

      if (ray.ray.intersectPlane(floorPlane, intersect)) {
        dropIndicatorRef.current.position.x = Math.max(-3.6, Math.min(3.6, intersect.x));
        dropIndicatorRef.current.position.z = Math.max(-3.6, Math.min(3.6, intersect.z));
        (dropIndicatorRef.current.material as THREE.MeshBasicMaterial).opacity = 0.7;
      }
    }
  };

  const handleCanvasDragLeave = () => {
    setIsDraggingOverCanvas(false);
    if (dropIndicatorRef.current) {
      (dropIndicatorRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
    if (dropIndicatorRef.current) {
      (dropIndicatorRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    const modelId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('modelId');
    if (!modelId || !cameraRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(normX, normY), cameraRef.current);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();

    let targetX = 0;
    let targetZ = -1.0;
    if (ray.ray.intersectPlane(floorPlane, intersect)) {
      targetX = Math.max(-2.8, Math.min(2.8, intersect.x));
      targetZ = Math.max(-3.2, Math.min(0.8, intersect.z));
    }

    const model = catalogModels.find((m) => m.id === modelId || m.filename === modelId);
    if (model) {
      handleAddFurniture(model, [targetX, 0, targetZ]);
    }
  };

  // 8. Preload room layout so the space is inviting and styled upon entry
  useEffect(() => {
    if (catalogModels.length === 0) return;

    if (preloadedModelUrl) {
      const match = catalogModels.find((m) => m.url === preloadedModelUrl || m.filename === preloadedModelUrl);
      if (match) {
        handleAddFurniture(match, [0, 0, -1.0]);
        return;
      }
    }

    // Default warm Japandi living room layout
    if (placedItems.length === 0) {
      const couch = catalogModels.find((m) => m.filename.includes('Couch Large'));
      const table = catalogModels.find((m) => m.filename.includes('Table Round Small'));
      const chair = catalogModels.find((m) => m.filename.includes('Poly') || m.filename.includes('Chair by Quaternius'));

      if (couch) handleAddFurniture(couch, [0, 0, -1.8]);
      if (table) handleAddFurniture(table, [0, 0, -0.6]);
      if (chair) handleAddFurniture(chair, [1.3, 0, -0.7]);
    }
  }, [catalogModels, preloadedModelUrl]);

  // 9. Item Manipulation (Rotate, Move, Remove)
  const handleRotateSelected = useCallback((deltaAngle: number) => {
    if (!selectedInstanceId) return;
    const mesh = placedMeshesRef.current.get(selectedInstanceId);
    if (!mesh) return;

    mesh.rotation.y += deltaAngle;
    setPlacedItems((prev) =>
      prev.map((item) =>
        item.instanceId === selectedInstanceId
          ? { ...item, rotationY: mesh.rotation.y }
          : item
      )
    );
  }, [selectedInstanceId]);

  const handleRemoveSelected = useCallback(() => {
    if (!selectedInstanceId || !sceneRef.current) return;
    const mesh = placedMeshesRef.current.get(selectedInstanceId);
    if (mesh) {
      sceneRef.current.remove(mesh);
      placedMeshesRef.current.delete(selectedInstanceId);
    }
    setPlacedItems((prev) => prev.filter((item) => item.instanceId !== selectedInstanceId));
    setSelectedInstanceId(null);
  }, [selectedInstanceId]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedInstanceId) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRotateSelected(Math.PI / 4);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleRemoveSelected();
      } else if (e.key === 'Escape') {
        setSelectedInstanceId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInstanceId, handleRotateSelected, handleRemoveSelected]);

  // Load Preset Spaces
  const handleLoadPreset = (preset: 'lounge' | 'study' | 'bedroom' | 'blank') => {
    placedMeshesRef.current.forEach((mesh) => {
      sceneRef.current?.remove(mesh);
    });
    placedMeshesRef.current.clear();
    setPlacedItems([]);
    setSelectedInstanceId(null);
    setActiveMenu(null);

    if (preset === 'blank') return;

    if (preset === 'lounge') {
      const couch = catalogModels.find((m) => m.filename.includes('Couch Large'));
      const table = catalogModels.find((m) => m.filename.includes('Table Round Small'));
      const chair = catalogModels.find((m) => m.filename.includes('Poly') || m.filename.includes('Chair'));
      if (couch) handleAddFurniture(couch, [0, 0, -1.5]);
      if (table) handleAddFurniture(table, [0, 0, -0.2]);
      if (chair) handleAddFurniture(chair, [1.6, 0, -0.4]);
      handleSetCameraView('walkin');
    } else if (preset === 'study') {
      const desk = catalogModels.find((m) => m.filename.includes('Desk by dook') || m.filename.includes('Desk'));
      const chair = catalogModels.find((m) => m.filename.includes('Office Chair'));
      const shelf = catalogModels.find((m) => m.filename.includes('Bookcase'));
      if (desk) handleAddFurniture(desk, [0, 0, -0.8]);
      if (chair) handleAddFurniture(chair, [0, 0, 0.6]);
      if (shelf) handleAddFurniture(shelf, [-2.2, 0, -1.8]);
      handleSetCameraView('overview');
    } else if (preset === 'bedroom') {
      const bed = catalogModels.find((m) => m.filename.includes('Bed Double by Quaternius') || m.filename.includes('Bed Double'));
      const stand = catalogModels.find((m) => m.filename.includes('Night Stand'));
      const drawer = catalogModels.find((m) => m.filename.includes('Drawer'));
      if (bed) handleAddFurniture(bed, [0, 0, -1.2]);
      if (stand) handleAddFurniture(stand, [-1.8, 0, -1.2]);
      if (drawer) handleAddFurniture(drawer, [2.2, 0, 0.4]);
      handleSetCameraView('walkin');
    }
  };

  const selectedItem = placedItems.find((item) => item.instanceId === selectedInstanceId);
  const categories = ['All', 'Seating', 'Beds', 'Tables', 'Storage'];
  const filteredModels = selectedCategory === 'All'
    ? catalogModels.filter((m) => m.category !== 'Lighting')
    : catalogModels.filter((m) => m.category === selectedCategory);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 104px)',
        overflow: 'hidden',
        background: '#F9F6F0',
        userSelect: 'none',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── 3D Canvas Viewport ── */}
      <div
        ref={containerRef}
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: isDraggingOverCanvas ? 'copy' : 'grab',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* ── Top Floating Minimalist Bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        {/* Left: Studio Identity & Back */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            padding: '7px 16px',
            borderRadius: 999,
            border: '1px solid rgba(208, 174, 146, 0.45)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            onClick={() => navigate('/portal/catalogue')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--brown-700)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              padding: 0,
            }}
          >
            <ArrowLeft size={14} />
            Catalogue
          </button>
          <span style={{ color: 'var(--brown-300)' }}>|</span>
          <span
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--brown-900)',
            }}
          >
            Japandi Room Studio
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--posted)',
              backgroundColor: 'var(--posted-bg)',
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {placedItems.length} {placedItems.length === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>

        {/* Center: Camera View Perspectives (Walk-In, Dollhouse, Top Down) */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            padding: 4,
            borderRadius: 999,
            border: '1px solid rgba(208, 174, 146, 0.45)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            onClick={() => handleSetCameraView('walkin')}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: 'none',
              fontSize: 12,
              fontWeight: cameraView === 'walkin' ? 700 : 500,
              fontFamily: 'var(--font-display)',
              backgroundColor: cameraView === 'walkin' ? 'var(--brown-900)' : 'transparent',
              color: cameraView === 'walkin' ? 'var(--cream)' : 'var(--brown-800)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Eye size={13} />
            Walk In
          </button>

          <button
            onClick={() => handleSetCameraView('overview')}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: 'none',
              fontSize: 12,
              fontWeight: cameraView === 'overview' ? 700 : 500,
              fontFamily: 'var(--font-display)',
              backgroundColor: cameraView === 'overview' ? 'var(--brown-900)' : 'transparent',
              color: cameraView === 'overview' ? 'var(--cream)' : 'var(--brown-800)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Compass size={13} />
            Dollhouse
          </button>

          <button
            onClick={() => handleSetCameraView('topdown')}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: 'none',
              fontSize: 12,
              fontWeight: cameraView === 'topdown' ? 700 : 500,
              fontFamily: 'var(--font-display)',
              backgroundColor: cameraView === 'topdown' ? 'var(--brown-900)' : 'transparent',
              color: cameraView === 'topdown' ? 'var(--cream)' : 'var(--brown-800)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Grid size={13} />
            Top Plan
          </button>
        </div>

        {/* Right: Lighting & Presets */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Preset Layouts */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'presets' ? null : 'presets')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid rgba(208, 174, 146, 0.45)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <Layers size={14} color="var(--brown-700)" />
              Room Styles
              <ChevronDown size={13} />
            </button>

            {activeMenu === 'presets' && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 210,
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--brown-300)',
                  boxShadow: 'var(--shadow-md)',
                  padding: 6,
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <button onClick={() => handleLoadPreset('lounge')} style={styles.menuItem}>
                  <span style={{ fontWeight: 600 }}>Minimalist Lounge</span>
                  <span style={{ fontSize: 10, color: 'var(--brown-700)' }}>Couch, Table, Armchair</span>
                </button>
                <button onClick={() => handleLoadPreset('study')} style={styles.menuItem}>
                  <span style={{ fontWeight: 600 }}>Executive Study</span>
                  <span style={{ fontSize: 10, color: 'var(--brown-700)' }}>Desk, Swivel Chair, Bookshelf</span>
                </button>
                <button onClick={() => handleLoadPreset('bedroom')} style={styles.menuItem}>
                  <span style={{ fontWeight: 600 }}>Zen Bedroom Suite</span>
                  <span style={{ fontSize: 10, color: 'var(--brown-700)' }}>Double Bed, Nightstand, Drawer</span>
                </button>
                <div style={{ height: 1, backgroundColor: 'var(--brown-100)', margin: '2px 0' }} />
                <button onClick={() => handleLoadPreset('blank')} style={{ ...styles.menuItem, color: 'var(--danger)' }}>
                  <span style={{ fontWeight: 600 }}>Clear All (Blank Room)</span>
                </button>
              </div>
            )}
          </div>

          {/* Ambience & Lighting */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'lighting' ? null : 'lighting')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid rgba(208, 174, 146, 0.45)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <Lightbulb size={14} color="var(--brown-700)" />
              Lighting
              <ChevronDown size={13} />
            </button>

            {activeMenu === 'lighting' && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 230,
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--brown-300)',
                  boxShadow: 'var(--shadow-md)',
                  padding: 12,
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Natural Sunlight
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    <button
                      onClick={() => setAmbience('morning')}
                      style={{
                        ...styles.presetPill,
                        backgroundColor: ambience === 'morning' ? 'var(--brown-900)' : 'var(--brown-100)',
                        color: ambience === 'morning' ? 'var(--cream)' : 'var(--brown-900)',
                      }}
                    >
                      Morning
                    </button>
                    <button
                      onClick={() => setAmbience('studio')}
                      style={{
                        ...styles.presetPill,
                        backgroundColor: ambience === 'studio' ? 'var(--brown-900)' : 'var(--brown-100)',
                        color: ambience === 'studio' ? 'var(--cream)' : 'var(--brown-900)',
                      }}
                    >
                      Studio
                    </button>
                    <button
                      onClick={() => setAmbience('dusk')}
                      style={{
                        ...styles.presetPill,
                        backgroundColor: ambience === 'dusk' ? 'var(--brown-900)' : 'var(--brown-100)',
                        color: ambience === 'dusk' ? 'var(--cream)' : 'var(--brown-900)',
                      }}
                    >
                      Dusk
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: 'var(--brown-100)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown-900)', cursor: 'pointer' }}>
                    <span>Ceiling Pendant Lights</span>
                    <input
                      type="checkbox"
                      checked={ceilingLightOn}
                      onChange={(e) => setCeilingLightOn(e.target.checked)}
                      style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown-900)', cursor: 'pointer' }}>
                    <span>Floor Lamp</span>
                    <input
                      type="checkbox"
                      checked={standingLampOn}
                      onChange={(e) => setStandingLampOn(e.target.checked)}
                      style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Selected Item Inspector HUD (Clean floating pill) ── */}
      {selectedItem && (
        <div
          style={{
            position: 'absolute',
            bottom: isDockOpen ? 180 : 32,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            borderRadius: 999,
            border: '1px solid rgba(208, 174, 146, 0.6)',
            boxShadow: '0 8px 24px rgba(74, 58, 52, 0.15)',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            zIndex: 30,
            transition: 'bottom 200ms ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-900)', fontFamily: 'var(--font-display)' }}>
              {selectedItem.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--brown-600)' }}>• Drag floor to glide</span>
          </div>

          <div style={{ height: 20, width: 1, backgroundColor: 'rgba(208, 174, 146, 0.5)' }} />

          {/* Rotation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => handleRotateSelected(-Math.PI / 4)}
              title="Rotate Left 45° (R)"
              style={styles.hudActionBtn}
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => handleRotateSelected(Math.PI / 4)}
              title="Rotate Right 45° (R)"
              style={styles.hudActionBtn}
            >
              <RotateCw size={13} />
            </button>
          </div>

          <div style={{ height: 20, width: 1, backgroundColor: 'rgba(208, 174, 146, 0.5)' }} />

          {/* Delete piece from room */}
          <button
            onClick={handleRemoveSelected}
            title="Remove from room (Backspace)"
            style={{
              ...styles.hudActionBtn,
              color: 'var(--danger)',
              backgroundColor: 'var(--danger-bg)',
            }}
          >
            <Trash2 size={13} />
          </button>

          {/* Deselect */}
          <button
            onClick={() => setSelectedInstanceId(null)}
            title="Deselect"
            style={{ ...styles.hudActionBtn, color: 'var(--brown-600)' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Bottom Furniture Dock (Clean Japandi, No Ugly Scrollbars) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: 20,
          border: '1px solid rgba(208, 174, 146, 0.5)',
          boxShadow: '0 8px 32px rgba(74, 58, 52, 0.10)',
          overflow: 'hidden',
          transition: 'all 200ms ease-out',
          zIndex: 25,
        }}
      >
        {/* Dock Header & Filter Pills */}
        <div
          style={{
            padding: '8px 18px',
            borderBottom: isDockOpen ? '1px solid rgba(208, 174, 146, 0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brown-900)', fontFamily: 'var(--font-display)' }}>
              Add Furniture:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: selectedCategory === cat ? 700 : 500,
                    fontFamily: 'var(--font-display)',
                    color: selectedCategory === cat ? 'var(--cream)' : 'var(--brown-700)',
                    backgroundColor: selectedCategory === cat ? 'var(--brown-900)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--brown-900)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsDockOpen(!isDockOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--brown-700)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {isDockOpen ? 'Collapse' : 'Expand Furniture'}
            {isDockOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Dock Items Carousel (Clean Horizontal Slider, Zero Scrollbar Clutter) */}
        {isDockOpen && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 18px',
              overflowX: 'auto',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
            }}
          >
            {filteredModels.map((model) => (
              <div
                key={model.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', model.id);
                  e.dataTransfer.setData('modelId', model.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => handleAddFurniture(model)}
                style={{
                  flex: '0 0 170px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid rgba(208, 174, 146, 0.4)',
                  borderRadius: 14,
                  padding: '10px 12px',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--brown-900)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(208, 174, 146, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--brown-600)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {model.category}
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--brown-900)',
                      fontFamily: 'var(--font-display)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                    }}
                    title={model.name}
                  >
                    {model.name}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--brown-500)', fontFamily: 'var(--font-mono)' }}>
                    {model.sizeKB} KB
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--brown-900)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Plus size={12} /> Add
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtle Loading indicator */}
      {loadingModel && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            right: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--brown-900)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: 'var(--warning)',
            }}
          />
          Placing piece in room...
        </div>
      )}
    </div>
  );
};

const styles = {
  menuItem: {
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left' as const,
    cursor: 'pointer',
    color: 'var(--brown-900)',
    fontSize: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    transition: 'background 120ms ease',
  },
  presetPill: {
    padding: '5px 8px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    transition: 'all 120ms ease',
  },
  hudActionBtn: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: '1px solid rgba(208, 174, 146, 0.5)',
    backgroundColor: 'var(--cream)',
    color: 'var(--brown-900)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  },
};

export default PortalRoomStudioPage;
