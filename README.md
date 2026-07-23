# LearningTools

学习工具箱的**页面仓库**（上传到 GitHub，可用 GitHub Pages 访问）。

业务页面按文件夹划分；词库与练习数据从 Gitee 的 **LearningData** 仓库读写。

## 目录结构

```
LearningTools/
├── index.html                      # 总入口
├── gitee-data.js                   # Gitee 数据读写（请先改仓库名与 Token）
├── EnglishChineseMatchingGame/     # 英语中文对对碰
│   └── students.js
├── WriteWords/                     # 英语单词默写
│   └── students.js
├── ShuXue_jiajian/                 # 数学加减法练习
│   └── students.js
├── ReadAloud/                      # 句子朗读录音
│   └── students.js
└── TingXie/                        # 听写播报（语文 / 英语）
    ├── yuwen-2B.html               # 语文听写
    └── yingyu-2B.html              # 英语听写
```

## 扩展学生（推荐）

不必再复制页面。每个业务目录下有一个 `students.js`：

1. 在数组里加一行，例如：
   ```js
   { key: "xm", label: "小明", icon: "🧒", color: "#7eb8ff", bg: "#eef6ff" }
   ```
2. 在 Gitee `LearningData/对应业务目录/` 上传数据文件
3. 刷新入口页，会自动出现按钮，链接为 `?grade=xm`

## 配置 Gitee

编辑 `gitee-data.js`：

```js
REPOSITORY: '你的用户名/LearningData',
TOKEN: '你的 Gitee Token',
BRANCH: 'master',   // 或 main
```

| 工具 | GITEE_DATA_DIR | 数据文件 |
|------|----------------|----------|
| 对对碰 | `EnglishChineseMatchingGame` | `words-{key}.xls` |
| 默写 | `WriteWords` | `words-mm.xls`（默认满满） |
| 数学 | `ShuXue_jiajian` | `shuxue-mm.xlsx`（默认满满） |
| 朗读 | `ReadAloud` | `read_aloud_2A_all.xlsx`（满满）；录音在 `recordings/{key}/` |
| 听写 | `TingXie` | **暂无独立数据文件**（词表目前写在 HTML 内；后续可迁到 LearningData） |

## 部署建议

1. 先把 `LearningData` 推到 Gitee
2. 再把 `LearningTools` 推到 GitHub，开启 Pages
3. 用 Pages 地址打开 `index.html`

## 本地预览（可选）

```bash
npx --yes serve -p 8765
```
