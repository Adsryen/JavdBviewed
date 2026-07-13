/**
 * Generate Jellyfin API markdown docs from official OpenAPI JSON.
 * Style aligned with reference/openai-115 and reference/emby-api-*:
 * - Chinese category folders
 * - Chinese annotation in filenames
 * - Root folder includes server/API version, e.g. jellyfin-api-12.0.0
 *
 * Usage: node reference/jellyfin-api-12.0.0/_generate.cjs
 *
 * Official source:
 *   https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const KEEP = new Set([
  'openapi.json',
  'openapi-from-official-stable-12.0.0.json',
  '_generate.cjs',
  '_generate.js',
]);
const j = JSON.parse(fs.readFileSync(path.join(root, 'openapi.json'), 'utf8'));

function esc(s) {
  return String(s == null ? '' : s).replace(/\r\n/g, '\n').trim();
}

const API_VERSION = esc(j.info?.version || 'unknown');
const ROOT_FOLDER = path.basename(root);
const OFFICIAL_OPENAPI_URL = 'https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json';

/** Tag 中文名 + 分类（对齐 Emby 文档分目录） */
const SERVICE_META = {
  Artist: { cn: '艺术家', cat: '元数据与分类' },
  Audio: { cn: '音频流', cat: '播放与流媒体' },
  Authentication: { cn: '认证', cat: '接入认证' },
  Backup: { cn: '备份', cat: '系统管理' },
  Branding: { cn: '品牌定制', cat: '系统管理' },
  Channel: { cn: '频道', cat: '直播电视' },
  Collection: { cn: '合集', cat: '媒体库与条目' },
  Device: { cn: '设备管理', cat: '接入认证' },
  DisplayPreference: { cn: '显示偏好', cat: '用户与偏好' },
  Environment: { cn: '运行环境', cat: '系统管理' },
  Filter: { cn: '筛选器', cat: '媒体库与条目' },
  Genre: { cn: '类型标签', cat: '元数据与分类' },
  Image: { cn: '图像资源', cat: '图像' },
  InstantMix: { cn: '即时混播', cat: '播放与流媒体' },
  ItemLookup: { cn: '条目元数据检索', cat: '媒体库与条目' },
  ItemUpdate: { cn: '条目更新', cat: '媒体库与条目' },
  Library: { cn: '媒体库与条目', cat: '媒体库与条目' },
  LibraryStructure: { cn: '媒体库结构', cat: '媒体库与条目' },
  LiveTv: { cn: '直播电视', cat: '直播电视' },
  Localization: { cn: '本地化', cat: '系统管理' },
  Lyric: { cn: '歌词', cat: '播放与流媒体' },
  MediaInfo: { cn: '媒体信息', cat: '播放与流媒体' },
  MediaSegment: { cn: '媒体片段', cat: '播放与流媒体' },
  Movie: { cn: '电影', cat: '元数据与分类' },
  MusicGenre: { cn: '音乐类型', cat: '元数据与分类' },
  Person: { cn: '人物', cat: '元数据与分类' },
  Playlist: { cn: '播放列表', cat: '播放列表与同步' },
  Plugin: { cn: '插件管理', cat: '系统管理' },
  RemoteImage: { cn: '远程图像', cat: '图像' },
  ScheduledTask: { cn: '计划任务', cat: '系统管理' },
  Search: { cn: '搜索', cat: '媒体库与条目' },
  Session: { cn: '会话与遥控', cat: '播放与流媒体' },
  Show: { cn: '电视剧', cat: '元数据与分类' },
  Startup: { cn: '启动向导', cat: '系统管理' },
  Studio: { cn: '制片厂', cat: '元数据与分类' },
  Subtitle: { cn: '字幕', cat: '播放与流媒体' },
  Suggestion: { cn: '推荐', cat: '元数据与分类' },
  SyncPlay: { cn: '同步播放', cat: '播放与流媒体' },
  System: { cn: '系统信息', cat: '系统管理' },
  Trailer: { cn: '预告片', cat: '元数据与分类' },
  TrickPlay: { cn: '预览图轨', cat: '播放与流媒体' },
  User: { cn: '用户管理', cat: '接入认证' },
  UserData: { cn: '用户数据', cat: '用户与偏好' },
  UserView: { cn: '用户视图', cat: '媒体库与条目' },
  Video: { cn: '视频流', cat: '播放与流媒体' },
  Year: { cn: '年份', cat: '元数据与分类' },
};

