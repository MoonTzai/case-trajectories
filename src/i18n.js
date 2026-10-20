/* UI strings only. Project content, IDs and provider model IDs are never translated. */
(function(global){
  'use strict';
  const pairs=`
本环节已经进行过一次分析，再次点击将进行追加分析，可能导致包括但不限于环节内容衔接错乱等未知Bug，你确定要再次分析吗？如果要进行下一个环节，请进入下一环节后再点击对应分析按钮|This stage has already been analyzed once. Running it again will perform additional analysis and may cause unknown bugs, including inconsistencies between stages. Are you sure you want to analyze it again? To proceed to the next stage, enter that stage and click its analysis button.
✧ 星轨视图|✧ Startrack view
星轨视图|Startrack view
离线查看星轨视图、路径树、叙事流程和节点详情，可切换深浅主题。|Read the Startrack view, path tree, narrative and node details offline, in light or dark mode.
辩论筑基·立论星轨|Case Trajectories
结构性交锋立论·辅助工具|Structural Clash · Case Construction Assistant
谁还在傻傻地只考虑我方！|Still thinking only about your own side?
结构性交锋，从立论开始！|Structural clash starts with case construction!
主页|Home
导出|Export
导出Debug|Export Debug
引用编号与复核记录|Reference IDs and review record
短编号只用于模型请求，项目与历史仍保留原始编号。修正记录不会覆盖模型原文。|Short IDs are used only in model requests; the project and history keep their original IDs. Corrections do not overwrite the raw reply.
引用关系复核（最多一次）|Checking references (one review maximum)
聚合归属复核（最多一次）|Checking cluster assignments (one review maximum)
引用复核未完整返回修正表|The reference review did not return a complete correction table
引用复核包含未授权修改|The reference review attempted changes outside the flagged reference fields
引用复核给出了未知、重复或越界的编号|The reference review returned unknown, duplicate or out-of-scope IDs
引用复核路径无效|Invalid reference-review path
引用复核路径不存在|Reference-review path does not exist
引用复核后仍有无效编号|Invalid reference IDs remain after review
引用错误过多或没有可选来源，无法定向复核|There are too many reference errors or no eligible sources for a targeted review
包含本会话各轮记录与模型原文，密钥已脱敏|Includes every round in this session and raw model replies; credentials are redacted
已导出 Debug，包含本会话各轮记录、请求诊断与辩题内容，已脱敏密钥。|Debug exported with all session rounds, request diagnostics and debate content; credentials are redacted.
输出上限不是上下文容量，也不是每次必用的 Token 数。DeepSeek 预填 393216（384K），适配 1M 上下文；思考可能占用输出预算。持续接收数据时不会因总耗时超过 120 秒而停止。|The output limit differs from context capacity and actual usage. DeepSeek defaults to 393216 (384K) for its 1M context; reasoning may share this budget. Responses that keep receiving data are no longer stopped after 120 seconds of total time.
手填参数不能与上方输出上限或思考控件重复。清空输出上限则使用服务默认值。仅保存地址、型号和允许的请求参数；密钥不会写入本机存储。|Manual parameters must not duplicate the output or thinking controls. Leave the limit blank to use service defaults. Only the endpoint, model and allowed parameters are saved; keys are not persisted.
已将 DeepSeek 旧版预填的 8192 输出上限更新为 393216（384K）；1M 是上下文容量。上限不代表实际消耗，可在模型设置中调低。|The old DeepSeek default output limit of 8192 was updated to 393216 (384K); 1M is the context capacity. This is a ceiling, not actual usage; you can lower it in Model settings.
导出当前会话|Export current session
导出已完成的内容。报告用于阅读分享，JSON 用于备份和继续工作。|Export completed content. Use reports for reading and sharing, and JSON to back up and resume your work.
导出报告 .html|Export report .html
离线查看完整路径树、叙事流程和节点详情，可切换深浅主题。|Read the complete path tree, narrative flow and node details offline, in light or dark mode.
导出文本 .md|Export text .md
便于复制、整理和继续写稿。|Copy, organize and continue drafting.
导出会话 .json|Export session .json
保留候选、来源、频次和历史，可重新导入继续工作。|Keep candidates, sources, frequencies and history. Import again to resume work.
不包含模型连接设置或 API Key。|Model connection settings and API keys are excluded.
模型仍在运行。停止运行并返回主页？已完成的内容会保留。|A model is still running. Stop and return home? Completed content will be kept.
正在停止模型请求，请稍后再返回。|Model requests are stopping. Please try returning home in a moment.
已导出报告，可离线阅读。|Report exported for offline reading.
辩论筑基·结构性交锋立论·辅助工具|Structural Clash Case Construction Assistant
预览版|Preview
工作区导航|Workspace navigation
深色|Dark
浅色|Light
切换到深色主题|Switch to dark theme
切换到浅色主题|Switch to light theme
本地工作区|Local workspace
历史会话|Session history
导入|Import
导出项目|Export project
模型设置|Model settings
⚙ 模型设置|⚙ Model settings
从对方的理由出发，探索可以承接、消化与反转的路径。|Start with the opposing arguments and explore ways to accept, absorb or reverse them.
课程案例 · 社交媒体|Course example · Social media
原演示 · 大城市发展|Original example · City life
载入演示|Load example
开始新辩题|Start a new motion
当前辩题|Current motion
编辑辩题|Edit motion
关于这组演示内容|About this example
▦ 分步工作台|▦ Step-by-step workspace
⑂ 路径树|⑂ Path tree
路径树|Path tree
底层观念自动生成 · 独立支线|Automatic underlying ideas analysis · Independent branches
保留路径|Saved paths
穷举论点|Enumerate arguments
对方论点|Opposing arguments
独立采样 · 聚合与溯源|Independent samples · Clustering & sources
采样|Samples
样本|Sample
并发|Concurrency
全选|Select all
合并|Merge
＋ 补充|＋ Add
论点共性|Argument commonalities
找到对方可以承接的部分|Find what the opposing arguments share
分析共性|Analyze commonalities
可同时保留多个候选|Keep multiple candidates
清除选择|Clear selection
消化／反转|Digestion / Reversal
针对具体论点共性，分别展开转换|Respond to shared content: absorb it or turn it in our favor
处理分析|Analyze responses
按论点共性分组 · 处理分析覆盖全部|Grouped by commonality · Analysis covers all
只看所选论点共性|Show selected commonalities
查看全部论点共性|Show all commonalities
仅看勾选论点共性|Show selected commonalities
停止|Stop
关闭错误提示|Dismiss error
重新聚合已完成的采样|Recluster completed samples
重试失败采样|Retry failed samples
项目保存在当前浏览器|Project saved in this browser
只有对方论点统计采样频率|Sample frequency applies only to opposing arguments
导出阅读版 ↗|Export reading copy ↗
导出阅读版|Export reading copy
节点详情|Node details
关闭详情|Close details
关闭|Close
供应商|Provider
选择供应商，再确认地址与型号。只有点击查询或生成时才会联网；密钥只保留在当前页面。|Choose a provider and check its endpoint and model. Requests run only when you click query or generate. Keys stay in this page's memory.
API 地址|API endpoint
模型名称|Model ID
可手动填写模型 ID|Enter a model ID manually
当前供应商与端点，仅本页保留|For this provider and endpoint; this page only
查询可用模型|Query models
停止查询|Stop query
筛选模型|Filter models
筛选模型名称或提供方|Filter by model ID or owner
模型列表|Model list
官方说明 ↗|Official documentation ↗
输出上限（可选）|Output token limit (optional)
留空使用服务默认|Leave blank for the service default
思考模式|Reasoning mode
模型默认|Model default
开启思考|Enable reasoning
关闭思考|Disable reasoning
较高强度|Higher effort
最低强度（不能关闭）|Lowest effort (always on)
高级请求参数|Advanced request parameters
请求 JSON 输出模式（接口需支持）|Request JSON mode (requires endpoint support)
额外参数 JSON|Additional parameters (JSON)
例如 {"temperature": 0.7}|Example: {"temperature": 0.7}
例如 {"max_tokens": 8192}|Example: {"max_tokens": 8192}
取消|Cancel
保存设置|Save settings
开始一个新辩题|Start a new motion
编辑当前辩题|Edit current motion
辩题|Motion
例如：年轻人应不应该去大城市发展|Example: Should young people move to major cities?
正方持方|Affirmative position
反方持方|Negative position
正方主张|Affirmative claim
反方主张|Negative claim
我方持方|Our side
正方|Affirmative
反方|Negative
讨论情境或观众（可选）|Context or audience (optional)
补充适用人群、情境或既定讨论范围|Add the audience, context or agreed scope
新项目使用你配置的模型。开始生成前不会发起请求。|New projects use your configured model. No requests are sent until you start an operation.
创建工作区|Create workspace
另建修订项目|Create revised project
编辑候选|Edit candidate
修改会保留旧版本，并将相关后续候选标为待复核。|Edits preserve previous versions and mark dependent candidates for review.
保存修改|Save changes
拆分论点簇|Split argument cluster
勾选要分入新论点的原始条目，其余条目保留为另一组。|Select source entries for one new argument; the rest will form a second group.
拆成两组|Split into two groups
内置演示|Built-in example
模型模式|Model mode
点击操作时才会请求模型|Model requests run only when you start an operation
课程案例 · 人工改编 · 非真实采样|Course example · Adapted manually · Synthetic samples
人工预置演示|Manually prepared example
人工预置演示样本|Synthetic example samples
有效采样|Valid samples
人工演示|Manual example
模型项目|Model project
待复核|Needs review
手工补充|Manually added
共同基础|Shared basis
共同承接点|Shared starting point
消化候选|Digestion candidate
反转候选|Reversal candidate
消化|Digestion
反转|Reversal
承认什么|What we accept
如何消化|How it is absorbed
如何反转|How it is reversed
我方判断|Our conclusion
针对的论点共性|Target commonalities
针对的论点共性 · 联合处理|Target commonalities · Combined response
对方底层观念|Opponent's underlying ideas
我方底层观念|Our underlying ideas
对方底层观念 ↗|Opponent's underlying ideas ↗
我方底层观念 ↗|Our underlying ideas ↗
详情 ↗|Details ↗
独立支线|Independent branch
查看底层观念 ↗|View underlying ideas ↗
正在自动分析…|Analyzing underlying ideas automatically…
本项分析未完成，可单独重试。|This analysis did not finish. Retry this item separately.
内容变化后需更新|Update needed after content changed
本次没有找到合适解释。|No suitable interpretation was found.
这条旧记录尚无底层观念分析，可打开后补齐。|This older record has no underlying ideas analysis yet. Open it to add one.
处理全部论点共性 →|Analyze all commonalities →
处理全部论点共性|Analyze all commonalities
这个论点共性尚无转换方向。点击处理分析，会覆盖全部已有论点共性。|No response exists for this commonality yet. Analyze responses to process all current commonalities.
先勾选一个具体论点共性|Select a commonality to filter the view
先找到论点共性|Find commonalities first
右侧会按勾选的论点共性分别展开对应方向，也可切换查看全部论点共性。|The view is filtered by the checked commonalities. You can also show all of them.
每条消化／反转会归在它实际处理的论点共性下。|Each response appears under the commonalities it actually addresses.
先听见对方的理由|Start with the opposing reasons
填写辩题并配置模型，独立采样后聚合主要论点。|Enter a motion and configure a model to independently sample and cluster arguments.
寻找共同的承接点|Find shared starting points
选择左侧论点，分析它们可能共享的事实、前提或价值。|Select arguments to identify shared facts, premises or values.
打开不同的转换方向|Explore alternative responses
选择论点共性，探索可以消化或反转的候选路径。|Explore candidate ways to absorb or reverse the shared content.
穷举的对方论点|Enumerated opposing arguments
点击论点查看理由；编号对应下方各项论点共性的关联。|Click an argument to inspect its reasoning. IDs match the commonality links below.
尚未穷举论点|No arguments yet
每个论点共性可以展开不同转换方向。紫色分叉是解释终点；共享节点保留同一编号，选择不会丢掉其它路径。|Each commonality can lead to alternative responses. Purple branches are terminal interpretations. Shared nodes keep the same ID across paths.
此方向同时关联其它论点共性，可从对应路径访问。|This response also links to other commonalities and can be reached from those paths.
尚未展开|No responses yet
点击处理分析，覆盖全部已有论点共性。|Click Analyze responses to process all current commonalities.
方案树会在这里生长|Your path tree will appear here
先穷举对方论点并分析共性，再从各项论点共性展开转换方向。|Enumerate opposing arguments, analyze commonalities, then explore responses.
支线终点|Terminal branch
随对应结果自动分析；只解释当前候选，不进入后续主线。|Generated automatically after the linked result. It explains that candidate without feeding later mainline stages.
锚点已变化，这份解释需要更新。|The linked candidate has changed; this interpretation needs updating.
关联依据：|Basis for the connection: 
待核实来源：|Unverified source: 
可以探索价值观、世界观、认识论或思想传统等多种解释。|Explore values, worldviews, epistemology and intellectual traditions as possible interpretations.
重新分析这条支线|Reanalyze this branch
补齐本项底层观念|Add underlying ideas analysis
来源|Source
样本提及情况|Sample mentions
手工补充，不计采样频率|Manually added; excluded from sampling frequency
论点理由|Argument reasoning
适用限定|Scope and conditions
原始条目与采样来源|Original entries and sample sources
查看采样记录 ↗|View sampling records ↗
查看完整原始回复|View full raw response
本条没有模型采样来源。|This item has no model-sampling source.
与论点的关联|Links to arguments
承认对方什么|What we accept from the opponent
转换理由|Reasoning behind the response
可能导向的我方判断|Potential conclusion for our side
成立条件／仍需补足|Conditions / remaining gaps
关联论点共性|Linked commonalities
方向提示|Direction hints
启发式标签，不代表转换已经成立。|Heuristic labels do not establish that a response succeeds.
编辑内容|Edit content
保留这条路径|Save this path
取消保留|Unsave
已人工复核|Mark as reviewed
保留的路径|Saved paths
保留不同的可能|Keep alternative possibilities
收藏的路径属于当前会话，切换后可从历史会话找回。|Saved paths belong to this session and remain available in session history.
查看路径 ↗|View path ↗
还没有保留路径|No saved paths yet
点击转换卡片上的菱形，收藏想继续考虑的方向。|Click a response card's diamond to save it for further consideration.
查看旧节点|View previous nodes
旧节点与待复核记录|Previous nodes and items needing review
旧版本|Previous version
没有旧节点。|No previous nodes.
采样与聚合记录|Sampling and clustering records
保留每一份原始回复|Every raw response is retained
有效空样本计入分母；失败或停止的样本不计入。重试沿用原样本编号。|Valid empty samples count in the denominator. Failed or cancelled samples do not. Retries keep the original sample ID.
完成|Complete
失败|Failed
已停止|Stopped
待执行|Queued
执行中|Running
本批次聚合映射|Cluster mapping for this batch
尚未收到完整回复。|No complete response received yet.
先填写模型接口和模型名称。|Enter an API endpoint and model ID first.
这个项目已有另一套模型配置的采样。请恢复原设置，或新建项目，避免混算频率。|This project already has samples from another configuration. Restore it or start a new project to keep frequency counts comparable.
准备中…|Preparing…
已完成|Completed
已完成，部分底层观念待补齐|Completed; some underlying ideas analyses need retrying
本次操作未完成|Operation incomplete
已停止，完成的内容已保留。|Stopped. Completed results have been retained.
等待首个响应…|Waiting for the first response…
正在接收思考内容…|Receiving reasoning…
正在接收回复…|Receiving output…
语义聚合|Semantic clustering
重新聚合|Recluster
重试未完成采样|Retry incomplete samples
并发探索对方论点|Enumerating opposing arguments
独立采样|Independent sampling
没有有效采样。请检查接口设置，或重试失败采样。|No valid samples. Check your settings or retry failed samples.
还没有可聚合的有效采样。|There are no valid samples to cluster yet.
已停止，可单独重试。|Stopped. You can retry this item.
补齐演示底层观念|Complete example underlying ideas analyses
本次没有新增不同的论点共性候选。|No distinct new commonality candidates were added.
请先分析论点共性。|Analyze argument commonalities first.
当前方向较多，可能消耗较多Token，确认继续吗？|There are many directions to process, which may consume more tokens. Continue?
解释对方底层观念|Interpreting the opponent's underlying outlook
解释我方底层观念|Interpreting our underlying outlook
手工补充论点|Add an argument manually
论点|Argument
理由|Reasoning
限定|Conditions
论点共性标题|Commonality title
类型|Type
说明|Explanation
方向标题|Response title
承认内容|Accepted content
合并后的论点标题（只合并语义确实相同的内容）|Title for the merged argument (merge only equivalent claims)
手工论点与采样论点分开保留，避免混算频率。|Keep manual and sampled arguments separate so frequency counts remain valid.
已合并，相关后续候选标为待复核。|Merged. Dependent candidates are marked for review.
已打开历史会话，可以继续。|Session restored. You can continue.
已导出项目，包含候选、来源与底层观念支线。|Project exported with candidates, sources and underlying ideas branches.
已载入演示；原会话保留在历史中。|Example loaded. Your previous session remains in history.
正在停止…|Stopping…
修改已保存。|Changes saved.
请选择部分条目，确保两组都非空。|Select some entries so both groups remain non-empty.
已拆为两组，可分别编辑表述。|Split into two groups. You can edit each separately.
项目文件大于40MB。|The project file exceeds 40 MB.
当前正在生成，请等待完成或停止后再导入。原会话未切换。|Generation is running. Wait or stop it before importing. The current session has not changed.
已导入为新会话副本；原会话及后续修改仍在历史中。|Imported as a new session copy. The original session and its newer edits remain in history.
项目已导入。API密钥需在本页另行填写。|Project imported. Enter your API key separately in this page.
部分旧会话无法迁移，原始记录已保留。可先导出仍能打开的项目。|Some older sessions could not be migrated. Original records are retained; export any readable projects first.
模型设置已保存；密钥仅保留在本页。|Settings saved. The key remains only in this page's memory.
未保存|Not saved
保存失败，请导出项目备份|Save failed; export a backup
已保存到本地历史会话|Saved in local session history
已取消保留|Path unsaved
已保留这条路径|Path saved
当前会话|Current session
时间未知|Unknown time
查找会话|Find a session
搜索名称、辩题或持方|Search title, motion or position
继续此前的论点树、选择和解释。保存在本浏览器，可导出 JSON 备份。|Continue an earlier argument tree, selections and interpretations. Sessions stay in this browser and can be exported as JSON.
没有匹配的会话。|No matching sessions.
没有匹配的本地会话|No matching local sessions
会话记录不存在。|The session record is missing.
回到当前会话|Return to current session
打开并继续|Open and continue
导出 JSON|Export JSON
重命名|Rename
删除|Delete
论点共性预览|Commonality preview
尚未分析论点共性，可继续之前的步骤。|No commonalities yet. Continue the earlier steps.
会话名称（不改变辩题或论点）|Session title (does not change the motion or arguments)
请输入会话名称|Enter a session title
地址已更改；查询将使用当前地址。|Endpoint changed. The next query will use this address.
密钥已更改，需重新点击查询。|Key changed. Click query again to refresh.
已停止查询，可手填型号。|Query stopped. You can still enter a model manually.
正在查询当前接口的模型列表…|Querying models from the current endpoint…
查询完成。选择型号会填入上方模型名称。|Query complete. Selecting a model fills the model ID above.
接口未返回可识别型号，仍可手动填写。|No recognized models returned. You can still enter one manually.
模型默认不额外发送思考参数；开启与关闭按当前预置型号的官方接口映射。|Model default sends no extra reasoning parameter. On/off controls use documented mappings for the preset model.
此型号未预设思考参数。请选择“模型默认”，需要时按官方文档在高级参数中手填。|No reasoning mapping is preset for this model. Use Model default, or enter documented parameters under Advanced settings.
该型号始终思考；本工具将两档映射为 high / low。模型默认不发送此参数。|This model always reasons. The two options map to high / low. Model default sends no effort parameter.
向当前 API 地址发送一次 GET /models|Send one GET /models request to the current endpoint
请填写有效地址；GLM 官方列表接口未核实，可手填型号|Enter a valid endpoint. GLM's official model-list API is unverified; enter a model manually.
手填参数不能与上方输出上限或思考控件重复。新建官方配置预填 8192，可自行调整；思考可能占用此上限，截断时需提高后重试。清空则使用服务默认值，部分模型默认值较大。仅保存地址、型号和允许的请求参数；密钥不会写入本机存储。|Do not duplicate the token limit or reasoning controls in JSON. New official profiles start at 8192 tokens; adjust as needed. Reasoning may share this budget. A blank limit uses the service default. Only the endpoint, model and allowed parameters are saved; keys are never stored locally.
无法读取本机设置；仍可在当前页面填写。|Local settings could not be read. You can still enter them for this page.
部分旧设置无效，已恢复该供应商默认值。|Some old settings were invalid. That provider's defaults have been restored.
旧模型设置无法读取，已恢复默认值。|Old model settings could not be read. Defaults have been restored.
无法更新本机设置；请在保存时重试。|Local settings could not be updated. Try saving again.
请先填写有效的 API 地址，再输入密钥|Enter a valid API endpoint before entering a key
请填写 API 地址和模型名称|Enter an API endpoint and model ID
本机设置保存失败；配置尚未更改，请检查浏览器存储空间|Settings could not be saved. The active configuration is unchanged. Check browser storage.
工作区已创建，配置模型后即可穷举论点。|Workspace created. Configure a model to enumerate arguments.
已创建修订项目，旧项目可从本地历史恢复。|Revised project created. The previous project remains in session history.
智谱 GLM|Zhipu GLM
Kimi / Moonshot 中国站|Kimi / Moonshot China
自定义 OpenAI 兼容接口|Custom OpenAI-compatible endpoint
流式接收（显示实时输出统计）|Stream responses (live output statistics)
界面语言切换不改写辩题与已有结果。|Switching UI language does not rewrite the motion or existing results.
AI推测|AI inference
AI推测（教学改编）|AI inference (teaching adaptation)
未核实|Unverified
批次|Batch
API Key 含内部空白或非英文字符，请重新复制|The API key contains internal whitespace or non-ASCII characters. Copy it again
请填写有效的 API 地址|Enter a valid API endpoint
API 地址不能包含凭据、查询参数或片段|The API endpoint cannot include credentials, query parameters or fragments
API 地址需使用 HTTPS；本机 localhost 可使用 HTTP|Use HTTPS for the API endpoint, or HTTP for localhost
seed 必须为整数|seed must be an integer
reasoning_effort 无效|Invalid reasoning_effort
enable_thinking 必须为布尔值|enable_thinking must be a boolean
thinking 仅允许 type 和可选 budget_tokens|thinking accepts only type and optional budget_tokens
thinking.budget_tokens 无效|Invalid thinking.budget_tokens
接口地址格式无效|Invalid endpoint URL
接口地址不能包含凭据、查询参数或片段|The endpoint cannot include credentials, query parameters or fragments
接口需要 HTTPS，本机服务可使用 HTTP|Use HTTPS, or HTTP for a local service
模型返回空事件流|The model returned an empty stream
模型事件流含无效 JSON|The model stream contained invalid JSON
模型事件流报告错误|The model stream reported an error
模型回复过长|The model response is too long
模型事件过长|A model stream event is too long
模型事件流未完整结束|The model stream ended prematurely
接口未返回有效 JSON|The endpoint did not return valid JSON
接口返回模型错误；请检查设置|The endpoint returned a model error; check your settings
接口回复缺少 choices|The response is missing choices
模型输出达到长度上限，结果未接收；请增加输出上限或缩小输入|Output was truncated and has not been accepted. Increase the token limit or reduce the input
模型请求超过 120 秒，已停止；可减少输入或稍后手动重试|The request exceeded 120 seconds and was stopped. Reduce the input or retry later
模型查询超时，可稍后手动重试|Model query timed out; retry later
已停止模型查询|Model query stopped
此官方端点的模型列表接口尚未核实，请手动填写型号或查看官方目录|The model-list API at this official endpoint is unverified. Enter a model ID or check its documentation
当前浏览器不支持 fetch|This browser does not support fetch
模型查询地址发生重定向，请直接填写最终接口地址|The model query was redirected. Enter the final endpoint directly
模型列表响应过大|The model-list response is too large
模型查询未返回有效 JSON|The model query did not return valid JSON
模型列表响应格式无法识别|Unrecognized model-list response format
思考模式无效|Invalid reasoning mode
此型号的思考参数未预设，请选择“模型默认”并按服务文档填写额外参数|This model has no preset reasoning parameters. Select Model default and enter documented parameters manually
输出上限须为 1–1048576 的整数|The output token limit must be an integer from 1 to 1048576
输出上限在控件与额外参数中重复，请只填一处|The output token limit is set twice. Use either the control or the JSON parameters
思考模式与额外思考参数重复；请选择模型默认后再手填|Reasoning controls conflict with JSON parameters. Select Model default before entering parameters manually
两种输出上限不可同时填写|Do not set both output token limit parameters
模型配置必须为对象|Model configuration must be an object
输出上限无效|Invalid output token limit
额外参数必须是 JSON 对象|Additional parameters must be a JSON object
额外参数必须为 JSON 对象|Additional parameters must be a JSON object
额外参数不是有效 JSON|Additional parameters are not valid JSON
请求失败|Request failed
模型回复不是完整 JSON；保留原始回复后可重新分析|The model response is not complete JSON. The raw response has been retained for inspection before retrying
模型查询连接失败；检查网络及接口是否允许浏览器跨域访问，也可手填型号|Model query connection failed. Check the network and browser CORS access, or enter a model ID manually
查看完整原始回复|View the complete raw response
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return[line.slice(0,i),line.slice(i+1)];});
  const catalog=Object.fromEntries(pairs);
  Object.assign(catalog,{"使用 DeepSeek API Key。思考开关映射为 thinking；模型与地址可手动修改。": "Use a DeepSeek API key. Reasoning controls map to thinking. You can edit the model and endpoint.", "使用模型标准 API Key；Coding Plan 凭据不等于普通 API 权限。GLM-5.3 始终思考，“关闭”对应最低强度。官方模型查询接口未核实，可手填型号。": "Use a standard API key. Coding Plan credentials do not imply standard API access. GLM-5.3 always reasons; the lowest effort replaces off. Its official model-list endpoint is unverified; enter a model manually.", "使用中国站 API Key，不能与国际站混用。K3 始终思考，“关闭”对应最低强度；K2.6 支持关闭。": "Use a China-region API key; international keys are separate. K3 always reasons, with low effort replacing off. K2.6 supports disabling reasoning.", "预填已核实支持 Chat Completions 的 GPT-5.4 mini。ChatGPT / Codex 中可用不代表当前 API Key 有权限；查询结果仍须符合本工具的文本接口。": "GPT-5.4 mini is prefilled as a documented Chat Completions model. Availability in ChatGPT or Codex does not grant API access. Queried models must support this tool’s text interface.", "填写服务提供方的 Base URL（通常含 /v1）或完整 /chat/completions 地址。查询尝试当前地址的 /models；不支持查询时仍可手填型号。": "Enter your provider’s Base URL (usually including /v1) or full /chat/completions URL. Queries use /models at that endpoint. Manual model entry remains available.", "AI推测 · 人工预置演示": "AI inference · Manually prepared example", "材料明示": "Explicit in the material", "转换方向": "Responses", "演示样本": "Example samples", "已完成采样": "Completed samples", "关闭历史会话": "Close session history", "已保存会话": "Saved sessions", "选择演示案例": "Choose an example", "切换界面语言": "Switch UI language", "采样份数": "Number of samples", "并发数": "Concurrent requests", "视图": "View", "三步出论工作台": "Three-step workspace", "多路径方案树": "Alternative paths", "辩论筑基·结构性交锋立论·辅助工具导航": "Case builder navigation", "请求参数无效": "Invalid request parameters", "旧论点": "Previous argument", "旧论点共性": "Previous commonality", "流式接收（显示实时输出统计）": "Stream responses (live output statistics)"});
  Object.assign(catalog,Object.fromEntries(`导入项目|Import project
底层观念是辅助解释|Underlying ideas provides supporting interpretation
立论步骤|Case construction steps
对方会提出哪些理由？|What reasons might they give?
这些理由共享什么？|What do these reasons share?
如何消化或反转这些共性？|How can we absorb or reverse them?
第1步 · 准备对方的理由|Step 1 · Gather opposing reasons
对方会提出哪些论点？|What arguments might the other side make?
先获得并检视对方论点，勾选你要带入共性分析的内容。|Gather and review opposing arguments. Select those to include in commonality analysis.
个对方论点|opposing arguments
演示已备好全部结果，可依次查看3个步骤。|This example contains all results. Explore the three steps in order.
从哪里获得对方论点？|Where should the arguments come from?
让模型穷举，或复用认知星图已经整理好的论点与频次。|Ask a model to enumerate them, or reuse arguments and frequencies from Cognitive Landscape.
导入认知星图结果|Import Cognitive Landscape results
勾选要带入下一步的对方论点。可先全选，再排除不相关内容。|Select the arguments for the next step. Start with all, then remove irrelevant items.
演示样本提及|Example sample mentions
样本提及|Sample mentions
带入下一步|Use in next step
查看完整内容 ↗|View full content ↗
选好对方论点后，进入下一步寻找它们共享的内容。|After selecting arguments, explore what they share in the next step.
进入第2步：分析共性 →|Step 2: Analyze commonalities →
第2步 · 寻找共同承接点|Step 2 · Find shared starting points
哪些内容贯穿了多个对方论点？|What content runs through several opposing arguments?
以勾选的论点为输入，保留多种共性候选。每张卡片都列出它承接的论点。|Analyze the selected arguments and retain alternative commonalities. Each card identifies the arguments it addresses.
输入|Input
个已选论点|selected arguments
个共性候选|commonality candidates
每张卡片是一种共性候选；下方列出它承接的具体论点。下一步会处理这里的全部候选。|Each card proposes one commonality and lists its linked arguments. The next step processes all these candidates.
它承接的对方论点|Opposing arguments it addresses
查看它的处理结果 →|View its responses →
↳ 理解背后的观念|↳ Understand the underlying outlook
辅助解释|Supporting interpretation
← 回到对方论点|← Back to opposing arguments
进入第3步：处理分析 →|Step 3: Analyze responses →
第3步 · 形成我方处理|Step 3 · Develop our responses
如何承认这些共性，并导向我方判断？|How can we accept the shared content and reach our conclusion?
处理全部共性，分别看清“承认什么 → 如何转换 → 我方判断”，保留值得继续发展的路径。|Process all commonalities. Follow acceptance → redirection → our conclusion, and save promising paths.
项全部共性|commonalities (all)
个处理候选|response candidates
查看哪些结果|Show results for
全部论点共性|All commonalities
仅筛选显示，不改变处理范围|Filters the view; processing still covers all
对这项共性的处理|Responses to this commonality
从这项论点共性出发|Starting from this commonality
从这项论点共性出发 · 联合处理|Starting from these commonalities · Combined response
① 承认对方什么|① What we accept from the other side
② 怎样反转|② How we turn their reason in our favor
② 怎样消化|② How we absorb their reason
③ 导向我方什么判断|③ The conclusion for our side
成立条件|Conditions for this to hold
← 回到论点共性|← Back to commonalities
查看完整路径树 →|View the complete path tree →
已保留 · 取消|Saved · Unsave
先在第2步分析共性，再到这里寻找我方的处理方式。|Analyze commonalities in Step 2, then develop our responses here.
尚无处理结果。点击本页上方“处理分析”，会处理全部论点共性。|No responses yet. Use Analyze responses above to process all commonalities.
先检视全部论点，再沿下方连线查看每种共性及其处理。|Review the arguments, then follow the connections to each commonality and its responses.
主线：对方论点 → 论点共性 → 消化／反转|Main path: opposing arguments → commonalities → digestion / reversal
紫色支线：理解背后的观念|Purple branches: underlying outlooks
这些对方论点|These opposing arguments
共享|share
可处理为|possible responses
原始采样尚未完整|Original sampling is incomplete
原始采样已完成|Original sampling completed
计划|Planned
有效|Valid
其中空样本|Including empty samples
缺失|Missing
来源提示（保留原文）|Source notes (original text)
中立观察采样|Sampled from a neutral perspective
持方立场采样|Sampled from that side's perspective
先在第1步勾选论点，再分析它们可能共享的事实、前提或价值。|Select arguments in Step 1, then analyze the facts, assumptions or values they may share.
同一结果也处理其他共性；相同编号表示同一个候选。|This response addresses other commonalities too. Matching IDs indicate the same candidate.
到第3步以全部共性为输入寻找处理候选；部分共性可能暂时无合适结果。|Use all commonalities as input in Step 3. Some may not yield a suitable response yet.
已接入认知星图，可直接分析共性。|Imported from Cognitive Landscape. You can analyze commonalities now.
先在模型设置中连接模型，或导入已有结果。|Connect a model in Model settings, or import existing results.
模型：|Model: 
已接入认知星图|Imported from Cognitive Landscape
来源是演示样本，频次仅用于演示。|The source uses synthetic examples. Frequencies are illustrative only.
频次沿用所选论点池的有效样本，未重新采样。|Frequencies use valid samples from the selected source pool. No resampling occurred.
另建项目重新穷举|Enumerate again in a new project
接入认知星图的论点|Import Cognitive Landscape arguments
在认知星图中导出“报告 .html”或历史会话 JSON，然后选择文件。保留原论点聚合、样本来源和频次，不再调用模型穷举。|Export a report .html or session JSON from Cognitive Landscape, then choose the file. Existing clusters, sources and frequencies are retained without a new model call.
认知星图文件|Cognitive Landscape file
这次我要为哪一方立论？|Which side am I building a case for?
接入哪个对方论点池？|Which opposing argument pool should be imported?
将建立一个新会话，原会话保存在历史中。背景、攻击、公共价值与思想传统不作为对方论点导入。|A new session will be created; your current session remains in history. Backgrounds, attacks, public values and intellectual traditions are not imported as opposing arguments.
接入并检视论点 →|Import and review arguments →
先确认我方持方，再选择对方论点池。|Choose your side first, then select the opposing argument pool.
报告没有这一方的独立论点池。请检查持方，或在认知星图中补充该方采样。|The report has no independent argument pool for this side. Check your side selection or add that side's samples in Cognitive Landscape.
份有效样本|valid samples
部分样本未成功，频次仅使用成功样本。|Some samples failed. Frequencies count only successful samples.
所选论点池尚未完成有效聚合，不能直接导入频次。|The selected argument pool has no completed valid clustering, so its frequencies cannot be imported.
请选择我方持方|Choose our side
已接入认知星图。检视论点后，可直接进入分析共性。|Cognitive Landscape results imported. Review the arguments, then analyze commonalities.
认知星图导入|Cognitive Landscape import
认知星图文件过大或不是文本。|The Cognitive Landscape file is too large or is not text.
没有找到认知星图报告数据，请使用“导出报告 .html”或历史会话 JSON。|No Cognitive Landscape report data found. Use Export report .html or a session JSON file.
文件不是可读取的认知星图 HTML 报告或 JSON。|The file is not a readable Cognitive Landscape HTML report or JSON file.
当前支持认知星图第 4 版结构化报告，需包含原始采样。旧版报告和 Markdown 暂不支持直接接入。|Import requires a version 4 Cognitive Landscape report with original samples. Older reports and Markdown are not supported yet.
这份认知星图使用了尚未支持的采样协议。|This Cognitive Landscape report uses an unsupported sampling protocol.
报告缺少原始采样，无法核对论点来源和频次。|The report has no original samples to verify argument sources and frequencies.
报告的辩题或双方持方信息不完整。|The report is missing the motion or positions for both sides.
报告中没有独立的论点采样池。|The report contains no independent argument sampling pool.
请选择属于对方的论点池，不能把我方论点或攻击池当作对方论点。|Select the other side's argument pool, not our arguments or an attack pool.
所选论点池没有论点，无法继续分析共性。|This pool contains no arguments to analyze for commonalities.`.split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
  Object.assign(catalog,Object.fromEntries(`
视角切入|Framing the motion
⇢ 叙事流程|⇢ Narrative flow
叙事流程|Narrative flow
立论叙事流程|Case narrative flow
四步辩论筑基·结构性交锋立论·辅助工具|Four-step DUG case construction assistant
怎样从辩题引入这个视角？|How do we introduce this perspective from the motion?
分析全部切入|Develop entries for all responses
为每个处理候选倒推：怎样解读今天的辩题，让观众顺着理由进入这个视角。已有且未变化的切入会保留；也可以逐项分析。|Work back from each response to a reading of the motion that leads the audience into its perspective. Existing entries are retained when unchanged. You can also develop one response at a time.
① 从哪里切入辩题|① Where to enter the motion
② 今天真正需要判断什么|② What needs to be judged here
③ 怎样一步步引入这个视角|③ How to lead into this perspective
④ 可以怎样开场|④ A possible opening
⑤ 怎样接回消化／反转|⑤ How to connect to digestion / reversal
适用条件与仍须承认的内容|Conditions and considerations we must still acknowledge
人工改编示例|Manually adapted example
围绕这一处理视角倒推切入|Work back from this response to a suitable entry
为此候选补充切入|Add an entry for this response
分析这项的切入|Develop an entry for this response
从辩题通往这个处理视角|From the motion to this response's perspective
先引导如何理解今天的问题，再让观众看到为什么应当采用这一视角。|Start by guiding the audience's reading of the question, then explain why this perspective belongs here.
先形成处理候选|Develop a response first
完成第3步后，为每个处理结果寻找合情合理的切入路径。|After Step 3, develop a justified way into each response's perspective.
对应处理|Linked response
切入标题|Entry title
设计视角切入 →|Develop a framing entry →
第4步 · 从辩题引入视角|Step 4 · Introduce the perspective from the motion
怎样让观众顺着辩题走到这个视角？|How can the motion lead the audience into this perspective?
从既定处理倒推切入，再按观众的理解顺序讲述：辩题情境 → 判断问题 → 采用这个视角 → 衔接消化／反转。|Work back from the response, then present it in the audience's order: context → question → perspective → digestion / reversal.
演示已备好结果，可依次查看4个步骤。|The example is ready. Explore its four steps.
个切入方案|framing entries
进入第4步：视角切入 →|Step 4: Frame the motion →
← 回到处理分析|← Back to responses
查看配套的叙事流程 →|View the paired narrative flows →
↳ 本处理的配套切入|↳ Framing entries paired with this response
先选一套处理，再比较它的配套切入|Choose a response, then compare its paired entries
每个处理方案独立成组。组内每条切入各自形成完整叙事，只使用该处理对应的共性和论点；切换这里不会生成新内容。|Each response forms a separate group. Every entry has its own narrative using only that response's linked commonalities and arguments. Switching views does not generate content.
此处理联合承接这些共性|This response addresses these commonalities jointly
此处理承接的共性|The commonality addressed by this response
具体来自哪些对方论点|The opposing arguments behind it
处理方案|Response plan
保留此处理方案|Save this response plan
已保留此处理方案 · 取消|Response plan saved · Unsave
该方案的配套切入|Entries paired with this response
查看或补充配套切入 →|View or add paired entries →
今天需要判断的问题|The question to judge here
进入这一处理视角的引导|The route into this response's perspective
开场示范|Example opening
承接对方理由与共性|Accept their reasons and shared content
这条切入怎样接回处理|How this entry connects to the response
对应到哪些论点 · 关联清单|Linked arguments · Correspondence list
这是已有对应关系的检视，关联不等于逐项转换已成立。|This lists existing links; a link does not establish that the response succeeds for every argument.
仍需承认与补足|What still needs acknowledgment or support
这套处理还没有配套切入|This response has no paired entry yet
到第4步为这项处理设计入口，之后在这里比较它的不同叙事。|Develop an entry for this response in Step 4, then compare its narratives here.
先形成一套处理方案|Develop a response plan first
先完成处理分析，再为它设计视角切入。|Analyze responses first, then develop their framing entries.
这组演示尚未预置切入示例。|This example has no preset framing entries.
这次没有找到合适的切入方案。|No suitable framing entry was found this time.
已完成，部分结果待补齐|Completed; some results still need attention
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
  Object.assign(catalog,Object.fromEntries(`
BETA|BETA
开始新辩题|Start a new motion
谁还在傻傻地只考虑我方！结构性交锋，从立论开始！|Still only thinking about your own side? Structural clash starts with case construction!
导入《认知星图》结果|Import Cognitive Landscape results
底层观念是辅助解释|Underlying ideas provide supporting interpretation
可能涉及学理、价值观、世界观、认识论或意识形态；不必强贴学派标签。|Possible links to theory, values, worldviews, epistemology or ideology; no school label is required.
共性采样提及|Commonality sample mentions
处理采样提及|Response sample mentions
轮次|Round
待聚合|Awaiting clustering
本阶段最新一轮|Latest round in this stage
失败或停止|Failed or stopped
查看本轮记录 ↗|View this round's records ↗
默认采样1份、并发1个；可独立调整。|Defaults: 1 sample, concurrency 1. Adjust each stage independently.
本轮采样来源|Sources for this sampling round
独立阶段的采样记录|Stage sampling records
频次仅属于这一轮。有效空样本计入分母，失败与停止不计入；不与其他阶段或轮次累加。|Frequency belongs to this round only. Valid empty samples count in the denominator; failed or stopped samples do not. Stages and rounds are never pooled.
本轮固定输入|Frozen input for this round
共性采样份数|Number of commonality samples
共性并发数|Commonality sampling concurrency
处理采样份数|Number of response samples
处理并发数|Response sampling concurrency
各阶段独立采样，按本轮有效样本统计；频次表示候选的出现情况，不是正确率。单份采样直接保留候选，多份采样再语义聚合。|Each stage samples independently and counts valid samples within its own round. Frequency describes occurrence, not correctness. One sample retains its candidates; multiple samples are semantically clustered.
重新聚合本轮样本|Recluster this round
重试本轮失败采样|Retry failed samples in this round
三个采样阶段分别计频，视角切入不计频|Three stages count samples separately; framing entries have no frequency
共性独立采样|Independent commonality sampling
处理独立采样|Independent response sampling
共性语义聚合|Clustering commonalities
处理语义聚合|Clustering responses
请恢复本轮模型配置后再重试，或开始新一轮采样。|Restore this round's model settings before retrying, or start a new round.
本轮缺少固定输入，请开始新一轮分析。|This round has no frozen input. Start a new analysis round.
本轮没有有效采样，请检查接口或重试失败样本。|No valid samples in this round. Check the connection or retry failed samples.
可导入已有结果填写辩题和双方持方；选择我方后，点击创建工作区才会接入。|Import results to fill the motion and both positions. Choose your side, then select Create workspace to load the data.
请选择我方持方|Choose our side
已读取《认知星图》结果，尚未创建项目|Cognitive Landscape results loaded; no project created yet
使用哪份对方论点数据？|Which opposing argument dataset should be used?
请选择对方论点数据|Choose the opposing argument dataset
清除导入，改为手动填写|Clear import and enter manually
导入时辩题与持方保持原文；如需修改，请先清除导入。|Imported motion and positions keep their original wording. Clear the import before editing them.
正在读取《认知星图》结果…|Reading Cognitive Landscape results…
尚未载入《认知星图》数据|No Cognitive Landscape data loaded
请自行选择我方持方，再创建工作区。|Choose your side, then create the workspace.
报告没有当前持方所需的对方论点数据。请选择另一持方，或导入包含对方论点的报告。|The report has no opposing arguments for your chosen side. Choose the other side or import a report containing the required arguments.
请选择要使用的对方论点数据。|Choose the opposing argument dataset to use.
所选对方数据没有可用论点，或尚未完成有效聚合。请更换数据后再创建工作区。|The selected opposing dataset has no usable arguments or its clustering is incomplete. Choose another dataset before creating the workspace.
将接入|Will import
工作区已创建，并载入所选对方论点。|Workspace created with the selected opposing arguments.
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
  const term=s=>String(s).replace(/共同根基|根基/g,'论点共性');
  let language='zh';try{language=global.localStorage?.getItem('dug.workbench.language')==='en'?'en':'zh';}catch(_){}
  const rules=[
    [/^已复核并修正 (\d+) 处引用，分析文字保持原样。$/,'Reviewed and corrected $1 references; analysis text is unchanged.'],
    [/^模型输出达到长度上限，回复被截断（finish_reason=(.+)；请求输出上限：(.+) Token）。请在「模型设置」提高输出上限后开始新一轮分析；旧记录会保留。上下文容量不等于输出预算，思考也可能占用预算。$/,'The reply was truncated at its output limit (finish_reason=$1; requested limit: $2 tokens). Increase the limit in Model settings and start a new round; previous records are retained. Context capacity differs from the output budget, which may include reasoning.'],
    [/^模型接口连续 (\d+) 秒没有新数据，已停止；已接收内容保留在本轮记录和 Debug 中。$/,'No new API data for $1 seconds; stopped. Received text is retained in the round records and Debug export.'],
    [/^对应 (\d+) 个处理候选$/,'Linked to $1 response candidates'],
    [/^视角切入 (\d+) \/ (\d+)$/,'Framing the motion $1 / $2'],
    [/^编辑视角切入$/,'Edit framing entry'],
    [/^(.+) 的额外参数不是有效 JSON$/,'Additional parameters for $1 are not valid JSON'],
    [/^(.+)超出有效范围$/,'$1 is outside its valid range'],

    [/^接口请求失败（HTTP (\d+)）。检查接口、模型和凭据。$/,'Request failed (HTTP $1). Check the endpoint, model and credentials.'],
    [/^模型查询失败（HTTP (\d+)），可检查凭据、地址或手动填写型号$/,'Model query failed (HTTP $1). Check credentials and endpoint, or enter a model ID manually.'],
    [/^模型未正常完成（(.+)）$/,'The model did not finish normally ($1)'],
    [/^输出上限超过该型号已核实的最大值 (\d+)$/,'The output token limit exceeds the verified maximum of $1 for this model'],
    [/^额外参数 (.+) 与上方控件重复；请清空其中一处$/,'Parameter $1 conflicts with a control above; clear one of them'],
    [/^不支持额外参数：(.+)$/,'Unsupported parameter: $1'],

    [/^(.+) · 当前$/,'$1 · Current'],[/^ · 未完成 (\d+) 份$/,' · $1 incomplete'],[/^ · 待执行$/,' · Queued'],
    [/^已保存 (.+)$/,'Saved $1'],[/^我方 · (.+)$/,'Our side · $1'],[/^对方：(.*)$/,'Opponent: $1'],[/^我方：(.*)$/,'Our side: $1'],
    [/^已选 (\d+) 个论点$/,'$1 arguments selected'],[/^处理全部 (\d+) 项论点共性$/,'Process all $1 commonalities'],
    [/^(G\d+) 的转换分支$/,'$1 responses'],[/^(\d+) 个候选$/,'$1 candidates'],[/^再显示 (\d+) 条 · 仅此论点共性$/,'Show $1 more in this group'],[/^再显示 (\d+) 项 · 余 (\d+) 项$/,'Show $1 more · $2 remaining'],
    [/^再显示 (-?\d+) 项 · 余 (-?\d+) 项$/,'Show $1 more · $2 remaining'],
    [/^(论点|论点共性|转换方向)详情 · (.+)$/,'$1 details · $2'],[/^(对方底层观念|我方底层观念) · (.+)$/,'$1 · $2'],[/^编辑(论点|论点共性|转换方向)$/,'Edit $1'],
    [/^修改记录 · (\d+)$/,'Edit history · $1'],[/^完成 (\d+) \/ (\d+) 份$/,'Completed $1 / $2 samples'],
    [/^自动分析对方底层观念 (\d+) \/ (\d+)$/,"Analyzing opponent's underlying ideas $1 / $2"],[/^自动分析我方底层观念 (\d+) \/ (\d+)$/,'Analyzing our underlying ideas $1 / $2'],
    [/^新增 (\d+) 个论点共性候选。$/,'Added $1 commonality candidates.'],[/^已聚合为 (\d+) 个论点。$/,'Clustered into $1 arguments.'],
    [/^演示使用固定的(\d+)份预置样本。点击「开始新辩题」接入模型探索。$/,'This example uses $1 synthetic samples. Choose Start a new motion to use a model.'],
    [/^演示样本 (\d+) 份$/,'$1 example samples'],[/^已完成采样 (\d+) 份(.*)$/,'$1 completed samples$2'],[/^ · 未完成 (\d+) 份$/,' · $1 incomplete'],
    [/^批次 (\d+) · (.+)$/,'Batch $1 · $2'],[/^样本 (\d+) · (完成|失败|已停止|待执行|执行中) · (\d+) 个条目$/,'Sample $1 · $2 · $3 entries'],[/^样本 (.+)$/,'Sample $1'],[/^(\d+) \/ (\d+) 份有效(演示)?采样提及；这不是正确率。$/,'Mentioned in $1 / $2 valid samples; this is not an accuracy score.'],
    [/^(\d+) 论点 · (\d+) 论点共性 · (\d+) 方向$/,'$1 arguments · $2 commonalities · $3 responses'],
    [/^(\d+) 份完成采样 · (\d+) 条底层观念支线$/,'$1 complete samples · $2 underlying ideas branches'],[/^最近保存：(.+)$/,'Last saved: $1'],
    [/^预置参考型号 (\d+) 个，未验证当前账户权限。也可直接手填型号。$/,'$1 reference models; account access is unverified. You can enter a model ID manually.'],
    [/^接口返回 (\d+) 个型号；当前显示 (\d+) 个。列表可能含非文本型号，需自行确认 Chat Completions 支持。$/,'$1 models returned; $2 shown. Some may not support text Chat Completions.'],
    [/^删除这条本地历史会话？\n([\s\S]+)\n已导出的文件不受影响。$/,'Delete this local session?\n$1\nExported files are unaffected.'],
    [/^选择(.+)$/,'Select $1'],
  ];
  function t(value){const original=term(value),s=original.trim();if(language!=='en')return original;if(catalog[s])return original.replace(s,catalog[s]);
    for(const [re,to]of rules)if(re.test(s)){let result=s.replace(re,to);for(const label of ['对方底层观念','我方底层观念','转换方向','论点共性','论点','正方','反方','完成','失败','已停止','待执行','执行中','智谱 GLM','Kimi / Moonshot 中国站','自定义 OpenAI 兼容接口'])result=result.replace(label,catalog[label]||({'转换方向':'Response'}[label]));return original.replace(s,result);}
    if(/^(演示样本提及|样本提及) \d+ \/ \d+$/.test(s))return original.replace(s,s.replace('演示样本提及','Demo sample mentions').replace('样本提及','Sample mentions'));
    const prefixes={'结果校验未通过；已保留原始回复。':'Result validation failed; the original reply is retained. ','已定向复核一次，仍未通过：':'One targeted review was attempted, but validation still failed: ','本轮没有有效采样。':'No valid samples in this round. ','Debug 导出失败：':'Debug export failed: ','本地保存失败：':'Local save failed: ','历史会话：':'Session history: ','导入失败：':'Import failed: ','导出失败：':'Export failed: ','历史迁移未完成，原始记录已保留：':'Migration incomplete; original records are retained: ','当前会话未能写入历史，已保留在页面中。请先导出备份：':'Could not save this session to history. It is still open; export a backup: '};
    for(const [a,b]of Object.entries(prefixes))if(s.startsWith(a))return b+t(s.slice(a.length));
    return original;
  }
  const nodes=new WeakMap(),attrs=new WeakMap();let scheduled=false;
  function apply(){if(!global.document)return;const doc=global.document;doc.documentElement.lang=language==='en'?'en':'zh-CN';doc.title=t('辩论筑基·立论星轨');
    const walker=doc.createTreeWalker(doc.body,global.NodeFilter.SHOW_TEXT);let n;
    while(n=walker.nextNode()){
      if(n.parentElement?.closest('script,style,pre,textarea,[data-no-i18n]'))continue;
      let old=nodes.get(n);const source=old&&n.data===old.rendered?old.source:n.data;
      const content=n.parentElement?.closest('[data-user-content],.node-title,.node-description,.direction-flow dd,#motion-title,#demo-disclaimer,.session-motion,.session-row strong,.session-root-preview strong,.session-root-preview p');
      const rendered=content?term(source):t(source);nodes.set(n,{source,rendered});if(n.data!==rendered)n.data=rendered;
    }
    for(const el of doc.querySelectorAll('[placeholder],[title],[aria-label]')){if(el.closest('script,style,[data-no-i18n]'))continue;const cached=attrs.get(el)||{};for(const name of ['placeholder','title','aria-label']){if(!el.hasAttribute(name))continue;const value=el.getAttribute(name),old=cached[name],source=old&&value===old.rendered?old.source:value;const rendered=t(source);cached[name]={source,rendered};if(value!==rendered)el.setAttribute(name,rendered);}attrs.set(el,cached);}
    const button=doc.getElementById('btn-language');if(button){const label=language==='en'?'中文':'EN';if(button.textContent!==label)button.textContent=label;const hint=language==='en'?'Switch to Chinese':'切换到英文';if(button.getAttribute('aria-label')!==hint)button.setAttribute('aria-label',hint);}
    const history=doc.getElementById('btn-history');if(history){const label=language==='en'?'History':'历史会话';if(history.textContent!==label)history.textContent=label;}
  }
  function setLanguage(value){language=value==='en'?'en':'zh';try{global.localStorage?.setItem('dug.workbench.language',language);}catch(_){}apply();}
  const api={t,term,apply,setLanguage,catalog,get language(){return language;}};global.DUG_I18N=api;
  if(global.document){new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});apply();}
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
