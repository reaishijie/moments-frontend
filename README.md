# 瞬刻 Moments Web

瞬刻（Moments）的前端：Nuxt 4 + Vue 3 + TypeScript，服务端渲染（SSR），面向搜索引擎优化。

> 后端 API 是独立的 `moments-api` 仓库（Express 5 + Prisma + MySQL），两个项目分开开发、构建与部署。

## 为什么用 Nuxt

旧的 Vite SPA 首屏只有 `<div id="app"></div>`，搜索引擎拿不到任何正文。迁移到 Nuxt 后：

- 首页、文章详情、用户主页、友链页由服务端直出完整 HTML（正文、评论、标签都在 HTML 里）
- 每个页面都有独立的 `title` / `description` / `canonical` / Open Graph / Twitter Card
- 输出 `BlogPosting`、`ProfilePage`、`WebSite`、`BreadcrumbList`、`ItemList` 结构化数据（JSON-LD）
- 提供动态 `sitemap.xml`、`robots.txt` 与 RSS 订阅源
- 站内搜索 `/search?q=`（SSR，noindex），JSON-LD 的 SearchAction 指向真实可用的搜索页
- 后台 `/admin` 与登录后页面保持纯客户端渲染（CSR），不影响首屏与 SEO

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 框架 | Nuxt 4（Nitro + Vite） |
| 视图 | Vue 3 `<script setup>`、Vue Router 5 |
| 状态 | Pinia |
| 请求 | Axios（浏览器）/ `$fetch` + `useAsyncData`（SSR） |
| 样式 | 原生 CSS（沿用旧站视觉） |
| 图标 | `@vicons/fa` + 轻量 `VIcon` 容器 |

## 目录结构

```text
moments-web/
├── app/
│   ├── api/              # 浏览器端 API 封装（Axios）
│   ├── assets/css/       # 全局样式与主题变量
│   ├── components/       # 业务组件（文章、评论、后台等）
│   ├── composables/      # useSeo / useGuestHeaders 等
│   ├── config/           # 表情、后台菜单配置
│   ├── layouts/          # default（前台）/ admin（后台）
│   ├── middleware/       # auth / admin 路由守卫
│   ├── pages/            # 文件路由（SSR 页面 + CSR 后台）
│   ├── plugins/          # 站点配置、主题
│   ├── store/            # Pinia stores
│   ├── types/            # 类型定义
│   ├── utils/            # SEO、时间、HTML 过滤等
│   ├── app.vue
│   └── error.vue         # 404 / 500
├── public/               # 静态资源（图片、表情包、favicon）
├── server/
│   ├── api/[...path].ts  # /api/** 反向代理到 moments-api
│   ├── routes/           # upload 代理、sitemap.xml、robots.txt、rss.xml
│   └── utils/api.ts      # 服务端访问 moments-api 的工具
├── nuxt.config.ts
└── package.json
```

## 快速开始

```bash
pnpm install
cp .env.example .env
pnpm dev          # 默认 http://localhost:3000
```

先启动 `moments-api`（默认 `http://localhost:9889`），再启动本项目。

### 环境变量

| 变量 | 说明 |
| --- | --- |
| `NUXT_API_PROXY_TARGET` | 服务端反向代理目标，默认 `http://127.0.0.1:9889`（不会下发到浏览器） |
| `NUXT_PUBLIC_SITE_URL` | 站点对外地址，用于 canonical / sitemap / RSS / OG。留空时自动使用请求 Origin |

浏览器端所有请求都走同源 `/api/**`，由 Nitro 转发到 `moments-api`：

- 没有跨域，`HttpOnly` Refresh Cookie 可以正常回传，登录态在拆分后依旧可用
- 服务端渲染时也能携带 Cookie 与游客标识（`moments_guest_id`）
- 本地存储的上传文件通过 `/upload/**` 代理访问
- 代理会透传 `X-Forwarded-Host` / `X-Forwarded-Proto`，`moments-api` 开启 `TRUST_PROXY` 后，
  Origin 校验与 OAuth 回调地址都会对齐用户实际访问的域名

## 渲染策略

| 路由 | 渲染方式 | 说明 |
| --- | --- | --- |
| `/` | SSR | 首页信息流，支持 `?tag=` 标签筛选 |
| `/article/:articleId` | SSR | 正文 + 评论 + 点赞人，404 返回真实 404 状态码 |
| `/home/:username` | SSR | 用户主页与按年份归档的内容 |
| `/links` | SSR（SWR 5 分钟） | 友情链接，无用户态数据 |
| `/search` | SSR（noindex） | 站内搜索，`?q=` 关键词 |
| `/post`、`/article/:articleId/edit` | CSR | 发布 / 编辑，需要登录 |
| `/profile`、`/notifications` | CSR | 个人资料、通知中心 |
| `/admin/**` | CSR | 后台管理，`robots: noindex` |

配置位置：`nuxt.config.ts` 的 `routeRules`。

## SEO 实现