const CATEGORY_ORDER = [
  { name: '接入认证', desc: '登录、Token、设备、认证' },
  { name: '系统管理', desc: '服务器信息、配置、环境、插件、计划任务、备份' },
  { name: '媒体库与条目', desc: '媒体库浏览、条目查询/更新/检索、搜索、合集、视图' },
  { name: '元数据与分类', desc: '电影/剧集/人物/类型/标签/推荐等' },
  { name: '播放与流媒体', desc: '音视频流、会话遥控、字幕、同步播放、预览图' },
  { name: '图像', desc: '封面/海报/远程图像' },
  { name: '直播电视', desc: 'Live TV、频道' },
  { name: '播放列表与同步', desc: 'Playlist' },
  { name: '用户与偏好', desc: '显示偏好、用户数据' },
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
  if (/Requires authentication as admin|administrator/i.test(desc)) return '管理员认证';
  if (/Requires authentication as user/i.test(desc)) return '用户认证';
  if (/Requires authentication/i.test(desc)) return '需要认证';
  if (/No authentication required|allows anonymous/i.test(desc)) return '无需认证';
  // Jellyfin often puts auth in security
  if (op.security && op.security.length === 0) return '可能无需认证（security 为空）';
  if (op.security == null && j.security) return '默认需要认证（见全局 security）';
  return desc || '见接口描述 / CustomAuthentication';
}

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

for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
  if (KEEP.has(ent.name)) continue;
  const full = path.join(root, ent.name);
  if (ent.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
  else fs.unlinkSync(full);
}

const indexRows = [];
const sortedTags = [...byTag.keys()].sort((a, b) => a.localeCompare(b));

for (const tag of sortedTags) {
  const { cn, cat } = metaOf(tag);
  const ops = byTag.get(tag).sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.method.localeCompare(b.method);
  });

  let md = '';
  md += `# ${cn}（${tag}）\n\n`;
  md += `> Jellyfin API 版本：\`${API_VERSION}\` · 文档目录：\`${ROOT_FOLDER}\`\n`;
  md += `> 分类：${cat}\n`;
  md += `> 来源：Jellyfin 官方 OpenAPI（[${OFFICIAL_OPENAPI_URL}](${OFFICIAL_OPENAPI_URL})）\n`;
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
      md += `**官方文档：** [${esc(op.externalDocs.description || 'Docs')}](${op.externalDocs.url})\n\n`;
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
let schemasMd = `# Schema 类型索引（Jellyfin ${API_VERSION}）\n\n`;
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

const sec = j.components?.securitySchemes || {};
const secDesc = Object.entries(sec)
  .map(([k, v]) => `- \`${k}\`（${v.type || ''}）：${esc(v.description || v.scheme || v.name || '')}`)
  .join('\n');

const authMd = `# Jellyfin API 认证说明

> 来源：官方 OpenAPI securitySchemes（API ${API_VERSION}）+ Jellyfin 文档

## 1. CustomAuthentication

Jellyfin 使用 \`CustomAuthentication\`，常见传 Token 方式：

1. Header：\`Authorization: MediaBrowser Token="YOUR_TOKEN"\`（完整客户端头还含 Client/Device/DeviceId/Version）
2. Header：\`X-Emby-Token: YOUR_TOKEN\`（兼容历史命名）
3. Query：\`?api_key=YOUR_TOKEN\`（部分场景）

OpenAPI 登记的 securitySchemes：

${secDesc || '（见 openapi.json components.securitySchemes）'}

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

响应中的 \`AccessToken\` 用于后续请求。

### 后续请求示例

\`\`\`http
GET /Items?Recursive=true&IncludeItemTypes=Movie
X-Emby-Token: ACCESS_TOKEN
\`\`\`

## 2. 与 Emby / 本项目的关系

- Jellyfin 与 Emby 同源，**大量路径兼容**（如 \`/Items\`、\`/System/Info/Public\`），但**不是同一份规范**。
- 本仓库 \`embyLibrary\` 已支持 \`type: 'jellyfin'\`，默认仍用 ApiKey/Token + \`/Items\`。
- 集成时请以本目录 **Jellyfin ${API_VERSION}** 文档为准，不要混用 Emby 4.9.5 的 path 全集。

## 3. 服务器基址

- 常见：\`http(s)://host:8096\`
- 本机也可：\`GET {server}/openapi\` / Dashboard API 文档
- 官方稳定 OpenAPI 索引：https://api.jellyfin.org/openapi/

## 4. 权威文档入口

| 资源 | URL |
| --- | --- |
| 官方 OpenAPI 索引 | https://api.jellyfin.org/openapi/ |
| 稳定 OpenAPI JSON | ${OFFICIAL_OPENAPI_URL} |
| Jellyfin 文档 | https://jellyfin.org/docs/ |
| 本目录快照 | \`openapi.json\`（version=${API_VERSION}） |

## 5. 版本说明

- 文档主目录：\`${ROOT_FOLDER}\`
- 当前快照来自官方 **stable** 通道
- Server 升级后：重新下载 openapi → 建议改目录名版本号 → \`node _generate.cjs\`
`;
fs.writeFileSync(path.join(root, '认证.md'), authMd, 'utf8');

