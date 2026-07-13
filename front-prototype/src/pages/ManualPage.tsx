import React from 'react';
import mermaid from 'mermaid';

type ManualSection = {
  id: string;
  module: '采购管理' | '库存管理' | '基础资料';
  title: string;
  purpose: string;
  diagram?: string;
  diagramNote?: string;
  steps: string[];
  fields: string[];
};

const manualSections: ManualSection[] = [
  {
    id: 'purchase-order',
    module: '采购管理',
    title: '采购订单',
    purpose: '采购订单用来先把"向谁买、买什么、买多少、计划入哪个仓"定下来，审核通过后才进入后续入库。',
    diagram: `flowchart LR
    A["供应商档案<br/>商品档案<br/>仓库档案"] --> B["采购订单<br/>（意图层）"]
    B -->|"审核通过后<br/>每次到货手动创建"| C["采购入库单<br/>（执行层）"]
    C -->|"确认入库"| D{"入库完毕？"}
    D -->|"未入库数量 = 0<br/>（系统自动）"| E["采购订单<br/>状态→已完成"]
    D -->|"人工关闭<br/>（缺量完结）"| E
    C -->|"确认入库后"| F["库存台账 +N<br/>库存流水（采购入库）"]
    C -->|"确认入库后"| G["基础应付记录"]
    C -->|"已入库商品可发起"| H["采购退货单<br/>→采购退货出库单"]`,
    steps: [
      '先维护好供应商档案、商品档案、仓库档案。新建采购订单时，供应商、入库仓库和商品都要从已启用的档案里选，不要手输一套页面里不存在的名称。',
      '在"新增采购订单"里选择供应商、入库仓库、下单日期，再通过"选择商品"把要采购的商品加入明细。每一行录采购数量、单价（含税）和税率，系统会自动算金额（含税）。',
      '草稿没确认前可以继续编辑、保存草稿；确认要发起采购时，点击"提交审核"。提交前系统会检查供应商、仓库、商品明细、采购数量和单价。',
      '管理员或有审核权限的人在待审核单据上点"审核通过"或"驳回"。审核通过后，供应商、仓库、商品、数量、单价、税率这些关键字段锁定；驳回后回到草稿，采购员再修改后重新提交。',
      '审核通过后，订单进入待入库。每次到货时，从采购订单创建采购入库单；系统会跟着入库单确认结果回写累计已入库数量和未入库数量。',
      '如果全部到货入库，系统自动把采购订单置为已完成；如果部分入库后供应商不再补货，采购员可以在部分入库状态执行"关闭订单"，表示剩余数量不再接收。',
      '草稿建错可以删除；待审核和待入库可以作废。已经发生有效入库后，不要再作废采购订单，后续修正要走采购退货链路。'
    ],
    fields: [
      '供应商：必填，从启用供应商中选择；审核通过后不可修改。',
      '入库仓库：必填，从启用仓库中选择；决定后续入库库存归属，审核通过后不可修改。',
      '下单日期：必填，默认当天，不允许填未来日期。',
      '商品编码 / 商品名称 / 规格型号 / 单位：通过商品选择器带出并形成快照，不要在明细里手改商品名称。',
      '采购数量：必填，必须大于 0，是后续未入库数量计算的基础。',
      '单价（含税）：必填，金额 >= 0，保留 2 位小数。',
      '预计到货日期、采购备注、行备注：可按实际情况填写；审核通过后 PRD 允许预计到货日期和备注继续维护。'
    ]
  },
  {
    id: 'purchase-receipt',
    module: '采购管理',
    title: '采购入库单',
    purpose: '采购入库单用来处理供应商到货后的点数和确认入库，确认后才增加库存并生成应付。',
    diagram: `graph LR
    A["采购订单 (PO, 已审核)"] -->|下推创建| B["采购入库单 (PI, 草稿)"]
    B -->|确认入库| C["更新现存量 + 写入流水 (FL)"]
    B -->|确认入库| D["生成应付款记录 (AP)"]
    B -->|确认入库| E["回写 PO 累计数量"]`,
    steps: [
      '从已审核的采购订单下推创建采购入库单。PI 不是无来源新建单据，来源采购单号、供应商、入库仓库、商品、单价等信息会从 PO 继承并只读展示。',
      '货到后，仓管员在草稿 PI 里点数。实收数量填实际到货并卸货的数量；入库数量填验货合格、真正要入库存的数量。',
      '录入数量时注意三数量关系：订单数量是计划量，实收数量是到货点数量，入库数量是合格入库数量。入库数量不能大于实收数量，实收数量不能超过订单未入库数量。',
      '如有破损、少到、拒收，在入库备注或行备注里写清楚原因。备注本身不动库存，真正影响库存的是"确认入库"动作。',
      '点击"确认入库"后，系统做校验。通过后 PI 变为已确认，只读锁定；系统增加目标仓库现存量、生成库存流水 FL、生成应付款记录 AP，并回写采购订单累计已入库数量。',
      '确认后发现录错，不能直接改已确认 PI。应按业务规则通过后续采购退货单和采购退货出库单处理。'
    ],
    fields: [
      '来源采购单号：系统继承，只读，用来追溯 PO。',
      '供应商、入库仓库：系统继承，只读，不允许在 PI 里换供应商或换仓。',
      '入库日期：必填，默认当天，确认后锁定。',
      '实收数量：必填，必须 > 0，且不能超过订单未入库数量。',
      '入库数量：必填，必须 > 0，且必须 <= 实收数量；它才是真正增加库存和生成应付的数量。',
      '金额（含税）：系统按"入库数量 × 单价（含税）"计算，只读。',
      '入库备注、行备注：选填，用来记录到货异常或单行说明。'
    ]
  },
  {
    id: 'purchase-return',
    module: '采购管理',
    title: '采购退货单',
    purpose: '采购退货单用来发起"这批已入库商品要退给供应商"的申请，本身不扣库存、不冲应付。',
    diagram: `graph LR
    A["采购入库单 PI<br/>已确认"] -->|下推创建| B["采购退货单 PR<br/>草稿"]
    B -->|确认退货| C["采购退货单 PR<br/>已确认"]
    C -->|下推生成| D["采购退货出库单 PRO<br/>草稿"]
    D -->|确认出库| E["扣减现存 + 冲减应付 + 生成库存流水"]`,
    steps: [
      '先找到已确认的采购入库单 PI，在 PI 详情页发起采购退货。PR 必须基于已确认 PI 下推创建，不支持无来源退货，也不从 PO 直接创建。',
      '系统生成 PR 草稿后，会继承来源入库单号、来源采购单号、供应商、退货仓库、商品、单价等信息，这些都是只读快照。',
      '采购员核对要退的商品，在草稿里填写本次退货数量和退货原因。系统会展示原入库数量、已退货申请数量、可退货数量，帮你判断还能退多少。',
      '点击"确认退货"前，重点检查退货原因和每行本次退货数量。系统会重新计算可退货数量，防止多张 PR 同时退同一批 PI 行导致超退。',
      'PR 确认后进入已确认，字段锁定。这个动作只锁定退货申请，并计入已退货申请数量；不会扣减现存，不生成 FL，也不冲减 AP。',
      '实际退货出库要从已确认 PR 下推采购退货出库单 PRO，由 PRO 确认出库时再动库存和应付。'
    ],
    fields: [
      '来源入库单号：系统继承，只读，只能来自已确认 PI。',
      '供应商、退货仓库：继承 PI，只读，不在 PR 中修改。',
      '退货日期：必填，不得晚于当前系统日期。',
      '退货原因：必填，确认退货前必须写清楚为什么退。',
      '原入库数量、已退货申请数量、可退货数量：系统计算或继承，只读，是判断是否还能退的关键。',
      '本次退货数量：必填，必须 > 0，且不能超过确认时重新计算出的可退货数量。',
      '退货金额（含税）：系统按"本次退货数量 × 单价（含税）"计算；PR 阶段只记录申请金额。'
    ]
  },
  {
    id: 'purchase-return-outbound',
    module: '采购管理',
    title: '采购退货出库单',
    purpose: '采购退货出库单用来执行退货实物出库，确认后才扣现存、冲减应付并生成库存流水。',
    diagram: `graph LR
    A["采购退货单 (PR, 已确认)"] -->|下推创建| B["采购退货出库单 (PRO, 草稿)"]
    B -->|确认出库| C["扣减现存库存"]
    B -->|确认出库| D["冲减供应商应付"]
    B -->|确认出库| E["生成库存流水 (FL)"]`,
    steps: [
      '从已确认的采购退货单 PR 下推创建 PRO。PRO 不能无来源创建，一期按一张 PR 对一张 PRO 控制。',
      'PRO 草稿会继承 PR 的供应商、出库仓库、商品、单价、退货数量，并把 PR 退货数量作为出库数量。出库数量只读，不支持分批改小。',
      '仓管员按单据准备实物，核对商品和数量，填写出库日期和出库备注。草稿保存、编辑都不影响库存、应付和 FL。',
      '点击"确认出库"时，系统校验出库数量是否等于 PR 本次退货数量，以及当前仓库现存是否足够。',
      '校验通过后，PRO 变为已确认，全字段只读；系统扣减出库仓库现存和可用，冲减供应商应付，并生成采购退货出库库存流水 FL。',
      '确认出库后会回写 PR 的关联出库状态，避免同一张 PR 重复下推或重复出库。'
    ],
    fields: [
      '来源退货单号：系统继承，只读，必须来自已确认 PR。',
      '供应商、出库仓库：继承 PR，只读；出库仓库就是扣库存的仓库。',
      '出库日期：必填，默认当天，不得晚于当前系统日期。',
      'PR退货数量、出库数量：系统继承，只读；一期要求出库数量等于 PR 退货数量。',
      '金额（含税）：系统按"出库数量 × 单价（含税）"计算，用于应付冲减。',
      '出库备注：选填，用来记录实物交接或退货出库说明。',
      '库存流水号：确认出库后系统生成，草稿或已作废展示为空或 `-`。'
    ]
  },
  {
    id: 'instant-stock',
    module: '库存管理',
    title: '即时库存查询',
    purpose: '即时库存查询用来实时查看商品在各仓、各批次的现存量、占用量和可用量，只查账不改库存。',
    diagram: `graph LR
    A["采购/仓管"] -->|"1.输入商品/仓库/批次组合条件"| B["即时库存查询页"]
    B -->|"2.点击搜索"| C{"不显示零库存?"}
    C -->|是| D["SQL 自动追加 current_qty > 0 过滤"]
    C -->|否| E["执行全量实时计算"]
    D --> F["返回列表"]
    E --> F
    F -->|"3.比对可用量 <= 安全库存"| G{预警触发?}
    G -->|是| H["渲染可用量为 红色粗体 + ⚠️低于安全库存 Tag"]
    G -->|否| I["正常只读渲染展示"]`,
    steps: [
      '进入页面后，按需要选择仓库、商品，或输入批次号。条件都可以不填，不填就是查全部范围。',
      '如果只想看还有实物库存的商品，打开"不显示零库存"开关；系统会过滤现存量小于等于 0 的行。',
      '点击"搜索"后，页面按当前条件实时计算，不是看昨晚快照。列表会展示商品、仓库、批次、现存量、占用量、可用量和安全库存量。',
      '看库存时先分清三个数量：现存量是仓里实物数，占用量是已被业务单据锁定但还没出库的数，可用量是还能承诺给新业务的数。',
      '当可用量低于安全库存量时，页面会做红色预警，采购员可以据此判断是否要补货；但本页不会自动生成采购单。',
      '需要带走数据时点"导出"。列表为空时导出按钮禁用。不要在这个页面找新增、编辑、调整库存入口，PRD 明确它是只读查询页。'
    ],
    fields: [
      '仓库：选填，筛选特定仓库；展示格式为 `{Code} {Name}`。',
      '商品：选填，可按商品编码或名称联想选择。',
      '批次号：选填，支持按批次查实物库存。',
      '不显示零库存：选填开关，开启后隐藏现存量 <= 0 的记录。',
      '现存量：系统计算，等于期初库存 + 累计入库 - 累计出库。',
      '占用量：系统带出，来自审核通过但尚未确认出库的业务单据锁定数量。',
      '可用量：系统计算，等于现存量 - 占用量；低于安全库存时会预警。'
    ]
  },
  {
    id: 'inventory-flow',
    module: '库存管理',
    title: '库存流水查询',
    purpose: '库存流水查询用来追溯每一笔库存变动的来源单据、发生时间、变动数量和操作人，只读不可编辑。',
    diagram: `graph LR
    A["仓管/管理员"] -->|"组合搜索"| B["库存流水查询页面"]
    B -->|检查时间范围| C{"跨度 <= 365天?"}
    C -->|否| D["提示超期报错，拦截阻断"]
    C -->|是| E["执行 SQL 查询并返回列表"]
    E -->|无数据| F["展现 暂无数据 空状态"]
    E -->|有数据| G["点击来源单号, 浏览器跳转原单详情"]`,
    steps: [
      '进入页面后，用仓库、商品、单据类型、日期范围、变动方向、批次号、来源单号组合查询。条件越准确，越容易定位某一笔库存变化。',
      '选择日期范围时注意跨度不能超过 365 天。超过时页面会提示超期并拦截查询，避免慢查询。',
      '点击"搜索"后，列表按发生时间倒序展示库存流水。每行就是一次业务单据确认后写入的库存变动记录。',
      '看流水时重点核对库存流水号、发生时间、仓库、商品、变动类型、变动数量、变动后现存量、来源单号和操作人。',
      '如果要追溯这笔变动为什么发生，点击来源单号。系统会根据来源单号跳到对应原单详情，例如 `PI` 跳采购入库单详情。',
      '列表没有数据时展示空状态，导出按钮置灰。这个页面是审计日志，不提供新增、编辑、删除或审核动作。'
    ],
    fields: [
      '仓库、商品：选填，用于定位某仓某商品的流水。',
      '单据类型：选填，可筛采购入库 `PI`、采购退货出库 `PRO` 等业务类型。',
      '日期范围：选填，最大查询跨度 365 天。',
      '变动方向：选填，`IN=入库（+）`，`OUT=出库（-）`。',
      '库存流水号：系统生成，格式 `FL{YYYYMMDD}-{8位序号}`，全局唯一。',
      '变动数量：入库带 `+`，出库带 `-`，用于核对现存增减。',
      '来源单号：库存变动的原始业务凭证，可点击追溯。'
    ]
  },
  {
    id: 'warehouse',
    module: '基础资料',
    title: '仓库管理',
    purpose: '仓库管理用来维护货进到哪里、货从哪里出、谁负责这个仓，是采购入库和库存查询的基础资料。',
    steps: [
      '在列表页用综合搜索查仓库编码、仓库名称或负责人，也可以按仓库类型、状态筛选。',
      '新增仓库时，点击"新增仓库"，填写仓库编码、仓库名称、仓库类型、仓库地址、负责人等信息后保存。',
      '编辑仓库时，从列表进入编辑页。已被业务单据引用的仓库编码不允许修改；仓库类型一期也不允许在编辑模式修改。',
      '启用或停用仓库不要在表单里改状态，要在列表或详情页点击"启用/停用"动作按钮。停用时按弹窗填写停用原因。',
      '停用仓库不会删除历史数据，历史单据和库存查询仍允许查看；但停用仓库不能继续在新建采购、库存等业务单据中选择。'
    ],
    fields: [
      '仓库编码：必填且唯一，最多 20 个字符，只允许字母、数字、连字符 `-`，建议格式 `WH-0001`。',
      '仓库名称：必填，最多 50 个字符，保存前去首尾空格。',
      '仓库类型：必填，枚举为后仓 / 门店仓；编辑模式下一期只读。',
      '仓库地址：必填，最多 100 个字符。',
      '负责人：必填，最多 20 个字符。',
      '联系电话：选填，填写时要符合手机号或座机格式。',
      '停用原因：停用动作触发时条件必填，最多 100 个字符。'
    ]
  },
  {
    id: 'supplier',
    module: '基础资料',
    title: '供应商管理',
    purpose: '供应商管理用来维护向谁采购、怎么联系、怎么结算，供采购订单和采购入库引用。',
    steps: [
      '在供应商列表里用综合搜索查供应商编码、名称或联系人，也可以按状态筛选。',
      '新增供应商时，填写供应商编码、供应商名称、联系人、联系电话、结算方式等信息；如果选择账期结算，还要填写账期天数。',
      '编辑供应商时，已被采购单据引用的供应商编码只读，不允许修改；其他允许编辑的资料按页面校验保存。',
      '启停用通过行操作或详情页操作按钮触发，不在新增/编辑主表单里直接改状态。停用时弹窗内必须填停用原因，启用时纯确认。',
      '停用供应商不能继续在新建采购订单、采购入库、付款登记中选择，但历史采购单据和应付查询仍可查看。'
    ],
    fields: [
      '供应商编码：必填且唯一，最多 20 个字符，只允许大写字母、数字和连字符 `-`，参考格式 `VEND-0001`。',
      '供应商名称：必填，最多 50 个字符。',
      '联系人：必填，最多 20 个字符。',
      '联系电话：必填，手机号或座机格式。',
      '结算方式：必填，`CASH=现付` / `ACCOUNT=账期结算`。',
      '账期天数：结算方式为账期结算时必填，范围 0-365；现付时自动为 `0` 且只读。',
      '停用原因：停用动作触发时必填，最多 100 个字符。'
    ]
  },
  {
    id: 'product',
    module: '基础资料',
    title: '商品管理',
    purpose: '商品管理用来维护商品编码、名称、规格、单位、价格和安全库存，供采购、库存和其他业务单据引用。',
    steps: [
      '在商品列表用综合搜索查商品编码、商品名称或条码，也可以按商品分类、状态筛选。',
      '新增商品时，填写商品编码、商品名称、商品分类、规格型号、销售单位、默认批发价等必填信息，再保存。',
      '商品编码被业务单据引用后不允许修改；其他字段允许按 PRD 规则编辑，但下游单据会使用生成当时的商品快照。',
      '启用或停用商品通过操作按钮完成，不在主表单中直接改状态。停用时填写停用原因。',
      '停用商品不能继续在新建采购订单等业务单据中选择；历史单据和库存查询仍可查看。'
    ],
    fields: [
      '商品编码：必填且唯一，最多 30 个字符，只允许大写字母、数字和连字符 `-`，参考格式 `SKU-0001`。',
      '商品名称：必填，最多 50 个字符。',
      '商品分类：必填，一期按单级分类处理。',
      '规格型号：必填，最多 100 个字符。',
      '销售单位：必填，枚举 `PCS=件` / `BOX=盒` / `SET=套` / `PACK=包`。',
      '默认批发价：必填，金额 >= 0，保留 2 位小数；默认零售价、参考采购价为选填但填写时同样要 >= 0。',
      '安全库存：选填，非负整数；即时库存查询会用它做低库存预警。'
    ]
  },
  {
    id: 'customer',
    module: '基础资料',
    title: '客户管理',
    purpose: '客户管理用来维护客户是谁、什么价格级别、什么结算方式和信用额度，供基础资料统一引用。',
    steps: [
      '在客户列表用综合搜索查客户编码、客户名称或联系人，也可以按客户等级、状态筛选。',
      '新增客户时，填写客户编码、客户名称、客户等级、联系人、联系电话、价格级别、结算方式等信息。',
      '如果结算方式选择账期结算，账期天数和信用额度要填写；如果选择现结，账期天数固定为 `0`，信用额度默认 `0.00`。',
      '编辑客户时，已被业务单据引用的客户编码只读，不允许修改；其他字段按页面校验保存。',
      '启停用通过列表或详情页操作按钮触发。停用客户时弹窗内必须填写停用原因；停用后不可在新建业务单据中继续选择，历史订单和往来查询仍可查看。'
    ],
    fields: [
      '客户编码：必填且唯一，建议格式 `CUST-0001`；已被业务单据引用后不允许修改。',
      '客户名称：必填，1-50 个字符。',
      '客户等级：必填，`A=A级` / `B=B级` / `C=C级`。',
      '联系人、联系电话：必填；电话需符合手机号或座机格式。',
      '价格级别：必填，`P1=一级价` / `P2=二级价` / `P3=三级价`。',
      '结算方式：必填，`CASH=现结` / `ACCOUNT=账期结算`。',
      '账期天数、信用额度：账期结算时条件必填；账期天数 0-365，信用额度 >= 0 且保留 2 位小数。'
    ]
  }
];

