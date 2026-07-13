/**
 * Generate Emby API markdown docs from official OpenAPI JSON.
 * Style aligned with reference/openai-115:
 * - Chinese category folders
 * - Chinese annotation in filenames
 * - Root folder should include Emby version, e.g. emby-api-4.9.5.0
 *
 * Usage: node reference/emby-api-4.9.5.0/_generate.cjs
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const KEEP = new Set([
  'openapi.json',
  'openapi-from-server-4.9.5.0.json',
  '_generate.cjs',
  '_generate.js',
]);
const j = JSON.parse(fs.readFileSync(path.join(root, 'openapi.json'), 'utf8'));

function esc(s) {
  return String(s == null ? '' : s).replace(/\r\n/g, '\n').trim();
}

const API_VERSION = esc(j.info?.version || 'unknown');
const ROOT_FOLDER = path.basename(root); // e.g. emby-api-4.9.5.0

/** Service 中文名 + 分类（对齐 115 的分目录风格；覆盖 4.9.x 服务面） */
const SERVICE_META = {
  ActivityLogService: { cn: '活动日志', cat: '通知与活动' },
  ArtistsService: { cn: '艺术家', cat: '元数据与分类' },
  AudioService: { cn: '音频流', cat: '播放与流媒体' },
  BackupApi: { cn: '备份', cat: '系统管理' },
  BifService: { cn: 'BIF缩略图', cat: '播放与流媒体' },
  BrandingService: { cn: '品牌定制', cat: '系统管理' },
  ChannelService: { cn: '频道', cat: '直播电视' },
  CodecParameterService: { cn: '编解码参数', cat: '系统管理' },
  CollectionService: { cn: '合集', cat: '媒体库与条目' },
  ConfigurationService: { cn: '服务器配置', cat: '系统管理' },
  ConnectService: { cn: 'EmbyConnect连接', cat: '接入认证' },
  ContentService: { cn: '内容访问', cat: '媒体库与条目' },
  DashboardService: { cn: '仪表盘', cat: '系统管理' },
  DeviceService: { cn: '设备管理', cat: '接入认证' },
  DisplayPreferencesService: { cn: '显示偏好', cat: '用户与偏好' },
  DlnaServerService: { cn: 'DLNA服务端', cat: 'DLNA' },
  DlnaService: { cn: 'DLNA配置', cat: 'DLNA' },
  DynamicHlsService: { cn: '动态HLS流', cat: '播放与流媒体' },
  EncodingInfoService: { cn: '转码信息', cat: '系统管理' },
  EnvironmentService: { cn: '运行环境', cat: '系统管理' },
  FeatureService: { cn: '功能特性', cat: '系统管理' },
  FfmpegOptionsService: { cn: 'FFmpeg选项', cat: '系统管理' },
  FilterService: { cn: '筛选器', cat: '媒体库与条目' },
  GameGenresService: { cn: '游戏类型', cat: '元数据与分类' },
  GamesService: { cn: '游戏', cat: '元数据与分类' },
  GenericUIApiService: { cn: '通用UI接口', cat: '系统管理' },
  GenresService: { cn: '类型标签', cat: '元数据与分类' },
  HlsSegmentService: { cn: 'HLS分段', cat: '播放与流媒体' },
  ImageByNameService: { cn: '按名称取图', cat: '图像' },
  ImageService: { cn: '图像资源', cat: '图像' },
  InstantMixService: { cn: '即时混播', cat: '播放与流媒体' },
  ItemLookupService: { cn: '条目元数据检索', cat: '媒体库与条目' },
  ItemRefreshService: { cn: '条目刷新', cat: '媒体库与条目' },
  ItemsService: { cn: '条目查询', cat: '媒体库与条目' },
  ItemUpdateService: { cn: '条目更新', cat: '媒体库与条目' },
  LibraryService: { cn: '媒体库浏览', cat: '媒体库与条目' },
  LibraryStructureService: { cn: '媒体库结构', cat: '媒体库与条目' },
  LiveStreamService: { cn: '直播流', cat: '直播电视' },
  LiveTvService: { cn: '直播电视', cat: '直播电视' },
  LocalizationService: { cn: '本地化', cat: '系统管理' },
  MediaInfoService: { cn: '媒体信息', cat: '播放与流媒体' },
  MoviesService: { cn: '电影', cat: '元数据与分类' },
  MusicGenresService: { cn: '音乐类型', cat: '元数据与分类' },
  NewsService: { cn: '新闻', cat: '元数据与分类' },
  NotificationsService: { cn: '通知', cat: '通知与活动' },
  OfficialRatingService: { cn: '分级', cat: '元数据与分类' },
  OpenApiService: { cn: 'OpenAPI规范', cat: '接入认证' },
  PackageService: { cn: '插件包', cat: '系统管理' },
  PartyService: { cn: '一起看', cat: '播放与流媒体' },
  PersonsService: { cn: '人物', cat: '元数据与分类' },
  PlaylistService: { cn: '播放列表', cat: '播放列表与同步' },
  PlaystateService: { cn: '播放状态', cat: '播放与流媒体' },
  PluginService: { cn: '插件管理', cat: '系统管理' },
  RemoteImageService: { cn: '远程图像', cat: '图像' },
  ReportsService: { cn: '报表', cat: '通知与活动' },
  ScheduledTaskService: { cn: '计划任务', cat: '系统管理' },
  SearchService: { cn: '搜索', cat: '媒体库与条目' },
  ServerApiEndpoints: { cn: '服务器API端点', cat: '系统管理' },
  ServerEndpoint: { cn: '服务器端点', cat: '系统管理' },
  SessionsService: { cn: '会话与遥控', cat: '播放与流媒体' },
  StudiosService: { cn: '制片厂', cat: '元数据与分类' },
  SubtitleOptionsService: { cn: '字幕选项', cat: '系统管理' },
  SubtitleService: { cn: '字幕', cat: '播放与流媒体' },
  SuggestionsService: { cn: '推荐', cat: '元数据与分类' },
  SyncService: { cn: '同步', cat: '播放列表与同步' },
  SystemService: { cn: '系统信息', cat: '系统管理' },
  TagService: { cn: '标签', cat: '元数据与分类' },
  ToneMapOptionsService: { cn: '色调映射选项', cat: '系统管理' },
  TrailersService: { cn: '预告片', cat: '元数据与分类' },
  TvShowsService: { cn: '电视剧', cat: '元数据与分类' },
  UniversalAudioService: { cn: '通用音频流', cat: '播放与流媒体' },
  UserActivityAPI: { cn: '用户活动', cat: '通知与活动' },
  UserLibraryService: { cn: '用户媒体库', cat: '媒体库与条目' },
  UserNotificationsService: { cn: '用户通知', cat: '通知与活动' },
  UserService: { cn: '用户管理', cat: '接入认证' },
  UserViewsService: { cn: '用户视图', cat: '媒体库与条目' },
  VideoHlsService: { cn: '视频HLS', cat: '播放与流媒体' },
  VideoService: { cn: '视频流', cat: '播放与流媒体' },
  VideosService: { cn: '视频附加', cat: '播放与流媒体' },
  WebAppService: { cn: 'Web应用', cat: '系统管理' },
};

