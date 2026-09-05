import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ArrowLeft, Box, RotateCcw, AlertCircle, FileText, CheckCircle, Clock, LogIn } from 'lucide-react';
import { formatINR } from '../../lib/money';
import api from '../../lib/axios';

interface InvoiceLineItem {
  id: number;
  number: string;
  invoiceDate: string;
  status: string;
  qty: string;
  unitPrice: string;
  lineTotal: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
}

interface ProductDetail {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  sales_price: string;
  mrp: string | null;
  tax_rate: string;
  stock_qty: string;
  model_url: string | null;
  image_url: string | null;
}

export const PortalProductViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [invoices, setInvoices] = useState<InvoiceLineItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3D Canvas states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Check current auth status
        let isAuthed = false;
        try {
          const meRes = await api.get('/api/portal/me');
          isAuthed = Boolean(meRes.data?.data?.user);
        } catch {
          isAuthed = false;
        }
        if (isMounted) setIsAuthenticated(isAuthed);

        // 2. Fetch catalogue item detail
        if (isAuthed) {
          // Fetch authenticated scoped endpoint
          const res = await api.get(`/api/portal/catalogue/${id}`);
          if (res.data?.data) {
            if (isMounted) {
              setProduct(res.data.data.product || res.data.data);
              setInvoices(res.data.data.invoices || []);
            }
          }
        } else {
          // Public visitor fallback: fetch from public catalogue
          const res = await api.get('/api/portal/catalogue');
          if (res.data?.data) {
            const found = res.data.data.find((p: ProductDetail) => String(p.id) === String(id));
            if (found) {
              if (isMounted) setProduct(found);
            } else {
              throw new Error('Product not found');
            }
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load product');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Three.js Room Scene Initialisation
  useEffect(() => {
    if (!product?.model_url || !canvasRef.current || !containerRef.current) {
      setModelLoading(false);
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    let animationFrameId: number;

    setModelLoading(true);
    setModelError(null);

    // Renderer setup
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

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF9F2E4); // Matches --cream

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(3.2, 2.6, 4.0);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep camera above floor
    controls.minDistance = 1.2;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0.8, 0);

    // ── Room Geometry ──
    // 1. Floor plane (8x8) - Light wood texture color #D4A96A
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xD4A96A,
      roughness: 0.75,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle floor trim / baseboards
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4A3A34, roughness: 0.6 });
    const trimGeo = new THREE.BoxGeometry(8, 0.1, 0.05);
    const backTrim = new THREE.Mesh(trimGeo, trimMat);
    backTrim.position.set(0, 0.05, -3.98);
    scene.add(backTrim);

    const sideTrim = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 8), trimMat);
    sideTrim.position.set(-3.98, 0.05, 0);
    scene.add(sideTrim);

    // 2. Back Wall (8x5) - Off-white #F5F0E8
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF5F0E8,
      roughness: 0.9,
    });
    const backWallGeo = new THREE.PlaneGeometry(8, 5);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 2.5, -4);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 3. Left Wall (8x5) - Off-white #F5F0E8
    const leftWallGeo = new THREE.PlaneGeometry(8, 5);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-4, 2.5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // ── Lighting ──
    // Ambient Light (intensity 0.6)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional Light from top-right (intensity 0.8, position 5, 8, 5)
    const dirLight = new THREE.DirectionalLight(0xfff8ee, 0.8);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Soft bounce fill light from front-left
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-4, 4, 3);
    scene.add(fillLight);

    // ── Load GLTF / GLB Model ──
    let loadedObject: THREE.Object3D | null = null;
    const loader = new GLTFLoader();

    loader.load(
      product.model_url,
      (gltf) => {
        const root = gltf.scene;

        // Enable shadows on all child meshes
        root.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Compute Bounding Box & Scale to fit within a 2-unit cube
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetDim = 2.0;
        const scale = maxDim > 0 ? targetDim / maxDim : 1;
        root.scale.set(scale, scale, scale);

        // Recompute box after scale and place model grounded at y = 0
        box.setFromObject(root);
        box.getCenter(center);

        root.position.x = -center.x;
        root.position.y = -box.min.y; // Sit directly on floor plane
        root.position.z = -center.z;

        scene.add(root);
        loadedObject = root;

        // Position controls target at center of product
        controls.target.set(0, (box.max.y - box.min.y) / 2, 0);
        controls.update();

        setModelLoading(false);
      },
      undefined,
      (loadErr) => {
        console.error('Failed to load GLB model:', loadErr);
        setModelError('Unable to load 3D model. Please verify your connection.');
        setModelLoading(false);
      }
    );

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();

      if (loadedObject) {
        scene.remove(loadedObject);
      }

      floorGeo.dispose();
      floorMat.dispose();
      backWallGeo.dispose();
      leftWallGeo.dispose();
      wallMat.dispose();
      renderer.dispose();
    };
  }, [product?.model_url]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--brown-800)',
        }}
      >
        Loading furniture detail & 3D space...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--cream)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          padding: 24,
        }}
      >
        <AlertCircle size={40} color="var(--danger)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--brown-900)', margin: '0 0 8px' }}>
          {error || 'Product Not Found'}
        </h2>
        <button
          onClick={() => navigate('/portal/catalogue')}
          style={{
            marginTop: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--brown-900)',
            color: 'var(--cream)',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Return to Catalogue
        </button>
      </div>
    );
  }

  const stock = parseFloat(product.stock_qty) || 0;
  const hasMrpDiff = product.mrp && product.mrp !== product.sales_price;
  const hasModel = Boolean(product.model_url);

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-body)' }}>
      {/* ── Breadcrumb / Back Navigation ── */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate('/portal/catalogue')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            color: 'var(--brown-800)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 120ms ease',
          }}
        >
          <ArrowLeft size={14} />
          Back to Catalogue
        </button>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
        }}
      >
        {/* ── Left Panel (Product Details & Invoices) — 40% desktop ── */}
        <div
          style={{
            flex: '1 1 380px',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Product Overview Card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              boxShadow: 'var(--shadow-sm)',
              padding: 28,
            }}
          >
            {/* Category & SKU */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(74, 58, 52, 0.08)',
                  color: 'var(--brown-700)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {product.category || 'Goods'}
              </span>

              {product.sku && (
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--brown-500)' }}>
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                lineHeight: '34px',
                fontWeight: 700,
                color: 'var(--brown-900)',
                margin: '0 0 16px',
              }}
            >
              {product.name}
            </h1>

            {/* Price section */}
            <div style={{ padding: '16px 0', borderTop: '1px solid rgba(208, 174, 146, 0.25)', borderBottom: '1px solid rgba(208, 174, 146, 0.25)', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--brown-500)', marginBottom: 4 }}>Selling Price (inclusive of tax)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 26,
                    fontWeight: 700,
                    color: 'var(--brown-900)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatINR(product.sales_price)}
                </span>
                {hasMrpDiff && product.mrp && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 15,
                      color: 'var(--brown-500)',
                      textDecoration: 'line-through',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    MRP {formatINR(product.mrp)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--brown-700)', marginTop: 6 }}>
                Includes GST at {product.tax_rate}% rate
              </div>
            </div>

            {/* Stock status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--brown-700)', fontWeight: 600 }}>Stock Availability:</span>
              {stock <= 0 ? (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(158, 74, 56, 0.3)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Out of Stock
                </span>
              ) : stock < 5 ? (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--warning-bg)',
                    color: 'var(--warning)',
                    border: '1px solid rgba(192, 138, 62, 0.3)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Low Stock ({stock} available)
                </span>
              ) : (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--posted-bg)',
                    color: 'var(--posted)',
                    border: '1px solid rgba(95, 112, 82, 0.3)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  In Stock ({stock} units)
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--brown-900)', margin: '0 0 8px' }}>
                Description & Craftsmanship
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: '22px', color: 'var(--brown-700)' }}>
                Precision-engineered for architectural aesthetics and durability. Handcrafted with kiln-dried hardwoods,
                reinforced joinery, and premium upholstery, tested to commercial hospitality performance standards.
              </p>
            </div>
          </div>

          {/* ── Customer Invoices with this Product ── */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              boxShadow: 'var(--shadow-sm)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileText size={18} color="var(--brown-700)" />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Your Invoices with this Product
              </h2>
            </div>

            {/* If NOT authenticated */}
            {isAuthenticated === false && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--brown-100)',
                  border: '1px solid rgba(208, 174, 146, 0.4)',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--brown-800)', lineHeight: '19px' }}>
                  Sign in to your customer account to view your past invoices and purchase history for this furniture item.
                </p>
                <button
                  onClick={() => navigate('/portal/login')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--brown-900)',
                    color: 'var(--cream)',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                  }}
                >
                  <LogIn size={13} />
                  Sign In to Customer Portal
                </button>
              </div>
            )}

            {/* If authenticated with invoices */}
            {isAuthenticated === true && invoices.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(208, 174, 146, 0.3)',
                      backgroundColor: 'rgba(249, 242, 228, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <Link
                        to={`/portal/invoices/${inv.id}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--brown-900)',
                          textDecoration: 'none',
                        }}
                      >
                        {inv.number}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--brown-500)', marginTop: 2 }}>
                        Date: {inv.invoiceDate || '—'} · Qty: {parseFloat(inv.qty)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--brown-900)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatINR(inv.lineTotal)}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color:
                            inv.paymentStatus === 'paid'
                              ? 'var(--posted)'
                              : inv.paymentStatus === 'partial'
                              ? 'var(--warning)'
                              : 'var(--danger)',
                        }}
                      >
                        {inv.paymentStatus ? inv.paymentStatus.replace('_', ' ') : inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* If authenticated but no matching invoices */}
            {isAuthenticated === true && invoices.length === 0 && (
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(74, 58, 52, 0.03)',
                  border: '1px dashed rgba(208, 174, 146, 0.4)',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--brown-700)',
                }}
              >
                You have not purchased this product on any confirmed customer invoice yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel (Three.js 3D Room Canvas) — 60% desktop ── */}
        <div
          style={{
            flex: '2 1 540px',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {hasModel ? (
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Canvas header bar */}
              <div
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--brown-900)',
                  color: 'var(--cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(74, 58, 52, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Box size={16} color="var(--brown-100)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
                    Interactive 3D Showroom Room Scene
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--brown-300)' }}>
                  Rotate: Left Click · Zoom: Wheel · Pan: Right Click
                </span>
              </div>

              {/* 3D Canvas Container */}
              <div
                ref={containerRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 500, // 500px on desktop
                  backgroundColor: '#F9F2E4',
                  overflow: 'hidden',
                }}
                className="three-canvas-container"
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'grab',
                  }}
                />

                {/* Loading Spinner */}
                {modelLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(249, 242, 228, 0.85)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      color: 'var(--brown-900)',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        border: '3px solid rgba(74, 58, 52, 0.2)',
                        borderTop: '3px solid var(--brown-900)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: 12,
                      }}
                    />
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                      @media (max-width: 640px) {
                        .three-canvas-container {
                          height: 300px !important;
                        }
                      }
                    `}</style>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
                      Loading 3D Furniture Asset...
                    </span>
                  </div>
                )}

                {/* Model Error Message */}
                {modelError && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 24,
                      textAlign: 'center',
                      backgroundColor: 'var(--cream)',
                      color: 'var(--danger)',
                    }}
                  >
                    <AlertCircle size={32} style={{ marginBottom: 8 }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{modelError}</span>
                  </div>
                )}
              </div>

              {/* Canvas Footer toolbar */}
              <div
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--surface)',
                  borderTop: '1px solid rgba(208, 174, 146, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--brown-700)',
                }}
              >
                <span>Material: Wood & Neutral Room Setup</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>WebGL 2.0 · OrbitControls</span>
              </div>
            </div>
          ) : (
            // If no 3D model, hide 3D canvas and show 2D image preview
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                padding: 24,
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--brown-900)', margin: '0 0 16px' }}>
                Product Image Preview
              </h3>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    height: 350,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--brown-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brown-700)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                  }}
                >
                  No 3D Model or Image File Available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalProductViewerPage;