const modules = ['采购管理', '库存管理', '基础资料'] as const;

function MermaidChart({ chart, title }: { chart: string; title: string }) {
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const renderId = `manual-${title}-${Math.random().toString(36).slice(2)}`.replace(/[^a-zA-Z0-9_-]/g, '-');

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        primaryColor: '#eef6ff',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#2563eb',
        lineColor: '#64748b',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#ffffff',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }
    });

    mermaid
      .render(renderId, chart)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) setSvg(renderedSvg);
      })
      .catch(() => {
        if (!cancelled) setError('流程图渲染失败，请检查 Mermaid 源码。');
      });

    return () => {
      cancelled = true;
    };
  }, [chart, title]);

  if (error) {
    return <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
      {svg ? (
        <div
          className="min-w-[620px] [&_svg]:mx-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-40 animate-pulse rounded-md bg-slate-100" />
      )}
    </div>
  );
}

function ManualSectionBlock({ section }: { section: ManualSection }) {
  return (
    <section id={section.id} className="scroll-mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-bold text-primary">{section.module}</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{section.title}</h2>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800">这个页面是干嘛的</h3>
        <p className="text-sm leading-7 text-slate-600">{section.purpose}</p>
      </div>

      {section.diagram && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800">业务流程图</h3>
          <MermaidChart chart={section.diagram} title={section.id} />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">流程每个节点怎么操作</h3>
        <ol className="space-y-2">
          {section.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-7 text-slate-600">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">关键字段怎么填</h3>
        <ul className="grid gap-2 md:grid-cols-2">
          {section.fields.map(field => (
            <li key={field} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
              {field}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-primary">终端操作用户手册</p>
          <h1 className="text-2xl font-bold text-slate-900">操作手册</h1>
          <p className="max-w-4xl text-sm leading-7 text-slate-600">
            本手册只覆盖已有 PRD 的采购管理、库存管理、基础资料模块，供采购员、库管、资料管理员日常按页面操作使用。
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800">模块目录</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {modules.map(moduleName => (
            <div key={moduleName} className="space-y-2">
              <p className="text-xs font-bold text-slate-500">{moduleName}</p>
              <div className="flex flex-wrap gap-2">
                {manualSections
                  .filter(section => section.module === moduleName)
                  .map(section => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-primary hover:text-primary"
                    >
                      {section.title}
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modules.map(moduleName => (
        <div key={moduleName} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900">{moduleName}</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          {manualSections
            .filter(section => section.module === moduleName)
            .map(section => (
              <ManualSectionBlock key={section.id} section={section} />
            ))}
        </div>
      ))}
    </div>
  );
}