/** 分类排序与说明 */
const CATEGORY_ORDER = [
  { name: '接入认证', desc: '登录、Token、设备、OpenAPI、Connect' },
  { name: '系统管理', desc: '服务器信息、配置、环境、插件、计划任务' },
  { name: '媒体库与条目', desc: '媒体库浏览、条目查询/更新/检索、搜索、合集' },
  { name: '元数据与分类', desc: '电影/剧集/人物/类型/标签/推荐等' },
  { name: '播放与流媒体', desc: '音视频流、HLS、播放状态、会话遥控、字幕' },
  { name: '图像', desc: '封面/海报/远程图像' },
  { name: '直播电视', desc: 'Live TV、频道' },
  { name: '播放列表与同步', desc: 'Playlist、Sync' },
  { name: '通知与活动', desc: '通知、活动日志、报表、用户活动' },
  { name: 'DLNA', desc: 'DLNA 服务与配置' },
  { name: '用户与偏好', desc: '显示偏好等用户侧设置' },
  { name: '其他', desc: '未归类服务' },
];

function metaOf(tag) {
  return SERVICE_META[tag] || { cn: tag, cat: '其他' };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function schemaType(schema) {
  if (!schema) return '';
  if (schema.$ref) return schema.$ref.split('/').pop();
  if (schema.type === 'array') {
    const item = schema.items ? schemaType(schema.items) : 'any';
    return `${item}[]`;
  }
  if (schema.enum) return `${schema.type || 'string'} enum(${schema.enum.join('|')})`;
  if (schema.nullable && schema.type) return `${schema.type}|null`;
  if (schema.allOf && schema.allOf.length) {
    return schema.allOf.map(schemaType).filter(Boolean).join(' & ') || 'object';
  }
  if (schema.oneOf && schema.oneOf.length) {
    return schema.oneOf.map(schemaType).filter(Boolean).join(' | ') || 'object';
  }
  return schema.type || (schema.properties ? 'object' : '');
}

function collectParams(op, pathItem) {
  const list = [];
  const base = [...(pathItem.parameters || []), ...(op.parameters || [])];
  for (const p of base) {
    if (p.$ref) {
      const name = p.$ref.split('/').pop();
      const resolved = j.components?.parameters?.[name];
      if (resolved) list.push(resolved);
      else list.push({ name, in: 'unknown', description: p.$ref, required: false, schema: {} });
      continue;
    }
    list.push(p);
  }
  return list;
}

function renderParamTable(params, where) {
  const filtered = params.filter((p) => p.in === where);
  if (!filtered.length) return '';
  const title =
    where === 'path' ? 'Path' : where === 'query' ? 'Query' : where === 'header' ? 'Headers' : where;
  let md = `\n**${title}**\n\n`;
  md += `| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  for (const p of filtered) {
    const type = schemaType(p.schema) || p.type || '';
    const def =
      p.schema?.default != null
        ? String(p.schema.default)
        : p.example != null
          ? String(p.example)
          : '';
    md += `| ${esc(p.name)} | ${p.required ? '是' : '否'} | ${esc(type)} | ${esc(def)} | ${esc(p.description)} |\n`;
  }
  return md + '\n';
}

function renderBody(op) {
  const body = op.requestBody;
  if (!body) return '';
  let md = `\n**Body**\n\n`;
  md += `- 是否必须：${body.required ? '是' : '否'}\n`;
  if (body.description) md += `- 描述：${esc(body.description)}\n`;
  const content = body.content || {};
  for (const [ct, media] of Object.entries(content)) {
    md += `- Content-Type：\`${ct}\`\n`;
    const t = schemaType(media.schema);
    if (t) md += `- Schema：\`${t}\`\n`;
    if (media.schema?.$ref) {
      const name = media.schema.$ref.split('/').pop();
      const sch = j.components?.schemas?.[name];
      if (sch?.properties) {
        md += `\n| 字段 | 类型 | 备注 |\n| --- | --- | --- |\n`;
        for (const [k, v] of Object.entries(sch.properties)) {
          md += `| ${k} | ${esc(schemaType(v))} | ${esc(v.description)} |\n`;
        }
        md += '\n';
      }
    } else if (media.schema?.properties) {
      md += `\n| 字段 | 类型 | 备注 |\n| --- | --- | --- |\n`;
      for (const [k, v] of Object.entries(media.schema.properties)) {
        md += `| ${k} | ${esc(schemaType(v))} | ${esc(v.description)} |\n`;
      }
      md += '\n';
    }
  }
  return md + '\n';
}

