#!/usr/bin/env bash

# JavDB Extension - Interactive Build Assistant (Shell Version)
# Ported from PowerShell version with full feature parity

# Bash strict mode
set -euo pipefail
IFS=$'\n\t'

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly GRAY='\033[0;37m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Global variables
version_type=""
version_str=""
tag_name=""
zip_name=""
zip_path=""
release_notes=""
release_only="false"
auto_notes="false"

# --- Helper Functions ---

print_color() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${NC}"
}

show_menu() {
    print_color "$CYAN" "================================================="
    print_color "$CYAN" " JavDB Extension - Interactive Build Assistant"
    print_color "$CYAN" "================================================="
    echo ""
    print_color "$YELLOW" "Please choose the type of build:"
    echo ""
    print_color "$WHITE" "  [1] Major Release (e.g., 1.x.x -> 2.0.0, for incompatible changes)"
    print_color "$GRAY" "      Major Release - for incompatible changes"
    print_color "$WHITE" "  [2] Minor Release (e.g., x.1.x -> x.2.0, for new features)"
    print_color "$GRAY" "      Minor Release - for new features"
    print_color "$WHITE" "  [3] Patch Release (e.g., x.x.1 -> x.x.2, for bug fixes)"
    print_color "$GRAY" "      Patch Release - for bug fixes"
    echo ""
    print_color "$WHITE" "  [4] Just Build (build without changing the version number)"
    print_color "$GRAY" "      Just Build - no version change"
    print_color "$WHITE" "  [5] Generate GitHub Release (auto notes, skip build)"
    print_color "$GRAY" "      Create release with gh --generate-notes, use existing artifact"
    print_color "$WHITE" "  [6] Exit"
    echo ""
}

get_user_choice() {
    local prompt="$1"
    local default="${2:-}"
    local user_input=""
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " user_input
        if [[ -z "$user_input" ]]; then
            echo "$default"
        else
            echo "$user_input"
        fi
    else
        read -p "$prompt: " user_input
        echo "$user_input"
    fi
}

show_error() {
    echo ""
    print_color "$RED" "################################################"
    print_color "$RED" "# An error occurred. Process halted.          #"
    print_color "$RED" "################################################"
    echo ""
    read -p "Press Enter to continue..."
}

show_success() {
    echo ""
    print_color "$GREEN" "Process finished."
}

check_required_commands() {
    local missing_commands=()
    
    for cmd in pnpm git jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        print_color "$RED" "ERROR: Missing required commands: ${missing_commands[*]}"
        echo ""
        print_color "$YELLOW" "Please install the missing commands:"
        for cmd in "${missing_commands[@]}"; do
            case "$cmd" in
                "pnpm")
                    print_color "$WHITE" "  - pnpm: npm install -g pnpm"
                    ;;
                "git")
                    print_color "$WHITE" "  - git: Install Git from your package manager"
                    ;;
                "jq")
                    print_color "$WHITE" "  - jq: Install jq from your package manager"
                    ;;
            esac
        done
        exit 1
    fi
}

install_and_build() {
    echo ""
    print_color "$GREEN" "Installing dependencies and building..."
    
    # Temporarily disable ANSI colors/fancy output
    local prev_no_color="${NO_COLOR:-}"
    local prev_force_color="${FORCE_COLOR:-}"
    export NO_COLOR='1'
    export FORCE_COLOR='0'
    
    print_color "$GRAY" "Running pnpm install..."
    if ! pnpm install; then
        export NO_COLOR="$prev_no_color"
        export FORCE_COLOR="$prev_force_color"
        show_error
        exit 1
    fi
    
    print_color "$GRAY" "Running pnpm run build..."
    if ! pnpm run build; then
        export NO_COLOR="$prev_no_color"
        export FORCE_COLOR="$prev_force_color"
        show_error
        exit 1
    fi
    
    # Restore previous color-related env vars
    export NO_COLOR="$prev_no_color"
    export FORCE_COLOR="$prev_force_color"
    
    echo ""
    print_color "$GREEN" "Build and packaging finished successfully!"
    echo ""
}

check_github_cli() {
    print_color "$GRAY" "Checking GitHub CLI installation..."
    
    if ! command -v gh &> /dev/null; then
        echo ""
        print_color "$RED" "################################################"
        print_color "$RED" "# GitHub CLI not found                        #"
        print_color "$RED" "################################################"
        echo ""
        print_color "$RED" "GitHub CLI is not installed or not working properly."
        echo ""
        print_color "$YELLOW" "To install GitHub CLI:"
        print_color "$WHITE" "  1. Visit: https://cli.github.com/"
        print_color "$WHITE" "  2. Download and install for your OS"
        print_color "$WHITE" "  3. Restart your terminal after installation"
        print_color "$WHITE" "  4. Run: gh auth login"
        echo ""
        print_color "$YELLOW" "Alternative: Create release manually"
        print_color "$WHITE" "  1. Go to your GitHub repository"
        print_color "$WHITE" "  2. Click 'Releases' then 'Create a new release'"
        print_color "$WHITE" "  3. Upload the zip file from dist-zip folder"
        echo ""
        print_color "$GREEN" "Build completed successfully. Skipping GitHub Release creation."
        show_success
        exit 0
    fi
    
    if ! gh --version &> /dev/null; then
        print_color "$RED" "GitHub CLI found but not working properly."
        show_error
        exit 1
    fi
    
    print_color "$GREEN" "GitHub CLI found and working."
}