const quick = `# 常用接口速查（本项目相关 · Jellyfin ${API_VERSION}）

> 文档目录：\`${ROOT_FOLDER}\`
> 官方来源：${OFFICIAL_OPENAPI_URL}

## GET /System/Info/Public

公开服务器信息，通常无需认证。用于探测版本与连通性。

见 \`系统管理/系统信息-System.md\`。

## GET /System/Info

完整服务器信息，需要认证。

见 \`系统管理/系统信息-System.md\`。

## GET /Items

按条件查询媒体项。**产品查影视库的主接口**。

| 参数 | 值 | 说明 |
| --- | --- | --- |
| Recursive | true | 递归 |
| IncludeItemTypes | Movie,Series,Episode | 电影/剧/集 |
| Fields | Path,ProviderIds,Overview,ProductionYear,UserData,PrimaryImageAspectRatio,ImageTags | 元数据与状态 |
| StartIndex / Limit | 分页 | 大库必用 |
| SearchTerm | 可选 | 关键字 |
| api_key / X-Emby-Token | *** | Token |

见 \`媒体库与条目/媒体库与条目-Library.md\`（Jellyfin 的 Items 多挂在 Library 等 tag 下，以生成文档为准）。

## GET /Users/{userId}/Items

用户视图下的条目查询。

## GET /UserViews 或 /Users/{userId}/Views

用户可见媒体库视图（以本版 openapi 实际 path 为准）。

## POST /Users/AuthenticateByName

用户名密码登录换 Token。

见 \`接入认证/用户管理-User.md\` / \`接入认证/认证-Authentication.md\`。

## 搜索

见 \`媒体库与条目/搜索-Search.md\`，或 \`/Items?SearchTerm=\`。

## 与 Emby 对照

| 能力 | Jellyfin | Emby 文档位置 |
| --- | --- | --- |
| 权威规格 | 本目录 ${API_VERSION} | \`reference/emby-api-4.9.5.0\` |
| 查库主路径 | \`/Items\` | \`/Items\` |
| 认证 | CustomAuthentication / Token | ApiKey 或 User Token |
`;
fs.writeFileSync(path.join(root, '常用接口.md'), quick, 'utf8');

const byCat = new Map();
for (const row of indexRows) {
  if (!byCat.has(row.cat)) byCat.set(row.cat, []);
  byCat.get(row.cat).push(row);
}

