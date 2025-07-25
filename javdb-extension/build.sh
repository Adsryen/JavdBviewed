#!/usr/bin/env bash

# Bash strict mode
set -euo pipefail
IFS=$'\n\t'

# --- Helper Functions ---

# Function to handle errors
error_exit() {
    local message="${1:-"An error occurred. Process halted."}"
    echo
    echo "################################################"
    printf "# %s\n" "$message"
    echo "################################################"
    echo
    read -p "Press Enter to exit..."
    exit 1
}

# --- Main Logic ---

main_menu() {
    clear
    echo "================================================="
    echo " JavDB Extension - Interactive Build Assistant"
    echo "================================================="
    echo
    echo "Please choose the type of build:"
    echo
    echo "  [1] Major Release (e.g., 1.x.x -> 2.0.0, for incompatible changes) (主版本)"
    echo "  [2] Minor Release (e.g., x.1.x -> x.2.0, for new features) (次版本)"
    echo "  [3] Patch Release (e.g., x.x.1 -> x.x.2, for bug fixes) (修订版)"
    echo
    echo "  [4] Just Build (build without changing the version number) (仅构建)"
    echo "  [5] Exit (退出)"
    echo

    read -p "Enter your choice [1-5]: " choice

    case "$choice" in
        1) version_type="major" ;;
        2) version_type="minor" ;;
        3) version_type="patch" ;;
        4)
            install_and_build
            ask_for_release
            success_exit
            ;;
        5) exit 0 ;;
        *)
            echo "Invalid choice."
            sleep 1
            main_menu
            ;;
    esac

    confirm_version
}

confirm_version() {
    echo
    echo "You have selected a $version_type release. This will create a new git commit and tag."
    read -p "Are you sure? (y/n): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Action cancelled."
        main_menu
        return
    fi
    echo
    echo "Updating version..."
    pnpm tsx scripts/version.ts "$version_type" || error_exit "Version update script failed."

    install_and_build
    ask_for_release
    success_exit
}

install_and_build() {
    echo
    echo "Installing dependencies and building..."
    pnpm install || error_exit "pnpm install failed."
    pnpm run build || error_exit "pnpm run build failed."
    echo
    echo "Build and packaging finished successfully!"
    echo
}

ask_for_release() {
    read -p "Do you want to create a GitHub Release now? (y/n): " release_confirm
    if [[ ! "$release_confirm" =~ ^[Yy]$ ]]; then
        echo "OK. Skipping GitHub Release."
        return
    fi

    if [ -z "${version_type-}" ]; then
        echo "A release can only be created after a version update (options 1-3)."
        return
    fi

    create_release
}

create_release() {
    echo
    echo "Creating GitHub Release..."

    if ! command -v gh &> /dev/null; then
        error_exit "GitHub CLI ('gh') is not installed or not in your PATH."
    fi

    if ! command -v jq &> /dev/null; then
        error_exit "'jq' is not installed, but it is required to read the project version."
    fi
    
    version_str=$(jq -r .version version.json)

    if [ -z "$version_str" ]; then
        error_exit "Could not read version from version.json."
    fi

    tag_name="v${version_str}"
    zip_name="javdb-extension.zip"
    zip_path="dist/${zip_name}"

    if [ ! -f "$zip_path" ]; then
        error_exit "Build artifact $zip_name not found in dist/."
    fi

    echo "Pushing git commits and tags..."
    git push && git push --tags || error_exit "Failed to push git commits and tags."

    echo "Creating release and uploading $zip_name..."
    gh release create "$tag_name" "$zip_path" --title "Release $tag_name" --notes "New $version_type release." || error_exit "gh release creation failed."

    echo "GitHub Release created successfully!"
}

success_exit() {
    echo
    echo "Process finished."
    exit 0
}

# --- Script Start ---
# Check for required commands before starting
for cmd in pnpm git; do
    if ! command -v "$cmd" &> /dev/null; then
        error_exit "Required command '$cmd' is not installed or not in your PATH."
    fi
done

main_menu 