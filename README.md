# 立论星轨 | Case Trajectories

**结构性交锋立论辅助工具 · Structural Clash Case Construction Assistant**  
A standalone, bilingual, browser-based workspace for exploring how an affirmative or negative case can constructively engage the opposing side's reasonable arguments.

语言 / Languages: [中文](#中文说明) · [English](#english)

---

## 中文说明

### 这是什么？

**立论星轨（Case Trajectories）**是《辩论筑基》（Debate Universal Grammar，DUG）体系下，专门帮助辩手探索**结构性交锋式立论**的实验性辅助工具。它并不代替一般立论、证据研究、实战攻防或 Debate Coach，也不自动判定立论优劣与胜负。

**结构性交锋立论**，不是先写一套只证明我方的论点，再罗列可能的反驳；也不是预设对方必然错误。它是在形成我方立论架构时，就设想、识别并正面容纳对方可能成立的事实、理由、价值与合理诉求，将双方内容置于同一个更有解释力的讨论视角或理由之下，经过比较、**消化**或**反转**，解释为什么即使对方有合理之处，整体结论仍是我方持方成立。

在 DUG 的结构性交锋语义中：

- **不是抹除对方**：对方原有的合理事实、利益或价值仍被承认，不能靠偷换定义、挪走利益归属或把对方的强项宣布为“不讨论”来制造胜利。
- **不是承认即认输**：容纳双方内容后，寻找能解释两边并导向我方的较上位视角／理由（常在理论表达中记为 B′），把两方原本平行的立论转化为可以正面交锋的整体答案。
- **不限于逐点反驳**：结构性交锋可以发生在理由、判准、价值和整套立论架构的层级。其成果可以同时回应对方并推进我方；但不代表每条具体论点必然已被证明。
- **不是一张万能模板**：必须保留合理例外、论证空间和对原观点的忠实解释；新视角、权重变化、结论转向都需要能被听众理解的实质理由。

简单表示：**己方架构 X + 对方架构 Y → 有解释力的共同视角／关键理由 B′ → 经交锋后我方结论 C**。这是一种思考结构，不是机械演算公式；“结构性交锋”是 DUG 的 Structural Clash，不等同于简单的预判反驳。

**课程概念依据**：DUG 知识体系中的 C204–C206、C254、C281–C283、C390、C395、C403、C504–C505；产品的四步流程是辅助性实现，并不等同于理论的唯一合法运用方法。

### 四步工作流

1. **穷举论点**：输入辩题、双方持方及我方立场，独立采样对方可能成立的论点；合并语义相近的结果，显示有效采样中的出现次数。有限采样不保证真正穷尽。
2. **分析共性**：寻找对方不同论点背后可能共享的事实、前提、理由或价值，形成多项候选共性；可延伸阅读对方底层观念。
3. **处理分析**：围绕已得到的共性，探索如何**承认什么 → 如何消化／反转 → 为什么导向我方判断**；可产生多条不同的处理路径，并附我方底层观念解释。
4. **视角切入**：针对**某一条具体处理路径**，倒推如何从辩题通常理解自然进入该视角，让处理逻辑成为真正可叙述的立论，而不是孤立的漂亮结论。

**路径树、叙事流程和星轨视图**让你分别查看分析的来源关系、完整叙述顺序，以及当前／所有路径的关联。可手工编辑、保留不同候选、复核被上游修改影响的节点，并导出可恢复的 JSON、Markdown 或离线交互 HTML 报告。

### 如何使用

**直接体验**：下载仓库根目录的 **index.html**，用现代桌面或移动浏览器打开。界面、脚本、演示数据与视觉资源随单页内嵌；无需额外下载字体或从 CDN 加载程序。

- 直接打开即可查看人工编写的演示与已有的离线视图。
- 需要生成新分析时，打开**模型设置**，自行配置 DeepSeek、GLM、Kimi、OpenAI 或兼容模型的 API 地址、型号与密钥。使用模型接口可能收费。
- 模型请求通常由浏览器**直接发送给所选择的第三方服务商**，因此须满足该服务商的 CORS 跨域策略；浏览器通过 file:// 打开时来源可能是 null。将文件交给本地 HTTP 服务**不自动解决**服务商的 CORS 限制。
- 工具还支持按规定格式导入《认知星图》结构化会话／报告。**认知星图和立论星轨是两个不同应用**；导入是数据衔接，不是把两者合成一个程序。

### 数据、隐私与结果边界

会话和非密钥设置主要保存在**当前浏览器的本地存储**中，换设备或清理浏览器数据可能使历史丢失；请经常导出 JSON 备份。API Key 仅在页面会话内存中使用，不纳入正常会话／报告导出；生成请求的论点、文本及上下文可能发送给你选择的外部模型服务商。

**频次只表示在本轮有效采样中被提及的次数**，不是现实人群比例、真实性、论证强度或胜率。模型建议、关联关系与底层观念解释都可能错误；引用、来源、学理主张及重要结论应独立核实。Debug 包及会话 JSON 可能含用户输入和模型全文，请不要直接公开上传。

本项目没有自动裁判、自动证明、攻防检验或胜负评分功能；更不保证“消化／反转”一定成立。

### 从源代码构建

仓库内保留可编辑的 **src/** 模块和 **build.mjs**，不需要打包器依赖。安装 Node.js（建议版本 18 或更高）后在仓库根目录执行：

~~~bash
node build-release.cjs
~~~

脚本调用原始 **build.mjs**，验证 `dist/` 三个别名完全一致，并把单文件复制到仓库根目录 **index.html**，同时生成 **RELEASE-MANIFEST.json**（SHA-256 与构建清单）。更新源代码后重新运行并做浏览器回归；构建通过不等于真实模型或浏览器实测通过。

### 署名与许可

© 2026 **精靈 Moon**。本项目原创内容采用 **Creative Commons Attribution–NonCommercial–ShareAlike 4.0 International（CC BY-NC-SA 4.0）**，见 [LICENSE](LICENSE)（Creative Commons 官方许可全文）、[LICENSE-NOTICE.md](LICENSE-NOTICE.md)（项目署名与范围）与 [官方许可页面](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en)。再分发和改编需署名、注明更改、保留非商业限制，并对衍生作品适用相同方式共享要求。

内嵌的**思源宋体（Source Han Serif）字体子集**仍受其原始 **SIL Open Font License 1.1** 约束，参见 [FONT-LICENSE.txt](FONT-LICENSE.txt) 与 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。字体并未被重新授权为 CC BY-NC-SA。

**许可用语说明**：带有 NonCommercial 条款的许可证不符合 OSI 对“开源软件”的定义；本项目是可阅读、可修改、可用于符合许可条件的非商业场景的**开放源码／source-available** 项目，而非 OSI 意义的 open-source software。项目不提供法律建议。

---

## English

### What is this?

**Case Trajectories (立论星轨)** is an experimental case-construction assistant grounded in **Debate Universal Grammar (DUG / 《辩论筑基》)**. It specializes in building a case that **structurally engages** the opposing side rather than merely asserting one's own position or assembling preemptive rebuttals. It is not a general debate coach, evidence database, automated judge, or win predictor.

**Structural Clash Case Construction** means anticipating and taking seriously what may be reasonable in the opponent's case *while constructing your own case*. Instead of removing those considerations, the debater seeks an explanatory frame, criterion, or higher-order reason that can accommodate both sides, **absorb or reverse** the implications of the opponent's valid points, and explain why the overall answer still supports the chosen position.

The distinctions matter:

- **Accommodation is not erasure.** Recognize the other side's genuine facts, interests, values, or concerns; do not redefine them away, misappropriate their benefits, or simply exclude inconvenient cases.
- **Concession is not surrender.** The purpose is to integrate competing reasons and develop a more comprehensive answer through a meaningful perspective or key reason (often represented as B′).
- **More than point-by-point rebuttal.** Structural Clash may operate at the level of arguments, evaluative criteria, values, and whole case architectures. A proposed relationship does not by itself prove that every component succeeds.
- **No universal formula.** The framing must remain understandable, preserve room for exceptions, and offer a substantive rationale for any change in explanatory priority or conclusion.

A conceptual sketch is **our case X + their case Y → an integrating perspective/reason B′ → our conclusion C after engagement**. This represents a mode of reasoning, not a mechanical scoring procedure or an assertion that all opposing arguments are false.

**Conceptual references within DUG**: C204–C206, C254, C281–C283, C390, C395, C403, and C504–C505. The four-step software workflow is one supporting implementation, not a compulsory statement of DUG theory.

### Four-step workflow

1. **Enumerate arguments**: identify possible opposing arguments through independent model samples, cluster semantically similar proposals, and display within-run mention counts. Finite sampling cannot guarantee exhaustive coverage.
2. **Analyze commonalities**: explore shared premises, values, observations, and concerns underlying multiple opposing arguments; optional branches describe the opponent's underlying ideas.
3. **Analyze responses**: explore what can be acknowledged, how it might be **absorbed or reversed**, and why it could support our conclusion. Preserve alternative response paths and related underlying ideas.
4. **Find a framing entry**: for each specific response path, work backward to a natural introduction from the motion and its ordinary meaning, turning the response into a coherent case narrative.

Explore results in **the relationship tree, narrative view, and interactive star view**. Review historical runs, edit candidates, preserve alternatives, inspect stale relationships, and export **JSON, Markdown, or self-contained HTML** reports.

### Get started

Open the repository-root **index.html** in a modern browser on desktop or mobile. The page contains its UI, scripts, sample material, font subset, and artwork; it does not need a CDN to display.

The included demonstrations are **hand-authored examples, not live model samples**. To generate new analyses, supply your own model endpoint, API key, and model settings (DeepSeek, GLM, Kimi, OpenAI, or a compatible API). Calls may incur charges and are generally sent **directly from your browser** to the selected provider. The provider must permit the browser's cross-origin requests; serving the page over local HTTP alone does not override CORS.

Supported structured exports from **Cognitive Atlas (认知星图)** may be imported, subject to format and source-data requirements. Cognitive Atlas is a **separate application**; importing its output does not bundle the application here.

### Privacy, limitations, and data

History and non-secret preferences are stored locally in the browser. Back up projects by exporting JSON; browser storage can be cleared or device-specific. API keys are kept in page memory and are not intentionally included in normal project/report exports. Submitted debate material is transmitted to whichever external API you configure.

Sample mention counts are **not** population frequencies, truth probabilities, argument quality, or chances of winning. Generated explanations and scholarly references need independent verification. Exported projects and diagnostic bundles may contain user material and full model responses: **review them before sharing**. This application does not score debates, establish proofs, or guarantee that a proposed structural response works.

### Build from source

The editable source is in **src/**. Build the release with the dependency-free Node.js wrapper **build-release.cjs**:

~~~bash
node build-release.cjs
~~~

The script runs the original **build.mjs**, checks that all three generated aliases are byte-identical, writes the public **index.html** at repository root, and records SHA-256 checksums in **RELEASE-MANIFEST.json**. Rebuild and browser-test after any source changes. A successful build does not establish live-provider interoperability or model-output quality.

### License and attribution

© 2026 **精靈 Moon**. Original project content is released under **Creative Commons Attribution–NonCommercial–ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. See [LICENSE](LICENSE) (the complete Creative Commons legal code), [LICENSE-NOTICE.md](LICENSE-NOTICE.md) (project attribution and scope), and the [official license page](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en). Credit the author, link the license, indicate modifications, respect the NonCommercial condition, and use a compatible ShareAlike license for distributed adaptations.

The embedded **Source Han Serif** font subset remains under the **SIL Open Font License 1.1**, not CC BY-NC-SA. See [FONT-LICENSE.txt](FONT-LICENSE.txt) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

**Terminology note:** NonCommercial restrictions mean this source-available project is **not “open-source software” under OSI's definition**, even though its source can be inspected and modified under the stated conditions.

---

**Case Trajectories · Based on Debate Universal Grammar · 精靈 Moon · 2026**
