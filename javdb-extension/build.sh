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
 release_only="false"
 auto_notes="false"

# --- Helper Functions ---

print_color() {
    local color="$1"
{{ ... }}
        show_error
        exit 1
    fi
}

create_github_release_auto() {
    echo ""
    print_color "$GREEN" "Creating GitHub Release (auto notes)..."
    
    check_github_cli
    read_version_info
{{ ... }}
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
    
    # Create GitHub Release (auto notes only)
    create_github_release_auto
    show_success
}

# --- Script Start ---
main "$@" 