read_version_info() {
    print_color "$GRAY" "Reading version from version.json..."
    
    if [[ ! -f "version.json" ]]; then
        print_color "$RED" "ERROR: version.json not found."
        show_error
        exit 1
    fi
    
    version_str=$(jq -r '.version' version.json 2>/dev/null || echo "")
    
    if [[ -z "$version_str" || "$version_str" == "null" ]]; then
        print_color "$RED" "ERROR: Could not read version from version.json."
        show_error
        exit 1
    fi
    
    tag_name="v$version_str"
    zip_name="javdb-extension-v$version_str.zip"
    zip_path="dist-zip/$zip_name"
    
    if [[ ! -f "$zip_path" ]]; then
        print_color "$RED" "ERROR: Build artifact $zip_name not found in dist-zip/."
        show_error
        exit 1
    fi
}

get_remote_http_url() {
    local remote_name="${1:-origin}"
    local url
    
    url=$(git remote get-url "$remote_name" 2>/dev/null || echo "")
    
    if [[ -z "$url" ]]; then
        echo ""
        return
    fi
    
    # Convert SSH to HTTPS
    if [[ "$url" =~ ^git@([^:]+):(.+)\.git$ ]]; then
        echo "https://${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    elif [[ "$url" =~ ^https?:// ]]; then
        echo "${url%.git}"
    else
        echo ""
    fi
}

