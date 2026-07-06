---
name: 强盛科技进销存
description: B端进销存管理系统，采购→入库→退货→库存台账。PC端，表格密集型，信息密度高。
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-light: "#eff6ff"

  success: "#059669"
  success-light: "#ecfdf5"
  warning: "#d97706"
  warning-light: "#fffbeb"
  danger: "#e11d48"
  danger-light: "#fff1f2"

  neutral-50: "#f8fafc"
  neutral-100: "#f1f5f9"
  neutral-200: "#e2e8f0"
  neutral-400: "#94a3b8"
  neutral-500: "#64748b"
  neutral-600: "#475569"
  neutral-700: "#334155"
  neutral-800: "#1e293b"
  neutral-900: "#0f172a"

  bg-page: "#f8fafc"
  bg-card: "#ffffff"
  bg-table-header: "#f8fafc"

  status-draft-bg: "#f4f4f5"
  status-draft-text: "#3f3f46"
  status-audit-bg: "#fff7ed"
  status-audit-text: "#c2410c"
  status-stock-in-bg: "#eff6ff"
  status-stock-in-text: "#1d4ed8"
  status-partial-bg: "#f0f9ff"
  status-partial-text: "#0369a1"
  status-completed-bg: "#ecfdf5"
  status-completed-text: "#059669"
  status-voided-bg: "#fff1f2"
  status-voided-text: "#e11d48"

typography:
  fontFamily: "PingFang SC, Microsoft YaHei, -apple-system, BlinkMacSystemFont, sans-serif"
  h1:
    fontSize: 1.25rem
    fontWeight: 700
    color: "{colors.neutral-800}"
  h3:
    fontSize: 0.875rem
    fontWeight: 700
    color: "{colors.neutral-700}"
  body:
    fontSize: 0.875rem
    color: "{colors.neutral-600}"
  label:
    fontSize: 0.75rem
    fontWeight: 600
    color: "{colors.neutral-500}"
  table-header:
    fontSize: 0.75rem
    fontWeight: 600
    color: "{colors.neutral-500}"
  table-cell:
    fontSize: 0.75rem
    color: "{colors.neutral-700}"
  table-cell-muted:
    fontSize: 0.75rem
    color: "{colors.neutral-500}"
  amount:
    fontSize: 0.75rem
    fontWeight: 700
    color: "{colors.neutral-800}"

spacing:
  page: "1rem"
  card-padding: "1.5rem"
  card-gap: "1rem"

rounded:
  card: "0.5rem"
  button: "0.375rem"
  badge: "0.25rem"
  input: "0.375rem"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    fontWeight: 600
    fontSize: "{typography.body.fontSize}"
  button-outline:
    backgroundColor: "transparent"
    borderColor: "{colors.neutral-200}"
    textColor: "{colors.neutral-700}"
    rounded: "{rounded.button}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
  status-badge:
    rounded: "{rounded.badge}"
    fontSize: "0.75rem"
    fontWeight: 600
    paddingX: "0.5rem"
    paddingY: "0.125rem"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.card}"
    borderColor: "{colors.neutral-100}"
    shadow: "0 1px 2px rgba(0,0,0,0.05)"
  table:
    headerBackground: "{colors.bg-table-header}"
    borderColor: "{colors.neutral-100}"
    rowHover: "#f8fafc"
  tab-active:
    backgroundColor: "#ffffff"
    textColor: "{colors.primary}"
    borderBottomColor: "{colors.neutral-200}"
  tab-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-500}"
---

# 强盛科技进销存

B端进销存管理系统，面向企业采购、入库、退货、库存台账场景。

## Overview

表格密集型 B 端系统，信息密度高。采用浅灰底白卡片布局，蓝色主操作色。状态标签用低饱和度彩色背景区分六种单据状态。移动端不做适配。

## Colors

- **primary `#2563eb`**：唯一主操作色——按钮、链接、Tab 选中态。不用于装饰。
- **success `#059669`**：已完成/已确认状态。不用于普通文本。
- **warning `#d97706`**：待审核状态、库存预警。仅用于标签和警示。
- **danger `#e11d48`**：已作废状态、删除按钮。不用于大面积背景。
- **neutral**：slate 色阶，从 50(page bg) 到 900(title text)。

## Status Tags

六个单据状态标签——底色浅彩色 + 深色文字，无边框，小圆角：

| 状态 | 底色 | 文字色 |
|------|------|--------|
| 草稿 | `#f4f4f5` (zinc-100) | `#3f3f46` (zinc-800) |
| 待审核 | `#fff7ed` (orange-50) | `#c2410c` (orange-700) |
| 待入库 | `#eff6ff` (blue-50) | `#1d4ed8` (blue-700) |
| 部分入库 | `#f0f9ff` (sky-50) | `#0369a1` (sky-700) |
| 已完成 | `#ecfdf5` (emerald-50) | `#059669` (emerald-700) |
| 已作废 | `#fff1f2` (rose-50) | `#e11d48` (rose-700) |

## Typography

中文内容优先——苹方(macOS) / 微软雅黑(Windows) / 系统兜底。正文 14px，标签 12px，标题 20px 加粗。金额千分位、右对齐、加粗。

## Components

反重力生成前端时遵循：
- 按钮不可用时隐藏，不渲染灰色 disabled 态
- 卡片统一 `rounded-lg` 白底浅边框浅阴影
- 表格表头 `bg-slate-50`，hover 行浅灰
- 表单校验错误时输入框红色边框 + 下方红色 10px 提示文字
