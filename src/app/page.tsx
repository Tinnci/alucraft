'use client';

import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Box } from '@react-three/drei';
import { calculateHinge } from '@/core/hinge-rules';
import { ProfileType, SimulationResult, PROFILES } from '@/core/types';
import { CabinetFrame } from '@/components/CabinetFrame';
import { DoorPanel } from '@/components/DoorPanel';
import styles from './page.module.css';

export default function Home() {
  // Hinge Calculator State
  const [profileType, setProfileType] = useState<ProfileType>('2020');
  const [overlay, setOverlay] = useState<number>(14);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // 3D Visualization State
  const [width, setWidth] = useState<number>(600);
  const [height, setHeight] = useState<number>(800);
  const [depth, setDepth] = useState<number>(400);

  // Environment State
  const [hasLeftWall, setHasLeftWall] = useState<boolean>(false);
  const [hasRightWall, setHasRightWall] = useState<boolean>(false);

  // [NEW] 门板开关状态
  const [isDoorOpen, setIsDoorOpen] = useState(false);

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

  // Calculate door dimensions
  const profile = PROFILES[profileType];
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

  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        {/* Left Panel: Calculator */}
        <div className={styles.panel}>
          <h1 className={styles.title}>AluCraft Hinge Calculator</h1>

          <div className={styles.card}>
            <div className={styles.inputGroup}>
              <label>Profile Type (型材)</label>
              <select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value as ProfileType)}
                className={styles.select}
              >
                <option value="2020">2020 (20mm)</option>
                <option value="3030">3030 (30mm)</option>
                <option value="4040">4040 (40mm)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Desired Overlay (期望遮盖量 mm)</label>
              <input
                type="number"
                value={overlay}
                onChange={(e) => setOverlay(Number(e.target.value))}
                className={styles.input}
              />
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

            <button onClick={handleCalculate} className={styles.button}>
              Calculate / 计算
            </button>
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
                <CabinetFrame
                  width={width}
                  height={height}
                  depth={depth}
                  profileType={profileType}
                />

                <DoorPanel
                  width={doorWidth}
                  height={doorHeight}
                  thickness={20}
                  position={hingePosition}
                  hingeSide="left"
                  isOpen={isDoorOpen}
                  material="AluminumHoneycomb"

                  // [NEW] 传递 Phase 3 数据
                  showHoles={result?.success === true} // 只有计算成功才显示孔
                  kValue={result?.kValue || 4}         // 默认4，如果有结果则用结果
                  hingeSeries={result?.recommendedHinge?.series || 'C80'} // 传入 'C80' 或 'Cover25'
                />

                {/* Visualize Walls if enabled */}
                {hasLeftWall && (
                  <Box args={[10, height, depth]} position={[-width / 2 - 5 - 2, 0, 0]}>
                    <meshStandardMaterial color="#ffaaaa" opacity={0.5} transparent />
                  </Box>
                )}
                {hasRightWall && (
                  <Box args={[10, height, depth]} position={[width / 2 + 5 + 2, 0, 0]}>
                    <meshStandardMaterial color="#ffaaaa" opacity={0.5} transparent />
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
