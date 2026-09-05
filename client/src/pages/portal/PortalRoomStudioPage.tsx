import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Trash2,
  Plus,
  Sun,
  Moon,
  Sparkles,
  Award,
  Lightbulb,
  Maximize2,
  Grid,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Move,
  Info,
} from 'lucide-react';
import api from '../../lib/axios';

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

  // Mesh reference map for placed objects: instanceId -> THREE.Group
  const placedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionRingRef = useRef<THREE.Mesh | null>(null);

  // Lighting & Wall mount Three.js objects
  const ceilingLightGroupRef = useRef<THREE.Group | null>(null);
  const standingLampGroupRef = useRef<THREE.Group | null>(null);
  const ceilingSpotRef = useRef<THREE.PointLight | null>(null);
  const lampLightRef = useRef<THREE.PointLight | null>(null);
  const sunlightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const wallCertificateMeshRef = useRef<THREE.Group | null>(null);
  const wallArtworkMeshRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Data states
  const [catalogModels, setCatalogModels] = useState<ShowroomModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [placedItems, setPlacedItems] = useState<PlacedFurniture[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Room Studio Settings
  const [ambience, setAmbience] = useState<AmbienceMode>('morning');
  const [ceilingLightOn, setCeilingLightOn] = useState<boolean>(true);
  const [standingLampOn, setStandingLampOn] = useState<boolean>(true);
  const [wallCertificateOn, setWallCertificateOn] = useState<boolean>(true);
  const [wallArtworkOn, setWallArtworkOn] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isDockOpen, setIsDockOpen] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<'presets' | 'lighting' | 'wall' | null>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);

  // 1. Fetch available models from API
  useEffect(() => {
    api.get('/api/portal/models')
      .then(res => {
        if (res.data?.data) {
          setCatalogModels(res.data.data);
        }
      })
      .catch(err => console.error('Failed to load models:', err));
  }, []);

  // 2. Initialise Three.js Studio Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    let animationFrameId: number;

    // Renderer
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
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF9F2E4); // Warm cream ground
    sceneRef.current = scene;

    // Camera — positioned for spacious architectural view
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(5.8, 4.4, 6.2);
    cameraRef.current = camera;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Stay above floor
    controls.minDistance = 2.0;
    controls.maxDistance = 14.0;
    controls.target.set(0, 0.8, 0);
    controlsRef.current = controls;

    // ── Architectural Room Geometry ──
    const roomWidth = 9.0;
    const roomDepth = 9.0;
    const roomHeight = 4.8;

    // 1. Floor: Natural Light Oak (#D4A96A)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xD4A96A,
      roughness: 0.65,
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle placement grid on the floor
    const grid = new THREE.GridHelper(roomWidth, 18, 0x4A3A34, 0xD0AE92);
    grid.position.y = 0.005;
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);
    gridHelperRef.current = grid;

    // 2. Walls: Off-white warm plaster (#F5F0E8)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF5F0E8,
      roughness: 0.92,
      metalness: 0.01,
    });

    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Wall with Architectural Window Cutout Effect
    const leftWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Dark Oak Baseboards / Wainscoting Trim (#4A3A34)
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4A3A34, roughness: 0.5 });
    const backTrim = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.12, 0.06), trimMat);
    backTrim.position.set(0, 0.06, -roomDepth / 2 + 0.03);
    scene.add(backTrim);

    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, roomDepth), trimMat);
    leftTrim.position.set(-roomWidth / 2 + 0.03, 0.06, 0);
    scene.add(leftTrim);

    // Architectural Window Frame on Left Wall
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x4A3A34, roughness: 0.4 });
    const windowOuter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 3.2), windowFrameMat);
    windowOuter.position.set(-roomWidth / 2 + 0.05, 2.5, 0);
    scene.add(windowOuter);

    const windowGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xE8F2F8,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      transmission: 0.8,
    });
    const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.0, 3.0), windowGlassMat);
    windowGlass.position.set(-roomWidth / 2 + 0.05, 2.5, 0);
    scene.add(windowGlass);

    // ── Load Architectural Room Structure Model (/models/room_blank.glb) ──
    const roomLoader = new GLTFLoader();
    roomLoader.load(
      '/models/room_blank.glb',
      (gltf) => {
        const roomRoot = gltf.scene;

        roomRoot.traverse((child) => {
          const lowerName = child.name.toLowerCase();
          // Hide roof meshes so top-down and orbit camera view inside unobstructed
          if (lowerName.includes('roof') || lowerName.includes('ceiling')) {
            child.visible = false;
          } else if ((child as THREE.Mesh).isMesh) {
            child.receiveShadow = true;
            child.castShadow = true;
          }
        });

        // Compute Bounding Box & Center grounded at y = 0
        const box = new THREE.Box3().setFromObject(roomRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Scale room to fit 9x9 footprint
        const maxDim = Math.max(size.x, size.z);
        const targetDim = 9.0;
        const scale = maxDim > 0 ? targetDim / maxDim : 1;
        roomRoot.scale.set(scale, scale, scale);

        // Ground object on floor
        box.setFromObject(roomRoot);
        box.getCenter(center);
        roomRoot.position.x = -center.x;
        roomRoot.position.y = -box.min.y;
        roomRoot.position.z = -center.z;

        scene.add(roomRoot);
      },
      undefined,
      (err) => {
        console.warn('Room structure model fallback to procedural walls:', err);
      }
    );

    // ── Wall Accents ──
    // 1. Framed Craftsmanship & Quality Certificate on Back Wall
    const certGroup = new THREE.Group();
    // Oak frame
    const certFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.95, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x4A3A34, roughness: 0.4 })
    );
    // Cream certificate paper with gold border accent
    const certPaper = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.83, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xFFFDF8, roughness: 0.7 })
    );
    certPaper.position.z = 0.01;
    // Seal emblem
    const certSeal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0xC08A3E, metalness: 0.6, roughness: 0.3 })
    );
    certSeal.rotation.x = Math.PI / 2;
    certSeal.position.set(0.38, -0.22, 0.03);

    certGroup.add(certFrame, certPaper, certSeal);
    certGroup.position.set(1.5, 2.6, -roomDepth / 2 + 0.03);
    scene.add(certGroup);
    wallCertificateMeshRef.current = certGroup;

    // 2. Minimalist Architectural Art Frame on Back Wall
    const artGroup = new THREE.Group();
    const artFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x77574A, roughness: 0.5 })
    );
    const artCanvas = new THREE.Mesh(
      new THREE.BoxGeometry(1.26, 1.66, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xECE5D8, roughness: 0.9 })
    );
    artCanvas.position.z = 0.01;
    artGroup.add(artFrame, artCanvas);
    artGroup.position.set(-1.8, 2.6, -roomDepth / 2 + 0.03);
    scene.add(artGroup);
    wallArtworkMeshRef.current = artGroup;

    // ── Showroom Lighting Setup ──
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Directional Sunlight streaming from window (top-left)
    const sunlight = new THREE.DirectionalLight(0xfff3e0, 1.1);
    sunlight.position.set(-8, 7, 3);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 1024;
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.bias = -0.0008;
    sunlight.shadow.camera.near = 1;
    sunlight.shadow.camera.far = 25;
    sunlight.shadow.camera.left = -6;
    sunlight.shadow.camera.right = 6;
    sunlight.shadow.camera.top = 6;
    sunlight.shadow.camera.bottom = -6;
    scene.add(sunlight);
    sunlightRef.current = sunlight;

    // Ceiling Point/Spot Light
    const ceilingSpot = new THREE.PointLight(0xffecd0, 1.0, 10, 1.5);
    ceilingSpot.position.set(0, 3.8, 0);
    ceilingSpot.castShadow = true;
    scene.add(ceilingSpot);
    ceilingSpotRef.current = ceilingSpot;

    // Standing Lamp Point Light
    const lampLight = new THREE.PointLight(0xffe2b8, 0.85, 6, 2.0);
    lampLight.position.set(-3.2, 1.6, -3.2);
    lampLight.castShadow = true;
    scene.add(lampLight);
    lampLightRef.current = lampLight;

    // Selection Indicator Ring (drawn on floor below selected item)
    const ringGeo = new THREE.RingGeometry(0.7, 0.78, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4A3A34,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.008;
    scene.add(selectionRing);
    selectionRingRef.current = selectionRing;

    // Load 3D Models for Ceiling Light and Standing Lamp
    const loader = new GLTFLoader();

    // 1. Ceiling Light Model
    loader.load('/models/Ceiling Light by Quaternius - sRNcgQFbLB.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.2, 1.2, 1.2);
      model.position.set(0, 4.4, 0);
      scene.add(model);
      ceilingLightGroupRef.current = model;
    });

    // 2. Standing Floor Lamp Model
    loader.load('/models/Standing lamp by jeremy - 7AqWZQIaCQf.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.1, 1.1, 1.1);
      model.position.set(-3.2, 0, -3.2);
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });
      scene.add(model);
      standingLampGroupRef.current = model;
    });

    // ── Raycasting for 3D Click Selection ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check intersection against all placed meshes
      const placedMeshes: THREE.Object3D[] = [];
      placedMeshesRef.current.forEach(group => {
        placedMeshes.push(...group.children);
      });

      const intersects = raycaster.intersectObjects(placedMeshes, true);
      if (intersects.length > 0) {
        // Find which instance root object was clicked
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent && obj.parent !== scene) {
          // Check if parent matches any instanceId in map
          for (const [id, group] of placedMeshesRef.current.entries()) {
            if (obj === group || obj.parent === group) {
              setSelectedInstanceId(id);
              return;
            }
          }
          obj = obj.parent;
        }
      } else {
        // Deselect if clicked outside on the floor
        setSelectedInstanceId(null);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window Resize handler
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
      canvas.removeEventListener('click', handleCanvasClick);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // 3. Handle Lighting Toggles & Ambience Presets
  useEffect(() => {
    if (!sunlightRef.current || !ambientLightRef.current || !ceilingSpotRef.current || !lampLightRef.current) return;

    if (ambience === 'morning') {
      sunlightRef.current.intensity = 1.25;
      sunlightRef.current.color.setHex(0xFFF4E5);
      ambientLightRef.current.intensity = 0.65;
      ambientLightRef.current.color.setHex(0xFFFFFF);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0xF9F2E4);
    } else if (ambience === 'studio') {
      sunlightRef.current.intensity = 0.8;
      sunlightRef.current.color.setHex(0xFFFFFF);
      ambientLightRef.current.intensity = 0.85;
      ambientLightRef.current.color.setHex(0xFFF9F0);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0xF5EFE3);
    } else if (ambience === 'dusk') {
      sunlightRef.current.intensity = 0.35;
      sunlightRef.current.color.setHex(0xFFA07A);
      ambientLightRef.current.intensity = 0.4;
      ambientLightRef.current.color.setHex(0xDECEBE);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0xE8DFD0);
    }

    // Ceiling Light toggle
    ceilingSpotRef.current.intensity = ceilingLightOn ? (ambience === 'dusk' ? 1.4 : 1.0) : 0;
    if (ceilingLightGroupRef.current) {
      ceilingLightGroupRef.current.visible = ceilingLightOn;
    }

    // Standing Lamp toggle
    lampLightRef.current.intensity = standingLampOn ? (ambience === 'dusk' ? 1.2 : 0.8) : 0;
    if (standingLampGroupRef.current) {
      standingLampGroupRef.current.visible = standingLampOn;
    }

    // Wall Mounts toggle
    if (wallCertificateMeshRef.current) {
      wallCertificateMeshRef.current.visible = wallCertificateOn;
    }
    if (wallArtworkMeshRef.current) {
      wallArtworkMeshRef.current.visible = wallArtworkOn;
    }

    // Grid toggle
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [ambience, ceilingLightOn, standingLampOn, wallCertificateOn, wallArtworkOn, showGrid]);

  // 4. Update Selection Indicator Ring in 3D scene
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

  // 5. Add Furniture Model to Scene
  const handleAddFurniture = useCallback((model: ShowroomModel, customPos?: [number, number, number]) => {
    if (!sceneRef.current) return;
    setLoadingModel(true);

    const instanceId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const loader = new GLTFLoader();

    // Stagger positions if multiple items added
    const pos: [number, number, number] = customPos || [
      (Math.random() - 0.5) * 3.0,
      0,
      (Math.random() - 0.5) * 3.0,
    ];

    loader.load(
      model.url,
      (gltf) => {
        const root = gltf.scene;

        // Enable shadows
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Compute Bounding Box & Scale to realistic interior dimensions
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetDim = model.category === 'Beds' ? 2.4 : (model.category === 'Seating' && model.name.includes('Large') ? 2.3 : 1.6);
        const scale = maxDim > 0 ? (targetDim / maxDim) * model.defaultScale : 1;
        root.scale.set(scale, scale, scale);

        // Ground object on floor
        box.setFromObject(root);
        box.getCenter(center);

        root.position.set(pos[0], -box.min.y, pos[2]);

        sceneRef.current?.add(root);
        placedMeshesRef.current.set(instanceId, root);

        const newItem: PlacedFurniture = {
          instanceId,
          modelId: model.id,
          name: model.name,
          category: model.category,
          url: model.url,
          position: pos,
          rotationY: 0,
          scale,
        };

        setPlacedItems((prev) => [...prev, newItem]);
        setSelectedInstanceId(instanceId);
        setLoadingModel(false);
      },
      undefined,
      (err) => {
        console.error('Error loading model in studio:', err);
        setLoadingModel(false);
      }
    );
  }, []);

  // 6. Preload model if URL specified in query params or load default room layout
  useEffect(() => {
    if (catalogModels.length === 0) return;

    if (preloadedModelUrl) {
      const match = catalogModels.find(m => m.url === preloadedModelUrl || m.filename === preloadedModelUrl);
      if (match) {
        handleAddFurniture(match, [0, 0, 0]);
        return;
      }
    }

    // Default warm Japandi room layout
    if (placedItems.length === 0) {
      const couch = catalogModels.find(m => m.filename.includes('Couch Large') || m.filename.includes('Couch'));
      const table = catalogModels.find(m => m.filename.includes('Table Round Small') || m.filename.includes('Table'));
      const chair = catalogModels.find(m => m.filename.includes('Poly') || m.filename.includes('Chair'));

      if (couch) handleAddFurniture(couch, [0, 0, -1.2]);
      if (table) handleAddFurniture(table, [0, 0, 0.5]);
      if (chair) handleAddFurniture(chair, [1.8, 0, 0.4]);
    }
  }, [catalogModels, preloadedModelUrl]);

  // 7. Move Selected Item
  const handleMoveSelected = (dx: number, dz: number) => {
    if (!selectedInstanceId) return;
    const mesh = placedMeshesRef.current.get(selectedInstanceId);
    if (!mesh) return;

    // Bounds limit within room (-3.6 to 3.6)
    const newX = Math.max(-3.6, Math.min(3.6, mesh.position.x + dx));
    const newZ = Math.max(-3.6, Math.min(3.6, mesh.position.z + dz));

    mesh.position.x = newX;
    mesh.position.z = newZ;

    setPlacedItems(prev =>
      prev.map(item =>
        item.instanceId === selectedInstanceId
          ? { ...item, position: [newX, item.position[1], newZ] }
          : item
      )
    );
  };

  // 8. Rotate Selected Item
  const handleRotateSelected = (deltaAngle: number) => {
    if (!selectedInstanceId) return;
    const mesh = placedMeshesRef.current.get(selectedInstanceId);
    if (!mesh) return;

    mesh.rotation.y += deltaAngle;
    setPlacedItems(prev =>
      prev.map(item =>
        item.instanceId === selectedInstanceId
          ? { ...item, rotationY: mesh.rotation.y }
          : item
      )
    );
  };

  // 9. Remove Selected Item
  const handleRemoveSelected = () => {
    if (!selectedInstanceId || !sceneRef.current) return;
    const mesh = placedMeshesRef.current.get(selectedInstanceId);
    if (mesh) {
      sceneRef.current.remove(mesh);
      placedMeshesRef.current.delete(selectedInstanceId);
    }
    setPlacedItems(prev => prev.filter(item => item.instanceId !== selectedInstanceId));
    setSelectedInstanceId(null);
  };

  // 10. Load Preset Spaces
  const handleLoadPreset = (preset: 'lounge' | 'study' | 'bedroom' | 'blank') => {
    // Clear existing
    placedMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh);
    });
    placedMeshesRef.current.clear();
    setPlacedItems([]);
    setSelectedInstanceId(null);
    setActiveMenu(null);

    if (preset === 'blank') return;

    if (preset === 'lounge') {
      const couch = catalogModels.find(m => m.filename.includes('Couch Large'));
      const table = catalogModels.find(m => m.filename.includes('Table Round Small'));
      const chair = catalogModels.find(m => m.filename.includes('Poly') || m.filename.includes('Chair'));
      if (couch) handleAddFurniture(couch, [0, 0, -1.2]);
      if (table) handleAddFurniture(table, [0, 0, 0.6]);
      if (chair) handleAddFurniture(chair, [1.8, 0, 0.4]);
      setAmbience('morning');
    } else if (preset === 'study') {
      const desk = catalogModels.find(m => m.filename.includes('Desk by dook') || m.filename.includes('Desk'));
      const chair = catalogModels.find(m => m.filename.includes('Office Chair by Quaternius') || m.filename.includes('Office'));
      const shelf = catalogModels.find(m => m.filename.includes('Bookcase with Books') || m.filename.includes('Book'));
      if (desk) handleAddFurniture(desk, [0, 0, -0.6]);
      if (chair) handleAddFurniture(chair, [0, 0, 0.8]);
      if (shelf) handleAddFurniture(shelf, [-2.6, 0, -1.8]);
      setAmbience('studio');
    } else if (preset === 'bedroom') {
      const bed = catalogModels.find(m => m.filename.includes('Bed Double by Quaternius') || m.filename.includes('Bed Double'));
      const stand = catalogModels.find(m => m.filename.includes('Night Stand'));
      const drawer = catalogModels.find(m => m.filename.includes('Drawer'));
      if (bed) handleAddFurniture(bed, [0, 0, -1.0]);
      if (stand) handleAddFurniture(stand, [-1.8, 0, -1.0]);
      if (drawer) handleAddFurniture(drawer, [2.4, 0, 0.8]);
      setAmbience('dusk');
    }
  };

  const selectedItem = placedItems.find(item => item.instanceId === selectedInstanceId);
  const categories = ['All', 'Seating', 'Beds', 'Tables', 'Storage'];
  const filteredModels = selectedCategory === 'All'
    ? catalogModels.filter(m => m.category !== 'Lighting')
    : catalogModels.filter(m => m.category === selectedCategory);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 104px)',
        overflow: 'hidden',
        background: 'var(--cream)',
        userSelect: 'none',
      }}
    >
      {/* ── 3D Canvas Viewport ── */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* ── Top Floating Minimalist Architectural Bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 24,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Studio Identity & Back */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(10px)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(208, 174, 146, 0.5)',
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
              gap: 5,
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
              letterSpacing: '-0.01em',
            }}
          >
            Japandi Studio Planner
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--posted)',
              backgroundColor: 'var(--posted-bg)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
            }}
          >
            {placedItems.length} {placedItems.length === 1 ? 'Piece' : 'Pieces'} Placed
          </span>
        </div>

        {/* Right: Floating Control Pills */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Preset Layouts Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'presets' ? null : 'presets')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(10px)',
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(208, 174, 146, 0.5)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <Layers size={14} color="var(--brown-700)" />
              Spaces & Presets
              <ChevronDown size={13} />
            </button>

            {activeMenu === 'presets' && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 220,
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
                <button
                  onClick={() => handleLoadPreset('lounge')}
                  style={styles.menuItem}
                >
                  <span style={{ fontWeight: 600 }}>Minimalist Lounge</span>
                  <span style={{ fontSize: 10, color: 'var(--brown-700)' }}>Sofa, Table, Armchair</span>
                </button>
                <button
                  onClick={() => handleLoadPreset('study')}
                  style={styles.menuItem}
                >
                  <span style={{ fontWeight: 600 }}>Executive Study</span>
                  <span style={{ fontSize: 10, color: 'var(--brown-700)' }}>Work Desk, Swivel Chair, Bookshelf</span>
                </button>
                <button
                  onClick={() => handleLoadPreset('bedroom')}
                  style={styles.menuItem}
                >
                  <span style={{ fontWeight: 600 }}>Zen Bedroom Suite</span>
                  <span style={{ fontSize: 10, color: 'var(--brown-700)' }}>Double Bed, Nightstand, Drawer</span>
                </button>
                <div style={{ height: 1, backgroundColor: 'var(--brown-100)', margin: '2px 0' }} />
                <button
                  onClick={() => handleLoadPreset('blank')}
                  style={{ ...styles.menuItem, color: 'var(--danger)' }}
                >
                  <span style={{ fontWeight: 600 }}>Clear All (Blank Pad)</span>
                </button>
              </div>
            )}
          </div>

          {/* Lighting & Ambience Toggle Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'lighting' ? null : 'lighting')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(10px)',
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(208, 174, 146, 0.5)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <Lightbulb size={14} color="var(--brown-700)" />
              Lighting & Ambience
              <ChevronDown size={13} />
            </button>

            {activeMenu === 'lighting' && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 240,
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
                    Showroom Ambience
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
                    <span>Ceiling Pendant Light</span>
                    <input
                      type="checkbox"
                      checked={ceilingLightOn}
                      onChange={e => setCeilingLightOn(e.target.checked)}
                      style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown-900)', cursor: 'pointer' }}>
                    <span>Standing Corner Lamp</span>
                    <input
                      type="checkbox"
                      checked={standingLampOn}
                      onChange={e => setStandingLampOn(e.target.checked)}
                      style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Wall Mounts (Certificate / Art) Toggle Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'wall' ? null : 'wall')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(10px)',
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(208, 174, 146, 0.5)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <Award size={14} color="var(--brown-700)" />
              Wall Accents
              <ChevronDown size={13} />
            </button>

            {activeMenu === 'wall' && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 220,
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--brown-300)',
                  boxShadow: 'var(--shadow-md)',
                  padding: 12,
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Wall Mounts
                </div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown-900)', cursor: 'pointer' }}>
                  <span>Craftsmanship Certificate</span>
                  <input
                    type="checkbox"
                    checked={wallCertificateOn}
                    onChange={e => setWallCertificateOn(e.target.checked)}
                    style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown-900)', cursor: 'pointer' }}>
                  <span>Framed Architectural Art</span>
                  <input
                    type="checkbox"
                    checked={wallArtworkOn}
                    onChange={e => setWallArtworkOn(e.target.checked)}
                    style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Grid Helper Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              backgroundColor: showGrid ? 'var(--brown-900)' : 'rgba(255, 255, 255, 0.88)',
              color: showGrid ? 'var(--cream)' : 'var(--brown-900)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(208, 174, 146, 0.5)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
          >
            <Grid size={15} />
          </button>
        </div>
      </div>

      {/* ── Selected Item Inspector HUD (Floating Center-Bottom when item is clicked) ── */}
      {selectedItem && (
        <div
          style={{
            position: 'absolute',
            bottom: isDockOpen ? 180 : 28,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--brown-300)',
            boxShadow: 'var(--shadow-lg)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 30,
            transition: 'bottom 200ms ease-out',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Piece
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brown-900)', fontFamily: 'var(--font-display)' }}>
              {selectedItem.name}
            </div>
          </div>

          <div style={{ height: 28, width: 1, backgroundColor: 'var(--brown-300)', opacity: 0.5 }} />

          {/* Position Nudging */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--brown-700)', marginRight: 4 }}>Move:</span>
            <button
              onClick={() => handleMoveSelected(-0.4, 0)}
              title="Move Left"
              style={styles.hudActionBtn}
            >
              ←
            </button>
            <button
              onClick={() => handleMoveSelected(0, -0.4)}
              title="Move Back"
              style={styles.hudActionBtn}
            >
              ↑
            </button>
            <button
              onClick={() => handleMoveSelected(0, 0.4)}
              title="Move Forward"
              style={styles.hudActionBtn}
            >
              ↓
            </button>
            <button
              onClick={() => handleMoveSelected(0.4, 0)}
              title="Move Right"
              style={styles.hudActionBtn}
            >
              →
            </button>
          </div>

          <div style={{ height: 28, width: 1, backgroundColor: 'var(--brown-300)', opacity: 0.5 }} />

          {/* Rotation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => handleRotateSelected(-Math.PI / 4)}
              title="Rotate 45° Counter-Clockwise"
              style={styles.hudActionBtn}
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => handleRotateSelected(Math.PI / 4)}
              title="Rotate 45° Clockwise"
              style={styles.hudActionBtn}
            >
              <RotateCw size={13} />
            </button>
          </div>

          <div style={{ height: 28, width: 1, backgroundColor: 'var(--brown-300)', opacity: 0.5 }} />

          {/* Delete piece from room */}
          <button
            onClick={handleRemoveSelected}
            title="Remove from room"
            style={{
              ...styles.hudActionBtn,
              color: 'var(--danger)',
              backgroundColor: 'var(--danger-bg)',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* ── Bottom Floating Furniture Dock ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(14px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(208, 174, 146, 0.6)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          transition: 'all 200ms ease-out',
          zIndex: 25,
        }}
      >
        {/* Dock Header & Category Pills */}
        <div
          style={{
            padding: '8px 16px',
            borderBottom: isDockOpen ? '1px solid rgba(208, 174, 146, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brown-900)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
              Add Furniture:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  fontFamily: 'var(--font-body)',
                  color: selectedCategory === cat ? 'var(--cream)' : 'var(--brown-700)',
                  backgroundColor: selectedCategory === cat ? 'var(--brown-900)' : 'transparent',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--brown-900)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 120ms ease-out',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
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
            {isDockOpen ? 'Collapse Dock' : 'Expand Dock'}
            {isDockOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Dock Items Carousel / Grid */}
        {isDockOpen && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 16px',
              overflowX: 'auto',
              maxHeight: 120,
            }}
          >
            {filteredModels.map(model => (
              <div
                key={model.id}
                onClick={() => handleAddFurniture(model)}
                style={{
                  flex: '0 0 160px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--brown-300)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 120ms ease, border-color 120ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--brown-900)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--brown-300)';
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--brown-700)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
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
                    }}
                    title={model.name}
                  >
                    {model.name}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--brown-500)', fontFamily: 'var(--font-mono)' }}>
                    {model.sizeKB} KB
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--posted)',
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

      {/* Loading overlay */}
      {loadingModel && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            right: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--brown-900)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--warning)',
              animation: 'pulse 1s infinite',
            }}
          />
          Placing model in room...
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
    width: 28,
    height: 28,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--brown-300)',
    backgroundColor: 'var(--brown-100)',
    color: 'var(--brown-900)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 120ms ease',
  },
};