generate_release_notes() {
    print_color "$GRAY" "Preparing template-based release notes..."
    
    # Previous tag for compare link
    local previous_tag
    previous_tag=$(git tag --list "v*" --sort=-v:refname | head -n1 2>/dev/null || echo "")
    
    # Remote HTTP URL for compare link
    local remote_http
    remote_http=$(get_remote_http_url "origin")
    local compare_link=""
    if [[ -n "$remote_http" && -n "$previous_tag" ]]; then
        compare_link="$remote_http/compare/$previous_tag...$tag_name"
    elif [[ -n "$remote_http" ]]; then
        compare_link="$remote_http/commits"
    fi
    
    # Compute artifact SHA256
    local artifact_hash=""
    if command -v sha256sum &> /dev/null; then
        artifact_hash=$(sha256sum "$zip_path" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        artifact_hash=$(shasum -a 256 "$zip_path" | cut -d' ' -f1)
    fi
    
    local date_str
    date_str=$(date '+%Y-%m-%d')
    
    # Build professional template
    local notes_lines=()
    notes_lines+=("## JavDB Extension v$version_str")
    notes_lines+=("")
    notes_lines+=("- 发布类型：${version_type:-N/A}")
    notes_lines+=("- 发布日期：$date_str")
    if [[ -n "$compare_link" ]]; then
        notes_lines+=("- 变更对比：$compare_link")
    fi
    notes_lines+=("")
    notes_lines+=("### 亮点")
    notes_lines+=("- 在此撰写本次版本的核心亮点、价值和关键体验改进。")
    notes_lines+=("")
    notes_lines+=("### 新增")
    notes_lines+=("- 新增功能 1")
    notes_lines+=("- 新增功能 2")
    notes_lines+=("")
    notes_lines+=("### 修复")
    notes_lines+=("- 修复问题 1（场景/影响/结果）")
    notes_lines+=("- 修复问题 2")
    notes_lines+=("")
    notes_lines+=("### 变更与优化")
    notes_lines+=("- 行为变更/交互优化/性能优化等说明")
    notes_lines+=("")
    notes_lines+=("### 兼容性与升级指引")
    notes_lines+=("- 是否存在不兼容变更（如有，用条目清晰列出）")
    notes_lines+=("- 升级注意事项/迁移步骤/回滚建议")
    notes_lines+=("")
    notes_lines+=("### 资源")
    notes_lines+=("- $zip_name")
    if [[ -n "$artifact_hash" ]]; then
        notes_lines+=("  - SHA256: $artifact_hash")
    fi
    notes_lines+=("")
    
    local IFS=$'\n'
    release_notes="${notes_lines[*]}"
}

create_github_release() {
    echo ""
    print_color "$GREEN" "Creating GitHub Release..."
    
    check_github_cli
    read_version_info
    generate_release_notes
    
    # Show release notes preview
    print_color "$YELLOW" "Release notes preview:"
    echo ""
    print_color "$GRAY" "$release_notes"
    echo ""
    
    # Confirm release notes
    local confirm_release
    confirm_release=$(get_user_choice "Confirm the above Release Notes and proceed to create GitHub Release? (y/n)" "Y")
    
    if [[ ! "$confirm_release" =~ ^[Yy]$ ]]; then
        echo ""
        print_color "$YELLOW" "GitHub Release creation cancelled. Build and packaging already completed."
        show_success
        exit 0
    fi
    
    # Push git commits and tags
    print_color "$GRAY" "Pushing git commits and tags..."
    if ! git push; then
        show_error
        exit 1
    fi
    
    if ! git push --tags; then
        show_error
        exit 1
    fi
    
    # Create release
    print_color "$GRAY" "Creating release and uploading $zip_name..."
    
    # Write notes to temporary file
    local notes_file
    notes_file=$(mktemp)
    echo "$release_notes" > "$notes_file"
    
    if ! gh release create "$tag_name" "$zip_path" --title "Release $tag_name" --notes-file "$notes_file"; then
        rm -f "$notes_file"
        show_error
        exit 1
    fi
    
    rm -f "$notes_file"
    print_color "$GREEN" "GitHub Release created successfully!"
}

create_github_release_auto() {
    echo ""
    print_color "$GREEN" "Creating GitHub Release (auto notes)..."
    
    check_github_cli
    read_version_info
    
    # Ensure tag exists; create if missing
    if ! git rev-parse -q --verify "refs/tags/$tag_name" >/dev/null 2>&1; then
        print_color "$GRAY" "Tag $tag_name not found. Creating annotated tag..."
        if ! git tag -a "$tag_name" -m "Release $tag_name"; then
            show_error
            exit 1
        fi
    fi
    
    # Push git commits and tags
    print_color "$GRAY" "Pushing git commits and tags..."
    if ! git push; then
        show_error
        exit 1
    fi
    if ! git push --tags; then
        show_error
        exit 1
    fi
    
    # Create release with auto-generated notes
    print_color "$GRAY" "Creating release (auto notes) and uploading $zip_name..."
    if ! gh release create "$tag_name" "$zip_path" --title "Release $tag_name" --generate-notes; then
        show_error
        exit 1
    fi
    print_color "$GREEN" "GitHub Release created successfully!"
}

# --- Main Logic ---

main() {
    # Check required commands
    check_required_commands
    
    while true; do
        show_menu
        local choice
        choice=$(get_user_choice "Enter your choice (1-6)" "4")
        
        case "$choice" in
            "1")
                version_type="major"
                break
                ;;
            "2")
                version_type="minor"
                break
                ;;
            "3")
                version_type="patch"
                break
                ;;
            "4")
                version_type=""
                break
                ;;
            "5")
                release_only="true"
                auto_notes="true"
                version_type=""
                break
                ;;
            "6")
                exit 0
                ;;
            *)
                print_color "$RED" "Invalid choice."
                continue
                ;;
        esac
    done
    
    # Version confirmation
    if [[ -n "$version_type" ]]; then
        echo ""
        print_color "$YELLOW" "You have selected a $version_type release. This will create a new git commit and tag."
        local confirm
        confirm=$(get_user_choice "Are you sure? (y/n)" "Y")
        
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            print_color "$YELLOW" "Action cancelled."
            exit 0
        fi
        
        echo ""
        print_color "$GREEN" "Updating version..."
        if ! pnpm tsx scripts/version.ts "$version_type"; then
            show_error
            exit 1
        fi
    fi
    
    # Install dependencies and build (skip when release-only)
    if [[ "$release_only" != "true" ]]; then
        install_and_build
    else
        print_color "$YELLOW" "Release-only mode: skipping build step."
    fi
    
    # Decide GitHub Release for options 1-3 (interactive), keep option 5 as auto notes; skip for Just Build (option 4)
    if [[ -z "$version_type" && "$release_only" != "true" ]]; then
        echo ""
        print_color "$YELLOW" "Just Build selected. Skipping GitHub Release."
        show_success
        exit 0
    fi
    
    # Option 5: release-only, auto notes
    if [[ "$release_only" == "true" ]]; then
        create_github_release_auto
        show_success
        exit 0
    fi
    
    # Options 1-3: ask whether to create release
    local do_release
    do_release=$(get_user_choice "Create GitHub Release now? (y/n)" "N")
    if [[ ! "$do_release" =~ ^[Yy]$ ]]; then
        echo ""
        print_color "$YELLOW" "Skip GitHub Release."
        show_success
        exit 0
    fi
    
    # Choose notes mode
    local notes_mode
    notes_mode=$(get_user_choice "Release notes mode: [1] Auto (gh --generate-notes), [2] Manual (preview)" "1")
    if [[ "$notes_mode" == "1" ]]; then
        auto_notes="true"
    else
        auto_notes="false"
    fi
    
    # Create GitHub Release based on mode
    if [[ "$auto_notes" == "true" ]]; then
        create_github_release_auto
    else
        create_github_release
    fi
    show_success
}

# --- Script Start ---
main "$@" 