#!/usr/bin/env bash

# Simple builder for javdb-extension
# - Installs deps
# - Builds via Vite
# - Zips dist to dist-zip/javdb-extension-<version>.zip

set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

root_dir="$(cd "$(dirname "$0")" && pwd)"
# Default: we'll handle interactive menu inside this script; no external exec
dist_dir="$root_dir/dist"
zip_dir="$root_dir/dist-zip"
zip_name=""

log() { printf "%b\n" "$1"; }
info() { printf "%b%s%b\n" "$CYAN" "$1" "$NC"; }
ok() { printf "%b%s%b\n" "$GREEN" "$1" "$NC"; }
warn() { printf "%b%s%b\n" "$YELLOW" "$1" "$NC"; }
err() { printf "%b%s%b\n" "$RED" "$1" "$NC"; }

have() { command -v "$1" >/dev/null 2>&1; }

read_version() {
  # Priority: version.json -> src/manifest.json -> package.json
  local v=""
  if [[ -f "$root_dir/version.json" ]]; then
    v=$(node -e "console.log(JSON.parse(require('fs').readFileSync('version.json','utf8')).version||'')" 2>/dev/null || true)
  fi
  if [[ -z "$v" && -f "$root_dir/src/manifest.json" ]]; then
    v=$(node -e "console.log(JSON.parse(require('fs').readFileSync('src/manifest.json','utf8')).version||'')" 2>/dev/null || true)
  fi
  if [[ -z "$v" && -f "$root_dir/package.json" ]]; then
    v=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version||'')" 2>/dev/null || true)
  fi
  if [[ -z "$v" ]]; then v="0.0.0"; fi
  echo "$v"
}

zip_dist() {
  local version="$1"
  mkdir -p "$zip_dir"
  local out
  if have zip; then
    zip_name="javdb-extension-${version}.zip"
    out="$zip_dir/$zip_name"
    [[ -f "$out" ]] && rm -f "$out"
    info "Zipping dist -> $out"
    (cd "$dist_dir" && zip -qr "$out" .)
    ok "ZIP created: $out"
  else
    zip_name="javdb-extension-${version}.tar.gz"
    out="$zip_dir/$zip_name"
    [[ -f "$out" ]] && rm -f "$out"
    info "Archiving dist (tar.gz) -> $out"
    (cd "$dist_dir" && tar -czf "$out" .)
    ok "TAR.GZ created: $out"
  fi
}

quick_build() {
  info "Working dir: $root_dir"

  if ! have node; then err "Node.js 未安装"; exit 1; fi
  if ! have pnpm; then err "pnpm 未安装 (建议: npm i -g pnpm)"; exit 1; fi

  info "Installing dependencies (pnpm install)"
  pnpm install --frozen-lockfile || pnpm install

  info "Building via Vite"
  # Use local dev dep vite
  pnpm vite build

  if [[ ! -d "$dist_dir" ]]; then
    err "构建失败：未找到 dist/ 目录"
    exit 1
  fi

  local version
  version=$(read_version)
  info "Detected version: $version"
  zip_dist "$version"

  ok "Done. Dist: $dist_dir"
  ok "Zip: $zip_dir/$zip_name"
}

# ----- Integrated interactive menu (merged from scripts/build-menu.sh) -----

ask() { read -r -p "$1 " _ans; echo "${_ans:-}"; }

git_dirty() {
  if ! have git; then echo ""; return; fi
  git status --porcelain 2>/dev/null
}

install_and_build() {
  if ! have node; then err "需要 Node.js"; exit 1; fi
  if ! have pnpm; then err "需要 pnpm (npm i -g pnpm)"; exit 1; fi
  info "Installing dependencies (pnpm install)"
  pnpm install --frozen-lockfile || pnpm install
  info "Building via Vite"
  pnpm vite build
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
  echo "  [5] Release Only（仅发布，自定义备注）"
  echo "  [6] 退出"
}

tag_and_push() {
  local tag="$1"
  if ! have git; then warn "未检测到 git，跳过打 tag"; return 0; fi
  if git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
    warn "标签已存在：$tag（跳过创建）"
  else
    info "创建标签：$tag"
    # 按要求：不自动 commit，只创建 tag
    git tag -a "$tag" -m "Release $tag"
  fi
  info "Push commits & tags"
  git push || true
  git push --tags || true
}