function renderResponses(op) {
  const responses = op.responses || {};
  if (!Object.keys(responses).length) return '';
  let md = `\n### 返回数据\n\n`;
  md += `| 状态码 | 描述 | Schema |\n| --- | --- | --- |\n`;
  for (const [code, resp] of Object.entries(responses)) {
    const desc = esc(resp.description);
    let sch = '';
    const content = resp.content || {};
    for (const media of Object.values(content)) {
      const t = schemaType(media.schema);
      if (t) {
        sch = t;
        break;
      }
    }
    if (!sch && resp.schema) sch = schemaType(resp.schema);
    md += `| ${code} | ${desc} | ${esc(sch)} |\n`;
  }
  for (const code of ['200', '201', '204']) {
    const resp = responses[code];
    if (!resp) continue;
    const content = resp.content || {};
    for (const media of Object.values(content)) {
      let schema = media.schema;
      if (schema?.$ref) {
        const name = schema.$ref.split('/').pop();
        schema = j.components?.schemas?.[name];
        if (schema?.properties) {
          md += `\n**${code} 字段说明（${name}）**\n\n`;
          md += `| 名称 | 类型 | 备注 |\n| --- | --- | --- |\n`;
          for (const [k, v] of Object.entries(schema.properties)) {
            md += `| ${k} | ${esc(schemaType(v))} | ${esc(v.description)} |\n`;
          }
          md += '\n';
        }
      } else if (schema?.properties) {
        md += `\n**${code} 字段说明**\n\n`;
        md += `| 名称 | 类型 | 备注 |\n| --- | --- | --- |\n`;
        for (const [k, v] of Object.entries(schema.properties)) {
          md += `| ${k} | ${esc(schemaType(v))} | ${esc(v.description)} |\n`;
        }
        md += '\n';
      }
    }
    break;
  }
  return md;
}

