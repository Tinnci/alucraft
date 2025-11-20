
-----

# 🛠️ AluCraft

**AluCraft** 是一个基于 Web 的 3D 参数化设计工具，专为全铝家居（铝型材橱柜）DIY 爱好者开发。

**核心目标**：解决铝型材柜体设计中复杂的\*\*“铰链遮盖计算”**与**“型材下料算量”\*\*痛点。不再需要在那张纸上手画草图算加减法，拒绝“买错铰链”或“锯短型材”。


## ✨ 已实现功能 (Features)

目前项目处于早期开发阶段 (WIP)，已具备以下核心能力：

### 1\. 🧠 智能铰链计算引擎 (Hinge Logic Engine)

  * **自动推导：** 输入期望的“门板遮盖量 (Overlay)”，算法自动在 C80 (直/中/大弯) 和 盖25 系列中寻找最优解。
  * **参数校验：** 自动计算 K 值 (孔边距) 和螺丝调节量，防止超出五金件的物理调节范围。
  * **环境感知：** 勾选“靠墙”选项，系统会自动检测碰撞风险，并强制修正遮盖量（例如自动推荐大弯铰链以避让墙体）。

### 🆕 Recent improvements (from this round)

  * State management: migrated UI state to a centralized `Zustand` store to make UI/data flow predictable and easier to extend.
  * On-canvas interaction: Click door to toggle open/close; Alu profiles highlight on hover; Doors show hinge cup holes and screw positions.
  * Dimension Lines: Added 3D dimension lines with labels for cabinet width, height, and depth to aid quick reading.
  * BOM Panel: Added a simple live Bill of Materials panel showing profile pieces, door dimensions and hinge count.
  * Basic transform controls: You can now drag/scale the frame in the 3D scene to change width/height/depth (uses TransformControls).
  * Persistence: Designs auto-save to localStorage and can be downloaded as JSON or loaded back.
  * Export BOM: The BOM panel now supports Export to CSV and JSON for easy sharing or procurement.


### 2\. 📐 参数化 3D 框架 (Parametric Frame)

  * **实时渲染：** 基于 React Three Fiber，实时生成 2020/3030/4040 等不同规格的铝型材模型。
  * **物理切割逻辑：** 实现了“立柱贯通、横梁让位”的自动切割算法，所见即所得。
  * **动态尺寸：** 拖动滑块调整长宽高，模型结构自动更新。

### 3\. 🔧 制造辅助 (Fabrication Aid)

  * **X-Ray 钻孔预览：** 在 3D 门板上可视化显示 35mm 铰链杯孔及螺丝孔的准确位置，随 K 值动态变化。
  * **交互模拟：** 点击“开门/关门”，直观检查门板开启轨迹是否会发生干涉（撞墙）。

## 🛠️ 技术栈 (Tech Stack)

  * **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
  * **3D Engine:** [Three.js](https://threejs.org/)
  * **Renderer:** [React Three Fiber (R3F)](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
  * **Animation:** React Spring
  * **Language:** TypeScript

## 🚀 快速开始 (Getting Started)

这是一个标准的 Next.js 项目。

```bash
# 1. 克隆项目
git clone https://github.com/tinnci/alucraft.git

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:3000` 即可开始设计。

## 📅 开发计划 (Roadmap)

作为一个个人业余项目，后续计划逐步完善以下功能：

  - [x] 基础框架生成与渲染
  - [x] 铰链选型核心算法
  - [x] 3D 开门动画与碰撞检测
  - [x] 钻孔位置可视化
  - [ ] **BOM 导出：** 一键生成型材切割清单 (Excel) 和五金采购单
  - [ ] **排料优化：** 计算如何切割原材料最省料
  - [ ] **更多型材库：** 支持欧标 4040 以及特定的橱柜拉手型材
  - [ ] **多门逻辑：** 支持双开门、上下分层结构

## ⚠️ 免责声明 (Disclaimer)

本项目主要用于辅助 DIY 设计与验证思路。

  * 实际加工前，请务必根据您购买的实物五金参数（特别是不同品牌的铰链 K 值表）进行二次核对。
  * 软件提供的切割尺寸未包含锯片损耗（通常为 3-5mm），下料时请预留余量。

-----

*Designed with ❤️.*
*AI generated, use with caution! *