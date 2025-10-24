#!/usr/bin/env bash

# JavDB Extension - Interactive Build Assistant (Bash)
# 提供与 PowerShell 版本相近的交互菜单：
# 1) 大版本 2) 小版本 3) 修订号 4) 仅构建 5) 仅发布（自动备注） 6) 退出

set -euo pipefail
IFS=$'\n\t'

# ----- Colors -----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

# ----- Paths -----
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
ZIP_DIR="$ROOT_DIR/dist-zip"
VER_JSON="$ROOT_DIR/version.json"
PKG_JSON="$ROOT_DIR/package.json"
MANIFEST_JSON="$ROOT_DIR/src/manifest.json"

# ----- Utils -----
info() { printf "%b%s%b\n" "$CYAN" "$1" "$NC"; }
ok()   { printf "%b%s%b\n" "$GREEN" "$1" "$NC"; }
warn() { printf "%b%s%b\n" "$YELLOW" "$1" "$NC"; }
err()  { printf "%b%s%b\n" "$RED" "$1" "$NC"; }
ask()  { read -r -p "$1 " _ans; echo "${_ans:-}"; }
have() { command -v "$1" >/dev/null 2>&1; }

read_version() {
  node -e "const fs=require('fs');const p='$VER_JSON';if(!fs.existsSync(p)){process.exit(1)};const j=JSON.parse(fs.readFileSync(p,'utf8'));console.log(j.version||'0.0.0')" 2>/dev/null || echo "0.0.0"
}

bump_version() {
  local mode="$1" # major|minor|patch
  node - "$VER_JSON" "$PKG_JSON" "$mode" <<'NODE'
const fs=require('fs');
const [verPath,pkgPath,mode]=process.argv.slice(2);
function saveJSON(p, obj){fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n');}
const ver=JSON.parse(fs.readFileSync(verPath,'utf8'));
let {major=0,minor=0,patch=0,build=1}=ver;
if(mode==='major'){major++;minor=0;patch=0;build=1}
else if(mode==='minor'){minor++;patch=0;build=1}
else {patch++;}
const version=`${major}.${minor}.${patch}`;
ver.major=major;ver.minor=minor;ver.patch=patch;ver.build=build;ver.version=version;
saveJSON(verPath, ver);
// sync package.json version (optional)
try{const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));pkg.version=version;saveJSON(pkgPath,pkg);}catch{}
console.log(version);
NODE
}

zip_name=""
zip_dist() {
  local version="$1"
  mkdir -p "$ZIP_DIR"
  if have zip; then
    zip_name="javdb-extension-${version}.zip"
    local out="$ZIP_DIR/$zip_name"
    [[ -f "$out" ]] && rm -f "$out"
    info "Zipping dist -> $out"
    (cd "$DIST_DIR" && zip -qr "$out" .)
    ok "ZIP created: $out"
  else
    zip_name="javdb-extension-${version}.tar.gz"
    local out="$ZIP_DIR/$zip_name"
    [[ -f "$out" ]] && rm -f "$out"
    info "Archiving dist (tar.gz) -> $out"
    (cd "$DIST_DIR" && tar -czf "$out" .)
    ok "TAR.GZ created: $out"
  fi
}

install_and_build() {
  if ! have node; then err "需要 Node.js"; exit 1; fi
  if ! have pnpm; then err "需要 pnpm (npm i -g pnpm)"; exit 1; fi
  info "Installing dependencies (pnpm install)"
  pnpm install --frozen-lockfile || pnpm install
  info "Building via Vite"
  pnpm vite build
}

tag_and_push() {
  local tag="$1"
  if ! have git; then warn "未检测到 git，跳过打 tag"; return 0; fi
  if git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
    warn "标签已存在：$tag（跳过创建）"
  else
    info "创建标签：$tag"
    git add "$VER_JSON" "$PKG_JSON" || true
    git commit -m "chore: release $tag" || true
    git tag -a "$tag" -m "Release $tag"
  fi
  info "Push commits & tags"
  git push || true
  git push --tags || true
}

create_release_auto() {
  local tag="$1"; local asset="$2"
  if ! have gh; then warn "未检测到 GitHub CLI (gh)，跳过创建 Release"; return 0; fi
  info "创建 GitHub Release（自动备注）: $tag"
  gh release create "$tag" "$asset" --title "Release $tag" --generate-notes || true
}

show_menu() {
  echo "================================================="
  echo " JavDB Extension - Interactive Build Assistant"
  echo "================================================="
  echo ""
  echo "请选择构建类型："
  echo "  [1] Major Release（不兼容变更）"
  echo "  [2] Minor Release（新增功能）"
  echo "  [3] Patch Release（修复补丁）"
  echo "  [4] Just Build（仅构建，不改版本）"
  echo "  [5] Release Only（仅发布，自动备注）"
  echo "  [6] 退出"
}

main() {
  show_menu
  local choice
  read -r -p "输入你的选择 (1-6) [4]: " choice
  choice="${choice:-4}"
  case "$choice" in
    1|2|3)
      local mode="patch"
      [[ "$choice" == "1" ]] && mode="major"
      [[ "$choice" == "2" ]] && mode="minor"
      echo ""
      warn "选择了 $mode 发布，将创建新的 git 提交与 tag。"
      local confirm; confirm=$(ask "确认执行吗？(y/n) [Y]:")
      [[ -z "$confirm" ]] && confirm="Y"
      if [[ ! "$confirm" =~ ^[Yy]$ ]]; then warn "已取消"; exit 0; fi
      info "更新版本号 (version.json & package.json)"
      local newv
      newv=$(bump_version "$mode")
      info "新版本：$newv"
      install_and_build
      if [[ ! -d "$DIST_DIR" ]]; then err "构建失败：缺少 dist/"; exit 1; fi
      zip_dist "$newv"
      # 是否创建 release
      local doRel; doRel=$(ask "现在创建 GitHub Release 吗？(y/n) [N]:")
      doRel="${doRel:-N}"
      local tag="v${newv}"
      if [[ "$doRel" =~ ^[Yy]$ ]]; then
        tag_and_push "$tag"
        create_release_auto "$tag" "$ZIP_DIR/$zip_name"
      else
        ok "已跳过 Release。你可以稍后手动运行：git tag/push 或 gh release create"
      fi
      ;;
    4)
      info "仅构建"
      install_and_build
      local v; v=$(read_version)
      zip_dist "$v"
      ;;
    5)
      info "仅发布（自动备注）"
      local v; v=$(read_version)
      local tag="v${v}"
      local asset_zip="$ZIP_DIR/javdb-extension-${v}.zip"
      local asset_tgz="$ZIP_DIR/javdb-extension-${v}.tar.gz"
      local asset=""
      if [[ -f "$asset_zip" ]]; then asset="$asset_zip"; elif [[ -f "$asset_tgz" ]]; then asset="$asset_tgz"; fi
      if [[ -z "$asset" ]]; then err "未找到打包产物，请先选择 [4] 仅构建。"; exit 1; fi
      tag_and_push "$tag"
      create_release_auto "$tag" "$asset"
      ;;
    6)
      exit 0
      ;;
    *)
      err "无效的选项"
      exit 1
      ;;
  esac
  echo ""
  ok "完成"
}

main "$@"