create_release_custom() {
  local tag="$1"; local asset="$2"
  if ! have gh; then warn "未检测到 GitHub CLI (gh)，跳过创建 Release"; return 0; fi
  info "创建 GitHub Release: $tag"
  local prev_tag
  prev_tag=$(git describe --tags --abbrev=0 "${tag}^" 2>/dev/null || true)
  local remote repo_url notes
  remote="$(git config --get remote.origin.url 2>/dev/null || true)"
  repo_url=""
  if [[ "$remote" =~ ^git@github\.com:(.+?)(\.git)?$ ]]; then
    repo_url="https://github.com/${BASH_REMATCH[1]}"
  elif [[ "$remote" =~ ^https://github\.com/(.+?)(\.git)?$ ]]; then
    repo_url="https://github.com/${BASH_REMATCH[1]}"
  else
    repo_url="${remote%.git}"
  fi
  notes="$root_dir/.release_notes_${tag}.md"
  {
    echo "Release $tag"
    echo
    if [[ -n "$prev_tag" ]]; then
      echo "Commits since $prev_tag"
      git log --no-merges --pretty=format:"- %s ([%h]($repo_url/commit/%H)) by %an" "$prev_tag..$tag"
      echo
      echo "Compare"
      echo "$repo_url/compare/$prev_tag...$tag"
    else
      echo "Commits"
      local root
      root="$(git rev-list --max-parents=0 "$tag" 2>/dev/null || echo "")"
      if [[ -n "$root" ]]; then
        git log --no-merges --pretty=format:"- %s ([%h]($repo_url/commit/%H)) by %an" "$root..$tag"
      else
        git log --no-merges --pretty=format:"- %s ([%h]($repo_url/commit/%H)) by %an" "$tag"
      fi
    fi
  } > "$notes"
  echo ""
  info "预览发布说明如下："
  echo "----------------------------------------"
  cat "$notes"
  echo "----------------------------------------"
  local confirm_release
  read -r -p "确认使用以上文案创建 Release 并上传资源吗？(y/n) [Y]: " confirm_release
  confirm_release="${confirm_release:-Y}"
  if [[ ! "$confirm_release" =~ ^[Yy]$ ]]; then
    warn "已取消发布。"
    rm -f "$notes" || true
    return 0
  fi
  gh release create "$tag" "$asset" --title "Release $tag" -F "$notes" || true
  rm -f "$notes" || true
}

menu_main() {
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
      warn "选择了 $mode 发布，将创建新的 tag（不自动提交）。"
      local confirm; confirm=$(ask "确认执行吗？(y/n) [Y]:")
      [[ -z "$confirm" ]] && confirm="Y"
      if [[ ! "$confirm" =~ ^[Yy]$ ]]; then warn "已取消"; exit 0; fi
      info "更新版本号 (version.json & package.json)"
      if ! pnpm tsx scripts/version.ts "$mode"; then err "版本更新失败"; exit 1; fi
      install_and_build
      if [[ ! -d "$dist_dir" ]]; then err "构建失败：缺少 dist/"; exit 1; fi
      local v; v=$(read_version)
      zip_dist "$v"
      local doRel; doRel=$(ask "现在创建 GitHub Release 吗？(y/n) [N]:")
      doRel="${doRel:-N}"
      local tag="v${v}"
      if [[ "$doRel" =~ ^[Yy]$ ]]; then
        local dirty; dirty=$(git_dirty)
        if [[ -n "$dirty" ]]; then
          warn "检测到未提交的改动，这些改动不会包含在标签 $tag 中。"
          local conf; conf=$(ask "仍要创建标签并发布吗？(y/n) [N]:")
          conf="${conf:-N}"
          if [[ ! "$conf" =~ ^[Yy]$ ]]; then
            warn "已取消发布。请先手动提交后再重试。"
            exit 0
          fi
        fi
        tag_and_push "$tag"
        local asset_zip="$zip_dir/$zip_name"
        create_release_custom "$tag" "$asset_zip"
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
      info "仅发布（自定义备注）"
      local v; v=$(read_version)
      local tag="v${v}"
      local asset_zip="$zip_dir/javdb-extension-${v}.zip"
      local asset_tgz="$zip_dir/javdb-extension-${v}.tar.gz"
      local asset=""
      if [[ -f "$asset_zip" ]]; then asset="$asset_zip"; elif [[ -f "$asset_tgz" ]]; then asset="$asset_tgz"; fi
      if [[ -z "$asset" ]]; then err "未找到打包产物，请先选择 [4] 仅构建。"; exit 1; fi
      local dirty; dirty=$(git_dirty)
      if [[ -n "$dirty" ]]; then
        warn "检测到未提交的改动，这些改动不会包含在标签 $tag 中。"
        local conf; conf=$(ask "仍要创建标签并发布吗？(y/n) [N]:")
        conf="${conf:-N}"
        if [[ ! "$conf" =~ ^[Yy]$ ]]; then
          warn "已取消发布。请先手动提交后再重试。"
          exit 0
        fi
      fi
      tag_and_push "$tag"
      create_release_custom "$tag" "$asset"
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

entrypoint() {
  if [[ "${1-}" == "--quick" || "${1-}" == "-q" ]]; then
    quick_build "$@"
  else
    menu_main "$@"
  fi
}

entrypoint "$@"
 