function authNote(op) {
  const desc = esc(op.description);
  if (/Requires authentication as admin/i.test(desc)) return '管理员认证';
  if (/Requires authentication as user/i.test(desc)) return '用户认证';
  if (/Requires authentication/i.test(desc)) return '需要认证';
  if (/No authentication required/i.test(desc)) return '无需认证';
  return desc || '见接口描述';
}

/** 文件名：中文-英文Service.md（便于一眼识别） */
function serviceFileName(tag) {
  const { cn } = metaOf(tag);
  return `${cn}-${tag}.md`;
}

const byTag = new Map();
let totalOps = 0;
for (const [p, pathItem] of Object.entries(j.paths || {})) {
  for (const [method, op] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) continue;
    totalOps++;
    const tag = (op.tags && op.tags[0]) || 'Other';
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push({ path: p, method, op, pathItem });
  }
}

// 清理旧产物，保留 openapi 与生成脚本
for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
  if (KEEP.has(ent.name)) continue;
  const full = path.join(root, ent.name);
  if (ent.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
  else fs.unlinkSync(full);
}

const indexRows = []; // { tag, cn, cat, count, relPath }
const sortedTags = [...byTag.keys()].sort((a, b) => a.localeCompare(b));

for (const tag of sortedTags) {
  const { cn, cat } = metaOf(tag);
  const ops = byTag.get(tag).sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.method.localeCompare(b.method);
  });

  let md = '';
  md += `# ${cn}（${tag}）\n\n`;
  md += `> Emby 版本：\`${API_VERSION}\` · 文档目录：\`${ROOT_FOLDER}\`\n`;
  md += `> 分类：${cat}\n`;
  md += `> 来源：用户 Emby Server 的官方 OpenAPI（\`GET {server}/openapi.json\`）\n`;
  md += `> 抓取基址：http://47.108.74.231:38096/openapi.json\n`;
  md += `> 规范版本：${API_VERSION} · 接口数：${ops.length}\n\n`;
  md += `## 接口列表\n\n`;
  md += `| Method | Path | operationId | 摘要 |\n| --- | --- | --- | --- |\n`;
  for (const { path: p, method, op } of ops) {
    md += `| ${method.toUpperCase()} | \`${p}\` | ${esc(op.operationId)} | ${esc(op.summary)} |\n`;
  }
  md += `\n---\n\n`;

  for (const { path: p, method, op, pathItem } of ops) {
    md += `## ${esc(op.operationId || `${method}_${p}`)}\n\n`;
    md += `### 基本信息\n`;
    md += `**Path：** ${method.toUpperCase()} 服务器地址 + ${p}\n\n`;
    md += `**Method：** ${method.toUpperCase()}\n\n`;
    md += `**接口描述：** ${esc(op.summary || op.description)}\n\n`;
    if (op.externalDocs?.url) {
      md += `**官方文档：** [${esc(op.externalDocs.description || 'Wiki')}](${op.externalDocs.url})\n\n`;
    }
    md += `**认证要求：** ${authNote(op)}\n\n`;
    md += `### 请求参数\n`;
    const params = collectParams(op, pathItem);
    const sections = ['header', 'path', 'query', 'cookie']
      .map((w) => renderParamTable(params, w))
      .join('');
    md += sections || '\n（无 Path/Query/Header 参数）\n\n';
    md += renderBody(op);
    md += renderResponses(op);
    md += `\n---\n\n`;
  }

  const dir = path.join(root, cat);
  ensureDir(dir);
  const fileName = serviceFileName(tag);
  fs.writeFileSync(path.join(dir, fileName), md, 'utf8');
  indexRows.push({
    tag,
    cn,
    cat,
    count: ops.length,
    relPath: `${cat}/${fileName}`,
  });
}

