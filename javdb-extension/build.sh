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
    print_color "$WHITE" "  [5] Exit"
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
    print_color "$GRAY" "Getting latest commit information for release notes..."
    
    local head_short
    head_short=$(git rev-parse --short HEAD 2>/dev/null || echo "")
    
    if [[ -z "$head_short" ]]; then
        print_color "$YELLOW" "Warning: Could not get latest commit information, using default notes"
        release_notes="Release $version_str ($version_type) - $(date '+%Y-%m-%d')"
        return
    fi
    
    # Get previous tag
    local previous_tag
    previous_tag=$(git tag --list "v*" --sort=-v:refname | head -n1 2>/dev/null || echo "")
    
    # Compute commit range
    local commit_range=""
    if [[ -n "$previous_tag" ]]; then
        commit_range="$previous_tag..HEAD"
    fi
    
    # Get remote HTTP URL for compare link
    local remote_http
    remote_http=$(get_remote_http_url "origin")
    
    local compare_link=""
    if [[ -n "$remote_http" && -n "$previous_tag" ]]; then
        compare_link="$remote_http/compare/$previous_tag...$tag_name"
    elif [[ -n "$remote_http" ]]; then
        compare_link="$remote_http/commits"
    fi
    
    # Get commits in range
    local log_args=()
    if [[ -n "$commit_range" ]]; then
        log_args+=("$commit_range")
    fi
    log_args+=("--date=short" "--pretty=format:%H%x1f%h%x1f%an%x1f%ad%x1f%s%x1f%b%x1e")
    
    local log_raw
    log_raw=$(git log "${log_args[@]}" 2>/dev/null || echo "")
    
    # Parse commits and group by type
    local -A groups
    groups["Features"]=""
    groups["Fixes"]=""
    groups["Refactor"]=""
    groups["Performance"]=""
    groups["Docs"]=""
    groups["Chore"]=""
    groups["CI"]=""
    groups["Tests"]=""
    groups["Build"]=""
    groups["Style"]=""
    groups["Reverts"]=""
    groups["Others"]=""
    
    local breaking_changes=""
    
    if [[ -n "$log_raw" ]]; then
        while IFS=$'\x1e' read -r entry; do
            if [[ -z "$entry" ]]; then continue; fi
            
            IFS=$'\x1f' read -r full_hash short_hash author date subject body <<< "$entry"
            
            local group_name="Others"
            local is_breaking=false
            
            # Parse conventional commit format
            if [[ "$subject" =~ ^(feat|fix|refactor|perf|docs|chore|ci|test|build|style|revert)(\([^\)]+\))?(!)?:[[:space:]]*(.+)$ ]]; then
                local commit_type="${BASH_REMATCH[1]}"
                local breaking_marker="${BASH_REMATCH[3]}"
                subject="${BASH_REMATCH[4]}"
                
                case "$commit_type" in
                    "feat") group_name="Features" ;;
                    "fix") group_name="Fixes" ;;
                    "refactor") group_name="Refactor" ;;
                    "perf") group_name="Performance" ;;
                    "docs") group_name="Docs" ;;
                    "chore") group_name="Chore" ;;
                    "ci") group_name="CI" ;;
                    "test") group_name="Tests" ;;
                    "build") group_name="Build" ;;
                    "style") group_name="Style" ;;
                    "revert") group_name="Reverts" ;;
                esac
                
                if [[ "$breaking_marker" == "!" ]]; then
                    is_breaking=true
                fi
            fi
            
            # Check for BREAKING CHANGE in body
            if [[ "$body" =~ BREAKING[[:space:]-]CHANGE ]]; then
                is_breaking=true
            fi
            
            local item="- $subject - by $author on $date ($short_hash)"
            if [[ -n "$body" ]]; then
                # Add body with limited lines
                local body_lines
                mapfile -t body_lines <<< "$body"
                local line_count=0
                for line in "${body_lines[@]}"; do
                    if [[ -n "${line// }" && $line_count -lt 8 ]]; then
                        item="$item"$'\n'"  > $line"
                        ((line_count++))
                    fi
                done
                if [[ ${#body_lines[@]} -gt 8 ]]; then
                    item="$item"$'\n'"  > ..."
                fi
            fi
            
            if [[ "$is_breaking" == true ]]; then
                if [[ -n "$breaking_changes" ]]; then
                    breaking_changes="$breaking_changes"$'\n'"$item"
                else
                    breaking_changes="$item"
                fi
            fi
            
            if [[ -n "${groups[$group_name]}" ]]; then
                groups["$group_name"]="${groups[$group_name]}"$'\n'"$item"
            else
                groups["$group_name"]="$item"
            fi
            
        done <<< "$log_raw"
    fi
    
    # Compute artifact SHA256
    local artifact_hash=""
    if command -v sha256sum &> /dev/null; then
        artifact_hash=$(sha256sum "$zip_path" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        artifact_hash=$(shasum -a 256 "$zip_path" | cut -d' ' -f1)
    fi
    
    # Build release notes
    local notes_lines=()
    notes_lines+=("## Release $version_str")
    notes_lines+=("")
    notes_lines+=("**Build Type:** $version_type release")
    notes_lines+=("**Version:** $version_str")
    notes_lines+=("**Release Date:** $(date '+%Y-%m-%d')")
    
    if [[ -n "$compare_link" ]]; then
        notes_lines+=("")
        notes_lines+=("Compare: $compare_link")
    fi
    
    notes_lines+=("")
    
    # Add sections in order
    local section_order=("Features" "Fixes" "Refactor" "Performance" "Docs" "Build" "CI" "Tests" "Style" "Reverts" "Chore" "Others")
    
    for section in "${section_order[@]}"; do
        if [[ -n "${groups[$section]}" ]]; then
            notes_lines+=("### $section")
            notes_lines+=("${groups[$section]}")
            notes_lines+=("")
        fi
    done
    
    # Add breaking changes section
    if [[ -n "$breaking_changes" ]]; then
        notes_lines+=("### Breaking Changes")
        notes_lines+=("$breaking_changes")
        notes_lines+=("")
    fi
    
    # Add artifacts section
    notes_lines+=("### Artifacts")
    notes_lines+=("- $zip_name")
    if [[ -n "$artifact_hash" ]]; then
        notes_lines+=("  - SHA256: $artifact_hash")
    fi
    notes_lines+=("")
    
    # Join lines
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

# --- Main Logic ---

main() {
    # Check required commands
    check_required_commands
    
    while true; do
        show_menu
        local choice
        choice=$(get_user_choice "Enter your choice (1-5)" "4")
        
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
    
    # Install dependencies and build
    install_and_build
    
    # Auto-create GitHub Release for options 1-3; skip for Just Build (option 4)
    if [[ -z "$version_type" ]]; then
        echo ""
        print_color "$YELLOW" "Just Build selected. Skipping GitHub Release."
        show_success
        exit 0
    fi
    
    # Create GitHub Release
    create_github_release
    show_success
}

# --- Script Start ---
main "$@" 