- `app/composables/useSeo.ts`：统一输出 title / description / canonical / OG / Twitter / JSON-LD；站点名、描述、关键词、域名优先读后台「基础设置」，读不到时回退到环境变量
- `app/utils/seo.ts`：`BlogPosting`、`ProfilePage`、`WebSite`、`BreadcrumbList`、`ItemList` 构建器
- `server/routes/sitemap.xml.ts`：从 `moments-api` 的 `/api/sitemap` 拉取文章、用户、标签，动态生成站点地图
- `server/routes/robots.txt.ts`：放行公开页面，屏蔽 `/admin`、`/api`、`/upload` 与登录后页面，并声明 sitemap
- `server/routes/rss.xml.ts`：最新 50 篇内容的 RSS 2.0 订阅源
- 站点配置、sitemap 数据、RSS 文章列表都有 60–600 秒的进程内 TTL 缓存（`server/utils/ttl-cache.ts`），避免爬虫高频请求反复回源

## 性能与安全

- **按需加载登录弹窗**：Auth + hCaptcha + OAuth 逻辑只在打开时加载，不进入所有页面的首屏包
- **SSR 直连后端**：`useApiFetch()` 在服务端直接请求 `moments-api`（省掉 Nitro 代理一跳），浏览器端仍走同源代理
- **流式上传**：`/api/**` 代理开启 `streamRequest`，大文件不会在 Nitro 侧整包缓冲
- **压缩**：`h3-compression` 对 HTML/JSON/XML 做 gzip/brotli/zstd，不依赖前置 Nginx
- **缓存头**：`/img/**`、`/emojis/**` 7 天缓存；安全响应头由 `server/middleware/security-headers.ts` 统一设置
- **图片**：文章图、头像统一 `loading="lazy" decoding="async"`

## 常用命令

```bash
pnpm dev         # 开发（HMR）
pnpm build       # 生产构建（Nitro）
pnpm preview     # 预览构建产物
pnpm typecheck   # vue-tsc 类型检查
pnpm lint        # ESLint
pnpm test        # Vitest 单元测试（SEO / 时间 / HTML 白名单）
pnpm generate    # 纯静态预渲染（如需部署到静态托管）
```

## 部署

### Node 服务（推荐）

```bash
pnpm install --frozen-lockfile
pnpm build
NUXT_API_PROXY_TARGET=http://127.0.0.1:9889 \
NUXT_PUBLIC_SITE_URL=https://your-domain.com \
node .output/server/index.mjs
```

默认监听 3000 端口（可用 `PORT` / `HOST` 覆盖）。反向代理（Nginx / OpenResty）只需要把域名指到 Nuxt 服务，`/api` 与 `/upload` 由 Nuxt 内部转发，无需额外配置。

### Docker

```bash
docker build -t moments-web:latest .
docker run -d -p 3000:3000 \
  -e NUXT_API_PROXY_TARGET=http://moments-api:9889 \
  -e NUXT_PUBLIC_SITE_URL=https://your-domain.com \
  moments-web:latest
```

### 静态托管

`pnpm generate` 可以产出预渲染站点，但动态内容（新文章、评论）需要重新构建才能更新，因此更推荐 Node/SSR 部署。

## 常见问题

### `pnpm dev` 报 `options.hostname.toLowerCase is not a function`

`@nuxt/schema` 4.6.4 在未显式配置 `devServer.host` 时会把该值解析成 `{}`，而 `@nuxt/cli` 4.0.1
会直接对它调用 `.toLowerCase()`。本项目已通过以下方式规避：

- `devDependencies` 中固定 `@nuxt/cli@^4.0.3`（该版本已判断 `typeof hostname === 'string'`）
- 如果本地 `node_modules/.cache/nuxt/dev-server.json` 里还残留 `"hostname":{}`，删除该文件即可

### 开发环境 HTML 500：`event.req.headers.get is not a function`

`h3-compression` 的 peer 依赖默认会安装 h3 v2，而 Nuxt/Nitro 2.x 运行在 h3 v1 上。
`pnpm-workspace.yaml` 中已加 override：

```yaml
overrides:
  h3-compression>h3: 1.15.11
```

升级依赖后如果复现，执行一次 `pnpm install` 让 override 生效。

### 接口返回 502：`无法连接 moments-api`

`/api/**` 由 Nuxt 代理到 `moments-api`，502 表示代理连不上后端。依次检查：

1. 后端是否已启动：`curl http://127.0.0.1:9889/api` 应返回 `{"status":"success!"...}`
2. 后端端口是否与 `NUXT_API_PROXY_TARGET` 一致（默认 `http://127.0.0.1:9889`）
3. 后端是否因数据库未初始化而启动失败：查看 `moments-api` 终端日志，必要时先执行 `pnpm db:setup`

在仓库根目录执行 `./dev.sh` 会先做一次健康检查，并同时启动前后端。

### 端口 / 局域网访问

默认监听 `localhost:3000`。需要在手机上调试时：

```bash
pnpm dev --host 0.0.0.0
```
