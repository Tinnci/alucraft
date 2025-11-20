'use client';

import { useRef, useEffect, JSX } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stage, Box } from '@react-three/drei';
import { calculateHinge } from '@/core/hinge-rules';
import { ProfileType, PROFILES } from '@/core/types';
import { CabinetFrame } from '@/components/CabinetFrame';
import { TransformControls } from '@react-three/drei';
import { DoorPanel } from '@/components/DoorPanel';
import { BOMPanel } from '@/components/BOMPanel';
import DimensionLines from '@/components/DimensionLines';
import styles from './page.module.css';

export default function Home() {
  // Extract global design state and setters from the store
  const profileType = useDesignStore((state: DesignState) => state.profileType);
  const overlay = useDesignStore((state: DesignState) => state.overlay);
  const result = useDesignStore((state: DesignState) => state.result);
  const width = useDesignStore((state: DesignState) => state.width);
  const height = useDesignStore((state: DesignState) => state.height);
  const depth = useDesignStore((state: DesignState) => state.depth);
  const hasLeftWall = useDesignStore((state: DesignState) => state.hasLeftWall);
  const hasRightWall = useDesignStore((state: DesignState) => state.hasRightWall);
  const isDoorOpen = useDesignStore((state: DesignState) => state.isDoorOpen);
  const doorCount = useDesignStore((state: DesignState) => state.doorCount);
  const connectorType = useDesignStore((state: DesignState) => state.connectorType);

  const frameRef = useRef<THREE.Group | null>(null);
  // setters
  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setOverlay = useDesignStore((state: DesignState) => state.setOverlay);
  const setResult = useDesignStore((state: DesignState) => state.setResult);
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);
  const setHasLeftWall = useDesignStore((state: DesignState) => state.setHasLeftWall);
  const setHasRightWall = useDesignStore((state: DesignState) => state.setHasRightWall);
  const setIsDoorOpen = useDesignStore((state: DesignState) => state.setIsDoorOpen);
  const setDoorCount = useDesignStore((state: DesignState) => state.setDoorCount);
  const setConnectorType = useDesignStore((state: DesignState) => state.setConnectorType);

  const handleCalculate = () => {
    let currentOverlay = overlay;
    let autoAdjusted = false;
    const warningMessages: string[] = [];

    // --- 1. 智能环境感知与自动修正 (Auto-Correction) ---

    // 场景 A: 左侧靠墙 (Left Wall Collision)
    if (hasLeftWall) {
      // 规则：靠墙时，普通直臂/中弯铰链通常无法做到大遮盖而不撞墙。
      // 行业经验：靠墙通常建议遮盖 <= 2mm (使用大弯/内嵌铰链)
      // 或者使用特殊的 "大角度铰链" (本项目暂不涉及)

      // 如果当前遮盖量 > 3mm (给一点容错)，强制修正
      if (currentOverlay > 3) {
        currentOverlay = 2; // 强制设为安全值
        autoAdjusted = true;
        warningMessages.push("检测到左侧靠墙，已自动将遮盖量调整为 2mm 以防止撞墙。");
      }
    }

    // 场景 B: 右侧靠墙 (同理，如果是双门柜，右门也受影响，这里暂只演示单门左开)
    // 如果是单门且左开，右墙其实不影响开门轨迹，只影响安装空间。
    // 但为了严谨，如果右侧靠墙，通常右边的遮盖也不能太大（如果是双开门）。
    // 这里我们暂时只处理左开门撞左墙的情况。

    // --- 2. 运行核心匹配引擎 ---
    const res = calculateHinge(profileType, currentOverlay);

    // --- 3. 结果后处理 ---
    if (autoAdjusted) {
      // 更新输入框的显示值 (可选，让用户看到变了)
      setOverlay(currentOverlay);

      // 标记结果为“修正后成功”
      res.message = `[自动优化] ${res.message}`;
      res.details = (res.details || "") + ` | ⚠️ ${warningMessages.join(' ')}`;
    } else if (res.success && hasLeftWall && currentOverlay > 2) {
      // 如果用户强制输入了比如 2.5mm，虽然没触发修正，但仍在边缘
      res.message += " (注意：靠墙间隙极小)";
    }

    setResult(res);
  };

  const downloadDesign = () => {
    const state = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-design.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadDesignFromLocal = () => {
    try {
      const raw = localStorage.getItem('alucraft-design');
      if (!raw) { alert('No saved design in localStorage'); return; }
      const parsed = JSON.parse(raw);
      if (parsed.width) setWidth(parsed.width);
      if (parsed.height) setHeight(parsed.height);
      if (parsed.depth) setDepth(parsed.depth);
      if (parsed.profileType) setProfileType(parsed.profileType);
      if (parsed.overlay !== undefined) setOverlay(parsed.overlay);
      if (parsed.hasLeftWall !== undefined) setHasLeftWall(parsed.hasLeftWall);
      if (parsed.hasRightWall !== undefined) setHasRightWall(parsed.hasRightWall);
      if (parsed.isDoorOpen !== undefined) setIsDoorOpen(parsed.isDoorOpen);
      if (parsed.result) setResult(parsed.result);
    } catch (err) {
      alert('Failed to load design');
      console.warn(err);
    }
  };

  // Calculate door dimensions
  const profile = PROFILES[profileType as ProfileType];
  const s = profile.size;

  // 门板宽度 = 内空 + 两侧遮盖
  // 假设单门全盖：InnerWidth + (Overlay * 2)
  const innerWidth = width - (s * 2);
  const doorWidth = innerWidth + (overlay * 2);
  // 简化：门和柜体一样高，或者 height - something
  const doorHeight = height;

  // [CRITICAL] 铰链位置计算 (Anchor Point)
  // 修正坐标：
  // 柜体是居中的，左边缘在 -width/2。
  // 门也是居中的，左边缘在 -doorWidth/2。
  // 因为有遮盖，通常 doorWidth > innerWidth，甚至 doorWidth ≈ width。
  // 所以我们把铰链点设为：X = -doorWidth / 2 (让门在关上时视觉居中)
  const hingePosition: [number, number, number] = [
    -doorWidth / 2,
    0,
    depth / 2 + 2 // Z轴：放在柜体最前方 + 2mm 缝隙
  ];

  const collisionLeft = Boolean(hasLeftWall && result && !result.success);
  const collisionRight = Boolean(hasRightWall && result && !result.success);

  // Precompute door elements for single or double doors to simplify JSX
  let doorElements: JSX.Element | null = null;
  if (doorCount === 1) {
    doorElements = (
      <>
        <DoorPanel
          width={doorWidth}
          height={doorHeight}
          thickness={20}
          position={hingePosition}
          hingeSide="left"
          isOpen={isDoorOpen}
          material="AluminumHoneycomb"
          showHoles={result?.success === true}
          kValue={result?.kValue || 4}
          hingeSeries={result?.recommendedHinge?.series || 'C80'}
          onToggle={() => setIsDoorOpen(!isDoorOpen)}
          highlightError={collisionLeft}
          overlay={overlay}
        />

        <mesh position={[hingePosition[0], -height / 2 + 1, hingePosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, Math.max(width, depth) * 1.2, 32, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color={collisionLeft ? '#ff4d4d' : '#60a5fa'} opacity={0.12} transparent />
        </mesh>
      </>
    );
  } else {
    const eachInner = innerWidth / 2;
    const doorEachWidth = eachInner + overlay; // rough approximation
    const hingeLeftPos: [number, number, number] = [-doorEachWidth / 2, 0, depth / 2 + 2];
    const hingeRightPos: [number, number, number] = [doorEachWidth / 2, 0, depth / 2 + 2];
    doorElements = (
      <>
        <DoorPanel
          width={doorEachWidth}
          height={doorHeight}
          thickness={20}
          position={hingeLeftPos}
          hingeSide="left"
          isOpen={isDoorOpen}
          material="AluminumHoneycomb"
          showHoles={result?.success === true}
          kValue={result?.kValue || 4}
          hingeSeries={result?.recommendedHinge?.series || 'C80'}
          onToggle={() => setIsDoorOpen(!isDoorOpen)}
          highlightError={collisionLeft}
          overlay={overlay}
        />
        <mesh position={[hingeLeftPos[0], -height / 2 + 1, hingeLeftPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, Math.max(width, depth) * 1.1, 32, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color={collisionLeft ? '#ff4d4d' : '#60a5fa'} opacity={0.08} transparent />
        </mesh>

        <DoorPanel
          width={doorEachWidth}
          height={doorHeight}
          thickness={20}
          position={hingeRightPos}
          hingeSide="right"
          isOpen={isDoorOpen}
          material="AluminumHoneycomb"
          showHoles={result?.success === true}
          kValue={result?.kValue || 4}
          hingeSeries={result?.recommendedHinge?.series || 'C80'}
          onToggle={() => setIsDoorOpen(!isDoorOpen)}
          highlightError={collisionRight}
          overlay={overlay}
        />
        <mesh position={[hingeRightPos[0], -height / 2 + 1, hingeRightPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, Math.max(width, depth) * 1.1, 32, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color={collisionRight ? '#ff4d4d' : '#60a5fa'} opacity={0.08} transparent />
        </mesh>
      </>
    );
  }

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('alucraft-design');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.width) setWidth(parsed.width);
      if (parsed.height) setHeight(parsed.height);
      if (parsed.depth) setDepth(parsed.depth);
      if (parsed.profileType) setProfileType(parsed.profileType);
      if (parsed.overlay !== undefined) setOverlay(parsed.overlay);
      if (parsed.hasLeftWall !== undefined) setHasLeftWall(parsed.hasLeftWall);
      if (parsed.hasRightWall !== undefined) setHasRightWall(parsed.hasRightWall);
      if (parsed.isDoorOpen !== undefined) setIsDoorOpen(parsed.isDoorOpen);
      if (parsed.result) setResult(parsed.result);
    } catch (err) {
      console.warn('Failed to load saved design', err);
    }
  }, [setWidth, setHeight, setDepth, setProfileType, setOverlay, setHasLeftWall, setHasRightWall, setIsDoorOpen, setResult]);

  // Persist to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result };
    try {
      localStorage.setItem('alucraft-design', JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save design to localStorage', err);
    }
  }, [width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result]);

  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        {/* Left Panel: Calculator */}
        <div className={styles.panel}>
          <h1 className={styles.title}>AluCraft Hinge Calculator</h1>

          <div className={styles.card}>
            <div className={styles.inputGroup}>
              <label>Profile Type (型材)</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <select
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value as ProfileType)}
                  className={styles.select}
                  style={{ flex: 1 }}
                >
                  <option value="2020">2020</option>
                  <option value="3030">3030</option>
                  <option value="4040">4040</option>
                </select>
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0 0.5rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: '#0369a1',
                    border: '1px solid #cffafe'
                  }}
                  title={`Profile size: ${PROFILES[profileType].size}mm x ${PROFILES[profileType].size}mm`}
                >
                  {PROFILES[profileType].size}mm
                </span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Desired Overlay (期望遮盖量 mm)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={overlay}
                  onChange={(e) => setOverlay(Number(e.target.value))}
                  className={styles.input}
                />
                <button title="Overlay is how much the door overlaps the cabinet's front face; positive values mean the door covers the frame edge." style={{ border: 0, background: 'transparent', cursor: 'help' }}>ⓘ</button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Environment (环境)</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={hasLeftWall} onChange={e => setHasLeftWall(e.target.checked)} />
                  Left Wall (左墙)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={hasRightWall} onChange={e => setHasRightWall(e.target.checked)} />
                  Right Wall (右墙)
                </label>
              </div>
            </div>

            {/* [NEW] 添加一个开关门的控制按钮 */}
            <div className={styles.inputGroup}>
              <label>Door Interaction</label>
              <button
                onClick={() => setIsDoorOpen(!isDoorOpen)}
                className={styles.button}
                style={{ backgroundColor: isDoorOpen ? '#ef4444' : '#22c55e' }}
              >
                {isDoorOpen ? 'Close Door (关门)' : 'Open Door (开门)'}
              </button>
            </div>

            <div className={styles.inputGroup}>
              <label>Door Count</label>
              <select value={doorCount} onChange={(e) => setDoorCount(Number(e.target.value))} className={styles.select}>
                <option value={1}>Single Door</option>
                <option value={2}>Double Doors</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Connector Type</label>
              <select value={connectorType} onChange={(e) => setConnectorType(e.target.value as 'angle' | 'internal')} className={styles.select}>
                <option value="angle">Angle Bracket (L-Bracket)</option>
                <option value="internal">Internal Lock</option>
              </select>
            </div>

            <button onClick={handleCalculate} className={styles.button}>
              Calculate / 计算
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={downloadDesign} className={styles.button} style={{ backgroundColor: '#0ea5e9' }}>Download JSON</button>
              <button onClick={loadDesignFromLocal} className={styles.button} style={{ backgroundColor: '#f59e0b' }}>Load Saved</button>
            </div>
          </div>

          {result && (
            <div className={`${styles.result} ${result.success ? styles.success : styles.error}`}>
              <h2>{result.success ? 'Recommendation' : 'Error'}</h2>
              <p className={styles.message}>{result.message}</p>
              {result.details && <p className={styles.details}>{result.details}</p>}

              {result.success && (
                <div className={styles.debug}>
                  <small>Hinge: {result.recommendedHinge?.name}</small><br />
                  <small>K-Value: {result.kValue}mm</small><br />
                  <small>Adjustment: {result.adjustment}mm</small>
                </div>
              )}
            </div>
          )}
          {/* BOM 列表 */}
          <BOMPanel />
        </div>

        {/* Right Panel: 3D Visualization */}
        <div className={styles.viewer}>
          <div className={styles.viewerControls}>
            <div className={styles.controlGroup}>
              <label>Width: {width}mm</label>
              <input
                type="range"
                min="200"
                max="1200"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className={styles.controlGroup}>
              <label>Height: {height}mm</label>
              <input
                type="range"
                min="200"
                max="2000"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            <div className={styles.controlGroup}>
              <label>Depth: {depth}mm</label>
              <input
                type="range"
                min="200"
                max="800"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.canvasContainer}>
            <Canvas shadows camera={{ position: [1500, 1500, 1500], fov: 50, near: 10, far: 20000 }}>
              <color attach="background" args={['#f0f2f5']} />
              <Stage environment="city" intensity={0.5} adjustCamera={false}>
                <TransformControls
                  mode="scale"
                  onChange={() => {
                    const group = frameRef.current;
                    if (!group) return;
                    // Scale to calculate new dims
                    const sx = group.scale.x;
                    const sy = group.scale.y;
                    const sz = group.scale.z;
                    if (sx !== 1 || sy !== 1 || sz !== 1) {
                      setWidth(Math.max(200, Math.round(width * sx)));
                      setHeight(Math.max(200, Math.round(height * sy)));
                      setDepth(Math.max(200, Math.round(depth * sz)));
                      group.scale.set(1, 1, 1);
                    }
                  }}
                >
                  <group ref={frameRef}>
                    <CabinetFrame
                      width={width}
                      height={height}
                      depth={depth}
                      profileType={profileType}
                    />
                  </group>
                </TransformControls>

                {doorElements}

                {/* Dimension Lines */}
                <DimensionLines width={width} height={height} depth={depth} offset={80} />

                {/* Visualize Walls if enabled */}
                {hasLeftWall && (
                  <Box args={[10, height, depth]} position={[-width / 2 - 5 - 2, 0, 0]}>
                    <meshStandardMaterial color={collisionLeft ? '#ff4d4d' : '#ffaaaa'} opacity={0.5} transparent />
                  </Box>
                )}
                {hasRightWall && (
                  <Box args={[10, height, depth]} position={[width / 2 + 5 + 2, 0, 0]}>
                    <meshStandardMaterial color={collisionRight ? '#ff4d4d' : '#ffaaaa'} opacity={0.5} transparent />
                  </Box>
                )}

              </Stage>
              <OrbitControls makeDefault maxDistance={10000} />
              <gridHelper args={[2000, 40]} />
              <axesHelper args={[100]} />
            </Canvas>
          </div>
        </div>
      </div>
    </main>
  );
}
