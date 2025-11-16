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
    zip_name="javdb-extension-v${version}.zip"
    out="$zip_dir/$zip_name"
    [[ -f "$out" ]] && rm -f "$out"
    info "Zipping dist -> $out"
    (cd "$dist_dir" && zip -qr "$out" .)
    ok "ZIP created: $out"
  else
    zip_name="javdb-extension-v${version}.tar.gz"
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

show_help() {
  echo "用法: $0 [选项]"
  echo "选项:"
  echo "  -h, --help      显示帮助信息"
  echo "  -p, --preview   预览发布信息"
  echo "  -v, --version   显示版本信息"
  echo ""
  echo "交互式菜单选项:"
  echo "  1) Major Release（不兼容变更）(e.g., 1.x.x -> 2.0.0)"
  echo "  2) Minor Release（新增功能）(e.g., x.1.x -> x.2.0)"
  echo "  3) Patch Release（修复补丁）(e.g., x.x.1 -> x.x.2)"
  echo "  4) Just Build（仅构建，不改版本）"
  echo "  5) Release Only（仅发布，自定义备注）"
  echo "  6) 预览发布信息"
  echo "  7) 退出"
}

preview_release_notes() {
  if ! have git; then err "未检测到 git"; return 1; fi
  
  local tag current_version
  current_version=$(read_version)
  tag="v$current_version"
  
  # 获取上一个标签
  local prev_tag
  prev_tag=""
  if git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
    local i
    local -a _tags
    mapfile -t _tags < <(git tag -l 'v[0-9]*\.[0-9]*\.[0-9]*' --sort=-v:refname)
    for ((i=0;i<${#_tags[@]};i++)); do
      if [[ "${_tags[$i]}" == "$tag" && $i -lt $((${#_tags[@]}-1)) ]]; then
        prev_tag="${_tags[$i+1]}"
        break
      fi
    done
  fi
  if [[ -z "$prev_tag" ]]; then
    prev_tag=$(git describe --tags --abbrev=0 "${tag}^" 2>/dev/null || true)
  fi
  
  # 获取仓库URL
  local remote repo_url
  remote="$(git config --get remote.origin.url 2>/dev/null || true)"
  if [[ "$remote" =~ ^git@github\.com:(.+?)(\.git)?$ ]]; then
    repo_url="https://github.com/${BASH_REMATCH[1]}"
  elif [[ "$remote" =~ ^https://github\.com/(.+?)(\.git)?$ ]]; then
    repo_url="https://github.com/${BASH_REMATCH[1]}"
  else
    repo_url="${remote%.git}"
  fi
  # 统一移除末尾的 .git，避免生成的链接包含 .git
  repo_url="${repo_url%.git}"
  
  # 获取当前日期
  local release_date
  release_date=$(date +%Y-%m-%d)
  
  # 获取构建类型
  local build_type="patch release"
  if [[ "$current_version" =~ \.0\.0$ ]]; then
    build_type="major release"
  elif [[ "$current_version" =~ \.\d+\.0$ ]]; then
    build_type="minor release"
  fi
  
  # 预览：分离标题与正文
  echo "Title: Release $current_version"
  echo ""
  echo "Body:"
  echo ""
  echo "**Build Type:** $build_type"
  echo "**Version:** $current_version"
  echo "**Release Date:** $release_date"
  echo ""
  
  # 输出比较链接
  if [[ -n "$repo_url" && -n "$prev_tag" && "$prev_tag" != "initial commit" ]]; then
    echo "Compare: [$prev_tag...$tag]($repo_url/compare/$prev_tag...$tag)"
    echo ""
    
    # 获取提交历史并按类型分类
    local features fixes
    features=$(git log --no-merges --grep="^feat" --pretty=format:"- %s - by %an on %ad ([%h]($repo_url/commit/%H))" --date=short "$prev_tag..$tag")
    fixes=$(git log --no-merges --grep="^fix" --pretty=format:"- %s - by %an on %ad ([%h]($repo_url/commit/%H))" --date=short "$prev_tag..$tag")
    
    # 输出特性更新
    if [[ -n "$features" ]]; then
      echo "### Features"
      echo -e "$features"
      echo ""
    fi
    
    # 输出修复
    if [[ -n "$fixes" ]]; then
      echo "### Fixes"
      echo -e "$fixes"
      echo ""
    fi
    
    # 输出其他提交（非feat/fix）
    local others
    others=$(git log --no-merges --invert-grep --grep="^\(feat\|fix\)" --pretty=format:"- %s - by %an on %ad ([%h]($repo_url/commit/%H))" --date=short "$prev_tag..$tag")
    
    if [[ -n "$others" ]]; then
      echo "### Other Changes"
      echo -e "$others"
      echo ""
    fi
    
    # 输出制品信息（兼容带 v 与不带 v 的命名）
    local zip_file_v="javdb-extension-v$current_version.zip"
    local zip_file_nv="javdb-extension-${current_version}.zip"
    local display_file=""
    if [[ -f "$zip_dir/$zip_file_v" ]]; then
      display_file="$zip_file_v"
    elif [[ -f "$zip_dir/$zip_file_nv" ]]; then
      display_file="$zip_file_nv"
    else
      display_file="$zip_file_v"
    fi
    echo "### Artifacts"
    echo "- $display_file"
    echo "  - SHA256: $(sha256sum "$zip_dir/$display_file" 2>/dev/null | cut -d' ' -f1 || echo "[文件未生成]")"
  else
    echo "无法生成完整的发布说明，请确保："
    echo "1. 已设置远程仓库"
    echo "2. 存在上一个标签"
    echo "3. 已生成发布包"
  fi
  
  echo ""
}

show_menu() {
  echo ""
  echo "请选择构建类型："
  echo "  [1] Major Release（不兼容变更）(e.g., 1.x.x -> 2.0.0)"
  echo "  [2] Minor Release（新增功能）(e.g., x.1.x -> x.2.0)"
  echo "  [3] Patch Release（修复补丁）(e.g., x.x.1 -> x.x.2)"
  echo "  [4] Just Build（仅构建，不改版本）"
  echo "  [5] Release Only（仅发布，自定义备注）"
  echo "  [6] 预览发布信息"
  echo "  [7] 退出"
}

get_commit_template() {
  local template_file="$root_dir/scripts/commit_template.txt"
  if [[ -f "$template_file" ]]; then
    echo "$template_file"
    return 0
  fi
  # fallback to release_template.txt if user renamed it
  template_file="$root_dir/scripts/release_template.txt"
  if [[ -f "$template_file" ]]; then
    echo "$template_file"
    return 0
  fi
  return 1
}

tag_and_push() {
  local tag="$1"
  if ! have git; then warn "未检测到 git，跳过打 tag"; return 0; fi
  if git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
    warn "标签已存在：$tag（跳过创建）"
  else
    info "创建标签：$tag"
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
  local notes notes_release
  notes="$root_dir/.release_notes_${tag}.md"
  notes_release="$root_dir/.release_notes_${tag}.release.md"
  preview_release_notes > "$notes"
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
  # 发布时去掉预览专用的 Title/Body 行
  sed -e '/^Title:/d' -e '/^Body:/d' "$notes" > "$notes_release"
  gh release create "$tag" "$asset" --title "Release $tag" -F "$notes_release" || true
  rm -f "$notes" "$notes_release" || true
}

menu_main() {
  # 处理命令行参数
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)
        show_help
        exit 0
        ;;
      -v|--version)
        echo "$(basename "$0") version $(read_version)"
        exit 0
        ;;
      -p|--preview)
        preview_release_notes
        exit 0
        ;;
      *)
        warn "未知选项: $1"
        show_help
        exit 1
        ;;
    esac
    shift
  done
  
  # 交互式菜单
  local choice
  show_menu
  read -r -p "输入你的选择 (1-7) [4]: " choice
  choice="${choice:-4}"  # 默认选择 4（仅构建）
  
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
      local asset_zip_v="$zip_dir/javdb-extension-v${v}.zip"
      local asset_tgz_v="$zip_dir/javdb-extension-v${v}.tar.gz"
      local asset_zip_nv="$zip_dir/javdb-extension-${v}.zip"
      local asset_tgz_nv="$zip_dir/javdb-extension-${v}.tar.gz"
      local asset=""
      if [[ -f "$asset_zip_v" ]]; then asset="$asset_zip_v"; elif [[ -f "$asset_tgz_v" ]]; then asset="$asset_tgz_v"; elif [[ -f "$asset_zip_nv" ]]; then asset="$asset_zip_nv"; elif [[ -f "$asset_tgz_nv" ]]; then asset="$asset_tgz_nv"; fi
      if [[ -z "$asset" ]]; then
        # 没有现成产物，尝试从 dist/ 打包一次（不进行编译）
        if [[ -d "$dist_dir" ]]; then
          info "未找到现有产物，检测到 dist/ 目录，开始打包..."
          zip_dist "$v"
          if [[ -f "$asset_zip_v" ]]; then asset="$asset_zip_v"; elif [[ -f "$asset_tgz_v" ]]; then asset="$asset_tgz_v"; elif [[ -f "$asset_zip_nv" ]]; then asset="$asset_zip_nv"; elif [[ -f "$asset_tgz_nv" ]]; then asset="$asset_tgz_nv"; fi
        else
          err "未找到打包产物且缺少 dist/ 目录，无法发布。请先执行 [4] 仅构建。"; exit 1
        fi
      fi
      # 如仅存在无 v 命名的旧产物，复制为带 v 命名以统一发布资产名称
      if [[ "$asset" == "$asset_zip_nv" && -f "$asset_zip_nv" && ! -f "$asset_zip_v" ]]; then
        info "发现旧命名产物，复制为统一命名：$(basename "$asset_zip_v")"
        cp -f "$asset_zip_nv" "$asset_zip_v" && asset="$asset_zip_v"
      elif [[ "$asset" == "$asset_tgz_nv" && -f "$asset_tgz_nv" && ! -f "$asset_tgz_v" ]]; then
        info "发现旧命名产物，复制为统一命名：$(basename "$asset_tgz_v")"
        cp -f "$asset_tgz_nv" "$asset_tgz_v" && asset="$asset_tgz_v"
      fi
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
      preview_release_notes
      ;;
    7)
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
 