let readme = `# Jellyfin API 文档（${API_VERSION}）

> **主目录名含版本号**：\`reference/${ROOT_FOLDER}/\`
> 官方稳定 OpenAPI：${OFFICIAL_OPENAPI_URL}
> OpenAPI \`info.version=${API_VERSION}\`

按 \`reference/openai-115\` / Emby 文档的风格：

- **中文分类目录**
- **文件名带中文注释**（如 \`系统信息-System.md\`）
- 内容由 **Jellyfin 官方** OpenAPI 生成

## 来源（权威 · ${API_VERSION}）

1. **OpenAPI 3 规范**：[\`openapi.json\`](./openapi.json)
   - 下载自：${OFFICIAL_OPENAPI_URL}
   - 备份：[\`openapi-from-official-stable-12.0.0.json\`](./openapi-from-official-stable-12.0.0.json)
   - 标题：${esc(j.info?.title)}
   - 版本：${API_VERSION}
2. **官方索引**：https://api.jellyfin.org/openapi/
3. **文档站**：https://jellyfin.org/docs/
4. **Emby 对照文档**（另一套，勿混）：\`reference/emby-api-4.9.5.0/\`

## 统计

- API 版本：${API_VERSION}
- Path 数：${Object.keys(j.paths || {}).length}
- Operation 数：${totalOps}
- Schema 数：${Object.keys(j.components?.schemas || {}).length}
- Tag/服务数：${sortedTags.length}
- 分类数：${byCat.size}

## 目录结构

\`\`\`
reference/${ROOT_FOLDER}/
├── README.md
├── 认证.md
├── 常用接口.md
├── schemas.md
├── openapi.json
├── _generate.cjs
├── 接入认证/
├── 系统管理/
├── 媒体库与条目/
├── 元数据与分类/
├── 播放与流媒体/
├── 图像/
├── 直播电视/
├── 播放列表与同步/
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
  readme += `| 中文 | Tag | 接口数 | 文档 |\n| --- | --- | ---: | --- |\n`;
  for (const row of rows) {
    readme += `| ${row.cn} | \`${row.tag}\` | ${row.count} | [${path.posix.basename(row.relPath)}](./${row.relPath.replace(/\\/g, '/')}) |\n`;
  }
}

for (const [catName, rows] of byCat.entries()) {
  if (CATEGORY_ORDER.some((c) => c.name === catName)) continue;
  readme += `\n### ${catName}\n\n`;
  readme += `| 中文 | Tag | 接口数 | 文档 |\n| --- | --- | ---: | --- |\n`;
  for (const row of rows.sort((a, b) => a.cn.localeCompare(b.cn, 'zh'))) {
    readme += `| ${row.cn} | \`${row.tag}\` | ${row.count} | [${path.posix.basename(row.relPath)}](./${row.relPath.replace(/\\/g, '/')}) |\n`;
  }
}

readme += `
## 与本项目的关系

当前扩展媒体库同步主要通过 Token/ApiKey 调用：

\`\`\`http
GET {server}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path,PrimaryImageAspectRatio,ImageTags&api_key=***
\`\`\`

配置里 \`type: 'jellyfin'\` 时走同一套 Items 查询逻辑，但请以 **本 Jellyfin 文档** 校验字段与鉴权细节。

## 重新生成

\`\`\`powershell
curl.exe -L -o reference/${ROOT_FOLDER}/openapi.json "${OFFICIAL_OPENAPI_URL}"
node reference/${ROOT_FOLDER}/_generate.cjs
\`\`\`

大版本升级时，建议改名为 \`reference/jellyfin-api-<新版本>/\`。
`;
fs.writeFileSync(path.join(root, 'README.md'), readme, 'utf8');

for (const cat of CATEGORY_ORDER) {
  const rows = (byCat.get(cat.name) || []).sort((a, b) => a.cn.localeCompare(b.cn, 'zh'));
  if (!rows.length) continue;
  let catReadme = `# ${cat.name}\n\n`;
  catReadme += `> Jellyfin API 版本：\`${API_VERSION}\` · 文档目录：\`${ROOT_FOLDER}\`\n\n`;
  catReadme += `${cat.desc}\n\n`;
  catReadme += `| 中文 | Tag | 接口数 | 文件 |\n| --- | --- | ---: | --- |\n`;
  for (const row of rows) {
    const base = path.posix.basename(row.relPath.replace(/\\/g, '/'));
    catReadme += `| ${row.cn} | \`${row.tag}\` | ${row.count} | [${base}](./${base}) |\n`;
  }
  catReadme += `\n返回上级：[../README.md](../README.md)\n`;
  fs.writeFileSync(path.join(root, cat.name, 'README.md'), catReadme, 'utf8');
}

// unknown tags report
const unknown = sortedTags.filter((t) => !SERVICE_META[t]);
console.log(
  JSON.stringify(
    {
      product: 'Jellyfin',
      version: API_VERSION,
      services: sortedTags.length,
      ops: totalOps,
      schemas: schemaNames.length,
      categories: [...byCat.keys()].sort(),
      unknownTags: unknown,
    },
    null,
    2,
  ),
);
