# 架构对比与设计建议 (Architecture & Design Recommendations)

这是我们对三种典型架构范式（UI 设计工具、游戏引擎、参数化 CAD）与 AluCraft 的对比与建议。把详细的架构思考从 README 中抽出，放在此文件以便维护和演进。

## 1. 行业范式对比：三种典型架构

### 范式一：UI 设计工具模式（Figma / Webflow）

* **核心模型**：盒模型（Box model）+ 自动布局（Auto Layout）。
* **工作流**：以矩形容器（Frame/Container）为主，父容器驱动子元素的排列（Flex/Grid）。
* **与 AluCraft 的对应关系**：`RecursiveRender` 与 `LayoutNode` 目前就是这种树状布局的实现。
* **优缺点**：
  - ✅ 稳定、低复杂度、易实现；适合切分空间。
  - ❌ 弱于表达复杂几何约束；在没有校验器时可能创建语义上不正确的设计（如悬空部件）。

### 范式二：游戏引擎模式（Unity / Godot）

* **核心模型**：实体-组件-系统（ECS）或 Prefab（预制体）。
* **工作流**：通过挂载组件和复用 Prefab 实现高度可扩展、模块化的功能组合。
* **对应 AluCraft 的优化点**：`ItemNode` 目前混合了多种数据，如果改为组件化，可以极大提升扩展性和可维护性。

### 范式三：参数化 CAD（SolidWorks / Fusion 360）

* **核心模型**：草图 + 几何约束（Sketch & Constraints）+ 实时求解器。
* **工作流**：以约束的方式构建几何关系，求解器保证几何一致性。
* **优缺点**：
  - ✅ 几何一致性强，适合工程级精度。
  - ❌ 实现复杂、性能开销大，门槛高，不适合面向非工程师的 Web 应用。

---

## 2. 针对 AluCraft 的建议（取其精华）

考虑到 AluCraft 面向 Web 平台和 DIY 用户，我们推荐：**以 Figma 的盒模型为骨架 + 引入游戏引擎式的组件化扩展 + 轻量级的验证器（Design Validator）**。