// schemas
let schemasMd = `# Schema 类型索引\n\n`;
schemasMd += `> 来自 OpenAPI components.schemas，共 ${Object.keys(j.components?.schemas || {}).length} 个类型。\n\n`;
schemasMd += `| 名称 | 类型 | 描述 |\n| --- | --- | --- |\n`;
const schemaNames = Object.keys(j.components?.schemas || {}).sort((a, b) => a.localeCompare(b));
for (const name of schemaNames) {
  const s = j.components.schemas[name];
  schemasMd += `| \`${name}\` | ${esc(s.type || (s.enum ? 'enum' : s.properties ? 'object' : ''))} | ${esc(s.description)} |\n`;
}
schemasMd += `\n## 字段详情\n\n`;
for (const name of schemaNames) {
  const s = j.components.schemas[name];
  schemasMd += `### ${name}\n\n`;
  if (s.description) schemasMd += `${esc(s.description)}\n\n`;
  if (s.enum) {
    schemasMd += `枚举值：${s.enum.map((v) => `\`${v}\``).join(', ')}\n\n`;
  }
  if (s.properties) {
    schemasMd += `| 字段 | 类型 | 备注 |\n| --- | --- | --- |\n`;
    for (const [k, v] of Object.entries(s.properties)) {
      schemasMd += `| ${k} | ${esc(schemaType(v))} | ${esc(v.description)} |\n`;
    }
    schemasMd += '\n';
  } else if (s.type && !s.enum) {
    schemasMd += `基础类型：\`${s.type}\`\n\n`;
  }
}
fs.writeFileSync(path.join(root, 'schemas.md'), schemasMd, 'utf8');

