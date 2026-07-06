# SpeakLoop

SpeakLoop 是一个本地优先的英语口语练习 PWA，面向职场英语、外企面试、Salesforce / CRM / BA / PM 场景表达训练。

第一版不使用后端、不登录、不云同步、不接入付费 API。素材、收藏、练习记录、录音、错题本、复习计划和每日复盘都保存在当前浏览器本地。

## 本地运行

```bash
npm install
npm run dev
```

开发服务器默认使用 `0.0.0.0`，方便同一局域网内的 iPhone Safari 访问。

构建生产包：

```bash
npm run build
npm run preview
```

## 在 iPhone Safari 打开

1. 让电脑和 iPhone 连接同一个 Wi-Fi。
2. 在电脑终端查看 Vite 输出的 Network 地址，例如 `http://192.168.1.10:5173/`。
3. 用 iPhone Safari 打开这个地址。
4. 点击 Safari 分享按钮，选择“添加到主屏幕”。

建议用 `npm run build && npm run preview` 测试 PWA 和离线缓存，因为 Service Worker 只在生产构建中注册。

## TXT 导入格式

每条素材用空行分隔，支持中文字段名：

```txt
场景：项目沟通
难度：B1
中文：这个需求的优先级不是很高，我们可以放到下一期。
英文：This requirement is not a high priority, so we can move it to the next phase.
标签：PM, 需求管理, 优先级
```

规则：

- 难度为空时默认 `B1`
- 场景为空时默认“通用”
- 标签用中文或英文逗号分隔
- 英文为空的条目不会导入
- 保存前会显示预览和失败原因

## 离线能力

生产构建会注册 Service Worker 并缓存 App Shell。首次在线打开后，以下页面可以离线打开并读取本地数据：

- 首页
- 素材库
- 收藏夹
- 错题本
- 今日复习
- 学习复盘
- 设置页

离线时仍可查看 IndexedDB / localStorage 中的素材和历史记录。录音、系统朗读、语音识别是否可用取决于浏览器本身和权限状态。

## 浏览器能力限制

- `SpeechSynthesis`：用于英文句子播放，不支持时只显示提示。
- `MediaRecorder`：用于录音跟读，不支持时可以手动标记完成并生成基础完成分。
- `SpeechRecognition`：用于简单文本识别和相似度评分，不支持时不会阻断练习。
- IndexedDB：优先用于本地数据保存；不可用时降级到 localStorage。

## 第一版功能

- 素材列表、筛选、搜索
- TXT 批量导入和导入预览
- 收藏夹
- 单句播放，支持 0.75x / 1x / 1.25x
- 录音跟读和本地回放
- 离线简单评分
- 错题本
- 艾宾浩斯复习计划
- 昨日学习复盘