const authMd = `# Emby API 认证说明

> 来源：官方 OpenAPI securitySchemes + [dev.emby.media](https://dev.emby.media/) / [MediaBrowser Wiki](https://github.com/MediaBrowser/Emby/wiki)

## 1. ApiKey 认证（\`apikeyauth\`）

适用于外部应用、脚本、本项目媒体库同步等场景。

- 在 Server Dashboard 创建：\`Advanced > Security\`
- 传递方式（二选一）：
  1. Query：\`?api_key=YOUR_API_KEY\`
  2. Header：\`X-Emby-Token: YOUR_API_KEY\`

**示例**

\`\`\`http
GET /Items?Recursive=true&IncludeItemTypes=Movie&api_key=YOUR_API_KEY
\`\`\`

\`\`\`http
GET /Items?Recursive=true&IncludeItemTypes=Movie
X-Emby-Token: YOUR_API_KEY
\`\`\`

本仓库现有实现（\`src/features/embyLibrary/background/handlers.ts\`）使用 Query \`api_key\`。

相关文档：\`接入认证/用户管理-UserService.md\`、\`接入认证/OpenAPI规范-OpenApiService.md\`。

## 2. Emby User Authentication（\`embyauth\`）

通过用户名密码换取 access token，再以 Authorization / Token 头携带。

### 获取 Token

\`\`\`http
POST /Users/AuthenticateByName
Content-Type: application/json
X-Emby-Authorization: MediaBrowser Client="AppName", Device="DeviceName", DeviceId="xxx", Version="1.0.0"

{
  "Username": "user",
  "Pw": "password"
}
\`\`\`

### 后续请求

\`\`\`http
GET /Users/{UserId}/Items
X-Emby-Token: ACCESS_TOKEN
\`\`\`

## 3. 服务器基址

- 默认 REST 前缀：\`http(s)://host:port\` 或 \`http(s)://host:port/emby\`
- 本机也可从任意已运行的 Emby Server 拉取最新规范：
  - \`GET /openapi.json\`（OpenAPI 3）
  - \`GET /swagger.json\`（Swagger 2）

## 4. 权威文档入口

| 资源 | URL |
| --- | --- |
| 开发者门户 | https://dev.emby.media/ |
| REST 服务总览 | https://dev.emby.media/reference/RestAPI.html |
| 公共 Swagger UI | https://swagger.emby.media/ |
| 公共 OpenAPI JSON | https://swagger.emby.media/openapi.json |
| 官方 ApiClients | https://github.com/MediaBrowser/Emby.ApiClients |
| 认证 Wiki | https://github.com/MediaBrowser/Emby/wiki/User-Authentication |
| ApiKey Wiki | https://github.com/MediaBrowser/Emby/wiki/ApiKeyAuthentication |

## 5. 版本说明

- 文档主目录：\`${ROOT_FOLDER}\`（文件夹名含 Emby 版本号）
- 本目录 \`openapi.json\` 抓取自用户服务端 \`http://47.108.74.231:38096/openapi.json\`
- OpenAPI info.version = **${API_VERSION}**（与 \`/System/Info/Public\` 一致）
- 公共镜像 https://swagger.emby.media/openapi.json 仍停在 4.1.1.0，**不要当 4.9 权威**
- Server 升级后：重新拉取 openapi → 建议同步改目录名版本号 → \`node _generate.cjs\`
`;
fs.writeFileSync(path.join(root, '认证.md'), authMd, 'utf8');

const quick = `# 常用接口速查（本项目相关 · Emby ${API_VERSION}）

> 文档目录：\`${ROOT_FOLDER}\`
> 已验证：\`http://47.108.74.231:38096/System/Info/Public\` → Version=${API_VERSION}

## GET /System/Info/Public

公开服务器信息，**无需认证**。用于探测版本与连通性。

见 \`系统管理/系统信息-SystemService.md\` → \`getSystemInfoPublic\`。

## GET /System/Info

完整服务器信息，需要认证。

见 \`系统管理/系统信息-SystemService.md\` → \`getSystemInfo\`。

## GET /Items

按条件查询媒体项。**产品查影视库的主接口**（${API_VERSION} 仍在）。

| 参数 | 值 | 说明 |
| --- | --- | --- |
| Recursive | true | 递归 |
| IncludeItemTypes | Movie,Series,Episode | 电影/剧/集 |
| Fields | Path,ProviderIds,Overview,ProductionYear,UserData,PrimaryImageAspectRatio,ImageTags | 元数据与状态 |
| StartIndex / Limit | 分页 | 大库必用 |
| SearchTerm | 可选 | 关键字（可替代旧 Search/Hints） |
| api_key | *** | ApiKey |

见 \`媒体库与条目/条目查询-ItemsService.md\` → \`getItems\`。

## GET /Users/{UserId}/Items

用户视图下的条目查询（权限按用户过滤）。

见 \`媒体库与条目/条目查询-ItemsService.md\` → \`getUsersByUseridItems\`。

## GET /Users/{UserId}/Views

用户可见的媒体库视图。

见 \`媒体库与条目/用户视图-UserViewsService.md\`。

## GET /Library/MediaFolders

媒体文件夹列表。

见 \`媒体库与条目/媒体库浏览-LibraryService.md\`。

## POST /Users/AuthenticateByName

用户名密码登录换 Token（交互式客户端；服务集成更推荐 ApiKey）。

见 \`接入认证/用户管理-UserService.md\`。

## POST /Library/Refresh

触发媒体库扫描（管理员）。

见 \`媒体库与条目/媒体库浏览-LibraryService.md\`。

## 相对旧公共 4.1.1 文档

- 公共 swagger 停在 4.1.1，本目录以 **${API_VERSION}** 服务端规范为准。
- 4.9 上搜索优先用 \`/Items?SearchTerm=\`。
`;
fs.writeFileSync(path.join(root, '常用接口.md'), quick, 'utf8');

// 按分类汇总
const byCat = new Map();
for (const row of indexRows) {
  if (!byCat.has(row.cat)) byCat.set(row.cat, []);
  byCat.get(row.cat).push(row);
}

let readme = `# Emby Server API 文档（${API_VERSION}）

> **主目录名含版本号**：\`reference/${ROOT_FOLDER}/\`
> 对应服务端：\`http://47.108.74.231:38096\` · OpenAPI \`info.version=${API_VERSION}\`

按 \`reference/openai-115\` 的风格：

- **中文分类目录**（如「媒体库与条目」「播放与流媒体」）
- **文件名带中文注释**（如 \`条目查询-ItemsService.md\`）
- 内容由 **该版本服务器官方** OpenAPI 生成（不是过时的公共 4.1.1 镜像）

## 来源（权威 · ${API_VERSION}）

1. **OpenAPI 3 规范（原始文件）**：[\`openapi.json\`](./openapi.json)
   - 抓取自：\`GET http://47.108.74.231:38096/openapi.json\`
   - 备份副本：[\`openapi-from-server-4.9.5.0.json\`](./openapi-from-server-4.9.5.0.json)
   - 标题：${esc(j.info?.title)}
   - 版本：${API_VERSION}（与 \`/System/Info/Public\` 一致）
2. **服务器规范入口**：\`GET {server}/openapi.json\` / \`GET {server}/swagger.json\`
3. **开发者门户（概念文档）**：https://dev.emby.media/
4. **公共 Swagger 镜像已过时**（仍为 4.1.1.0，勿再当权威）：https://swagger.emby.media/openapi.json

> 升级 Server 后：重新拉取 openapi，建议把本目录改名为 \`emby-api-<新版本>\`，再运行 \`node _generate.cjs\`。

## 统计

- Emby 版本：${API_VERSION}
- Path 数：${Object.keys(j.paths || {}).length}
- Operation 数：${totalOps}
- Schema 数：${Object.keys(j.components?.schemas || {}).length}
- Service 数：${sortedTags.length}
- 分类数：${byCat.size}

## 目录结构

\`\`\`
reference/${ROOT_FOLDER}/
├── README.md
├── 认证.md
├── 常用接口.md
├── schemas.md
├── openapi.json
├── openapi-from-server-4.9.5.0.json
├── _generate.cjs
├── 接入认证/
│   ├── 用户管理-UserService.md
│   └── ...
├── 系统管理/
├── 媒体库与条目/
│   └── 条目查询-ItemsService.md   ← 本项目主要用这个
├── 元数据与分类/
├── 播放与流媒体/
├── 图像/
├── 直播电视/
├── 播放列表与同步/
├── 通知与活动/
├── DLNA/
└── 用户与偏好/
\`\`\`

## 分类一览

| 分类 | 说明 | 服务数 |
| --- | --- | ---: |
`;

for (const cat of CATEGORY_ORDER) {
  const rows = byCat.get(cat.name) || [];
  if (!rows.length) continue;
  readme += `| ${cat.name} | ${cat.desc} | ${rows.length} |\n`;
}

readme += `\n## 按分类的服务列表\n`;

for (const cat of CATEGORY_ORDER) {
  const rows = (byCat.get(cat.name) || []).sort((a, b) => a.cn.localeCompare(b.cn, 'zh'));
  if (!rows.length) continue;
  readme += `\n### ${cat.name}\n\n`;
  readme += `${cat.desc}\n\n`;
  readme += `| 中文 | Service | 接口数 | 文档 |\n| --- | --- | ---: | --- |\n`;
  for (const row of rows) {
    readme += `| ${row.cn} | \`${row.tag}\` | ${row.count} | [${path.posix.basename(row.relPath)}](./${row.relPath.replace(/\\/g, '/')}) |\n`;
  }
}

// 未在 CATEGORY_ORDER 中的分类
for (const [catName, rows] of byCat.entries()) {
  if (CATEGORY_ORDER.some((c) => c.name === catName)) continue;
  readme += `\n### ${catName}\n\n`;
  readme += `| 中文 | Service | 接口数 | 文档 |\n| --- | --- | ---: | --- |\n`;
  for (const row of rows.sort((a, b) => a.cn.localeCompare(b.cn, 'zh'))) {
    readme += `| ${row.cn} | \`${row.tag}\` | ${row.count} | [${path.posix.basename(row.relPath)}](./${row.relPath.replace(/\\/g, '/')}) |\n`;
  }
}

readme += `
## 单接口文档格式（对齐 115）

每个接口包含：

- 基本信息（Path / Method / 描述）
- 认证要求
- 请求参数（Headers / Path / Query / Body）
- 返回数据（状态码 + Schema 字段）

## 与本项目的关系

当前扩展主要通过 ApiKey 调用：

\`\`\`http
GET {server}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path,PrimaryImageAspectRatio,ImageTags&api_key=***
\`\`\`

对应文档：\`媒体库与条目/条目查询-ItemsService.md\` 中的 \`getItems\`。

## 重新生成

\`\`\`powershell
# 用目标 Emby（建议与目录版本号一致）覆盖 openapi
curl.exe -L -o reference/${ROOT_FOLDER}/openapi.json "http://YOUR_EMBY:8096/openapi.json"

# 重新生成全部分类 Markdown
node reference/${ROOT_FOLDER}/_generate.cjs
\`\`\`

Server 大版本升级时，建议复制/改名为 \`reference/emby-api-<新版本>/\`，避免不同版本文档混在同一目录。
`;
fs.writeFileSync(path.join(root, 'README.md'), readme, 'utf8');

// 每个分类目录写一个 README，方便浏览
for (const cat of CATEGORY_ORDER) {
  const rows = (byCat.get(cat.name) || []).sort((a, b) => a.cn.localeCompare(b.cn, 'zh'));
  if (!rows.length) continue;
  let catReadme = `# ${cat.name}\n\n`;
  catReadme += `> Emby 版本：\`${API_VERSION}\` · 文档目录：\`${ROOT_FOLDER}\`\n\n`;
  catReadme += `${cat.desc}\n\n`;
  catReadme += `| 中文 | 英文 Service | 接口数 | 文件 |\n| --- | --- | ---: | --- |\n`;
  for (const row of rows) {
    const base = path.posix.basename(row.relPath.replace(/\\/g, '/'));
    catReadme += `| ${row.cn} | \`${row.tag}\` | ${row.count} | [${base}](./${base}) |\n`;
  }
  catReadme += `\n返回上级：[../README.md](../README.md)\n`;
  fs.writeFileSync(path.join(root, cat.name, 'README.md'), catReadme, 'utf8');
}

console.log(
  JSON.stringify(
    {
      services: sortedTags.length,
      ops: totalOps,
      schemas: schemaNames.length,
      categories: [...byCat.keys()].sort(),
      version: j.info?.version,
    },
    null,
    2,
  ),
);
