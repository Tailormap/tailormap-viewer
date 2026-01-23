#!/bin/bash

# =============================================================================
# link-modules.sh - Angular Module Symlink Manager for tailormap-viewer
# =============================================================================
# This script manages symlinks from external Angular projects (e.g., tailormap-gbi)
# into the tailormap-viewer monorepo.
#
# Usage:
#   ./link-modules.sh link <source-path> [--scope <scope>] [--name <name>] [--lib <lib>]
#   ./link-modules.sh unlink <module-name>
#   ./link-modules.sh list
#   ./link-modules.sh revert
#   ./link-modules.sh status
#
# Examples:
#   ./link-modules.sh link ../tailormap-gbi/projects/gbi-plugin
#   ./link-modules.sh link ../tailormap-gbi/projects/gbi-plugin --scope @tailormap-gbi --name plugin
#   ./link-modules.sh link ../tailormap-gbi/projects/shared --scope @tailormap-gbi --name gbi-shared --lib shared
#   ./link-modules.sh unlink gbi-plugin
#   ./link-modules.sh revert
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECTS_DIR="$SCRIPT_DIR/projects"
TSCONFIG_FILE="$SCRIPT_DIR/tsconfig.json"
ANGULAR_JSON="$SCRIPT_DIR/angular.json"
ENVIRONMENT_FILE="$SCRIPT_DIR/projects/app/src/environments/environment.ts"
BACKUP_DIR="$SCRIPT_DIR/.link-modules-backup"
STATE_FILE="$SCRIPT_DIR/.linked-modules.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

ensure_jq() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq first."
        log_info "  macOS: brew install jq"
        log_info "  Ubuntu: sudo apt-get install jq"
        exit 1
    fi
}

ensure_backup_dir() {
    mkdir -p "$BACKUP_DIR"
}

backup_file() {
    local file="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local basename=$(basename "$file")
    cp "$file" "$BACKUP_DIR/${basename}.${timestamp}.backup"
    log_info "Backed up $basename"
}

init_state_file() {
    if [ ! -f "$STATE_FILE" ]; then
        echo '{"linkedModules":[]}' > "$STATE_FILE"
    fi
}

get_linked_modules() {
    if [ -f "$STATE_FILE" ]; then
        jq -r '.linkedModules[]' "$STATE_FILE" 2>/dev/null || echo ""
    fi
}

add_to_state() {
    local module_name="$1"
    local source_path="$2"
    local scope="$3"
    local lib_name="$4"
    local module_class="$5"
    local with_assets="$6"

    init_state_file

    local temp_file=$(mktemp)
    jq --arg name "$module_name" --arg source "$source_path" --arg scope "$scope" --arg lib "$lib_name" --arg module "$module_class" --argjson assets "${with_assets:-false}" \
        '.linkedModules += [{"name": $name, "source": $source, "scope": $scope, "lib": $lib, "module": $module, "assets": $assets}]' \
        "$STATE_FILE" > "$temp_file" && mv "$temp_file" "$STATE_FILE"
}

remove_from_state() {
    local module_name="$1"

    if [ -f "$STATE_FILE" ]; then
        local temp_file=$(mktemp)
        jq --arg name "$module_name" \
            '.linkedModules = [.linkedModules[] | select(.name != $name)]' \
            "$STATE_FILE" > "$temp_file" && mv "$temp_file" "$STATE_FILE"
    fi
}

get_module_info() {
    local module_name="$1"
    if [ -f "$STATE_FILE" ]; then
        jq -r --arg name "$module_name" \
            '.linkedModules[] | select(.name == $name)' \
            "$STATE_FILE" 2>/dev/null
    fi
}

# =============================================================================
# tsconfig.json Management
# =============================================================================

add_tsconfig_path() {
    local scope="$1"
    local dir_name="$2"
    local lib_name="$3"
    local path_alias="$scope/$lib_name"
    local path_value="projects/$dir_name/src"

    log_info "Adding path '$path_alias' to tsconfig.json..."

    local temp_file=$(mktemp)
    jq --arg alias "$path_alias" --arg path "$path_value" \
        '.compilerOptions.paths[$alias] = [$path]' \
        "$TSCONFIG_FILE" > "$temp_file" && mv "$temp_file" "$TSCONFIG_FILE"

    log_success "Added tsconfig path: $path_alias -> $path_value"
}

remove_tsconfig_path() {
    local scope="$1"
    local lib_name="$2"
    local path_alias="$scope/$lib_name"

    log_info "Removing path '$path_alias' from tsconfig.json..."

    local temp_file=$(mktemp)
    jq --arg alias "$path_alias" \
        'del(.compilerOptions.paths[$alias])' \
        "$TSCONFIG_FILE" > "$temp_file" && mv "$temp_file" "$TSCONFIG_FILE"

    log_success "Removed tsconfig path: $path_alias"
}

# =============================================================================
# angular.json Management
# =============================================================================

add_angular_project() {
    local module_name="$1"
    local prefix="${2:-tm}"

    log_info "Adding project '$module_name' to angular.json..."

    local project_config=$(cat <<EOF
{
    "projectType": "library",
    "root": "projects/$module_name",
    "sourceRoot": "projects/$module_name/src",
    "prefix": "$prefix",
    "architect": {
        "build": {
            "builder": "@angular/build:ng-packagr",
            "options": {
                "project": "projects/$module_name/ng-package.json",
                "tsConfig": "projects/$module_name/tsconfig.lib.json"
            },
            "configurations": {
                "production": {
                    "tsConfig": "projects/$module_name/tsconfig.lib.prod.json"
                },
                "development": {
                    "tsConfig": "projects/$module_name/tsconfig.lib.json"
                }
            },
            "defaultConfiguration": "production"
        },
        "lint": {
            "builder": "@angular-eslint/builder:lint",
            "options": {
                "lintFilePatterns": [
                    "projects/$module_name/**/*.ts",
                    "projects/$module_name/**/*.html"
                ]
            }
        }
    }
}
EOF
)

    local temp_file=$(mktemp)
    jq --arg name "$module_name" --argjson config "$project_config" \
        '.projects[$name] = $config' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"

    log_success "Added angular.json project: $module_name"
}

remove_angular_project() {
    local module_name="$1"

    log_info "Removing project '$module_name' from angular.json..."

    local temp_file=$(mktemp)
    jq --arg name "$module_name" \
        'del(.projects[$name])' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"

    log_success "Removed angular.json project: $module_name"
}

# =============================================================================
# Assets & Styles Management (Schematic-like)
# =============================================================================

detect_and_add_assets() {
    local source_path="$1"
    local dir_name="$2"
    local assets_base="projects/$dir_name/assets"

    # Check if assets directory exists
    if [ ! -d "$source_path/assets" ]; then
        log_info "No assets directory found in source module"
        return
    fi

    log_info "Detecting assets in $source_path/assets..."

    local added_assets=()
    local added_styles=()
    local added_translations=()

    # Check for icons directory
    if [ -d "$source_path/assets/icons" ]; then
        add_angular_asset "$assets_base/icons" "icons"
        added_assets+=("icons")
    fi

    # Check for root directory (files to copy to root of dist)
    if [ -d "$source_path/assets/root" ]; then
        add_angular_asset "$assets_base/root" "."
        added_assets+=("root")
    fi

    # Check for other asset directories (exclude locale, icons, root)
    for subdir in "$source_path/assets"/*/; do
        if [ -d "$subdir" ]; then
            local dirname=$(basename "$subdir")
            if [[ "$dirname" != "icons" && "$dirname" != "root" && "$dirname" != "locale" ]]; then
                add_angular_asset "$assets_base/$dirname" "$dirname"
                added_assets+=("$dirname")
            fi
        fi
    done

    # Check for CSS files in assets directory
    for cssfile in "$source_path/assets"/*.css; do
        if [ -f "$cssfile" ]; then
            local filename=$(basename "$cssfile")
            add_angular_style "$assets_base/$filename"
            added_styles+=("$filename")
        fi
    done

    # Check for SCSS files in assets directory
    for scssfile in "$source_path/assets"/*.scss; do
        if [ -f "$scssfile" ]; then
            local filename=$(basename "$scssfile")
            add_angular_style "$assets_base/$filename"
            added_styles+=("$filename")
        fi
    done

    # Check for translation files
    if [ -d "$source_path/assets/locale" ]; then
        for xlf in "$source_path/assets/locale"/*.nl.xlf; do
            if [ -f "$xlf" ]; then
                local filename=$(basename "$xlf")
                add_angular_translation "nl" "$assets_base/locale/$filename"
                added_translations+=("$filename")
            fi
        done
        for xlf in "$source_path/assets/locale"/*.de.xlf; do
            if [ -f "$xlf" ]; then
                local filename=$(basename "$xlf")
                add_angular_translation "de" "$assets_base/locale/$filename"
                added_translations+=("$filename")
            fi
        done
    fi

    # Report what was added
    if [ ${#added_assets[@]} -gt 0 ]; then
        log_success "Added assets: ${added_assets[*]}"
    fi
    if [ ${#added_styles[@]} -gt 0 ]; then
        log_success "Added styles: ${added_styles[*]}"
    fi
    if [ ${#added_translations[@]} -gt 0 ]; then
        log_success "Added translations: ${added_translations[*]}"
    fi
}

add_angular_asset() {
    local input_path="$1"
    local output_path="$2"

    log_info "Adding asset: $input_path -> $output_path"

    local temp_file=$(mktemp)

    # Check if asset already exists
    local exists=$(jq --arg input "$input_path" \
        '.projects.app.architect.build.options.assets | map(select(type == "object" and .input == $input)) | length' \
        "$ANGULAR_JSON")

    if [ "$exists" -gt 0 ]; then
        log_warning "Asset '$input_path' already exists, skipping"
        rm -f "$temp_file"
        return
    fi

    # Add the asset
    jq --arg input "$input_path" --arg output "$output_path" \
        '.projects.app.architect.build.options.assets += [{"glob": "**/*", "input": $input, "output": $output}]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"
}

remove_angular_asset() {
    local input_path="$1"

    log_info "Removing asset: $input_path"

    local temp_file=$(mktemp)
    jq --arg input "$input_path" \
        '.projects.app.architect.build.options.assets = [.projects.app.architect.build.options.assets[] | select(type == "string" or .input != $input)]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"
}

add_angular_style() {
    local style_path="$1"

    log_info "Adding style: $style_path"

    local temp_file=$(mktemp)

    # Check if style already exists
    local exists=$(jq --arg style "$style_path" \
        '.projects.app.architect.build.options.styles | map(select(. == $style)) | length' \
        "$ANGULAR_JSON")

    if [ "$exists" -gt 0 ]; then
        log_warning "Style '$style_path' already exists, skipping"
        rm -f "$temp_file"
        return
    fi

    # Add the style
    jq --arg style "$style_path" \
        '.projects.app.architect.build.options.styles += [$style]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"
}

remove_angular_style() {
    local style_path="$1"

    log_info "Removing style: $style_path"

    local temp_file=$(mktemp)
    jq --arg style "$style_path" \
        '.projects.app.architect.build.options.styles = [.projects.app.architect.build.options.styles[] | select(. != $style)]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"
}

add_angular_translation() {
    local locale="$1"
    local translation_path="$2"

    log_info "Adding translation ($locale): $translation_path"

    local temp_file=$(mktemp)

    # Check if translation already exists
    local exists=$(jq --arg locale "$locale" --arg path "$translation_path" \
        '.projects.app.i18n.locales[$locale].translation | map(select(. == $path)) | length' \
        "$ANGULAR_JSON" 2>/dev/null || echo "0")

    if [ "$exists" -gt 0 ]; then
        log_warning "Translation '$translation_path' already exists, skipping"
        rm -f "$temp_file"
        return
    fi

    # Add the translation
    jq --arg locale "$locale" --arg path "$translation_path" \
        '.projects.app.i18n.locales[$locale].translation += [$path]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"
}

remove_angular_translation() {
    local locale="$1"
    local translation_path="$2"

    log_info "Removing translation ($locale): $translation_path"

    local temp_file=$(mktemp)
    jq --arg locale "$locale" --arg path "$translation_path" \
        '.projects.app.i18n.locales[$locale].translation = [.projects.app.i18n.locales[$locale].translation[] | select(. != $path)]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"
}

remove_all_module_assets() {
    local dir_name="$1"
    local assets_base="projects/$dir_name/assets"

    log_info "Removing all assets/styles/translations for $dir_name..."

    local temp_file=$(mktemp)

    # Remove all assets with input starting with the module's assets path
    jq --arg base "$assets_base" \
        '.projects.app.architect.build.options.assets = [.projects.app.architect.build.options.assets[] | select(type == "string" or (.input | startswith($base) | not))]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"

    # Remove all styles starting with the module's assets path
    temp_file=$(mktemp)
    jq --arg base "$assets_base" \
        '.projects.app.architect.build.options.styles = [.projects.app.architect.build.options.styles[] | select(startswith($base) | not)]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"

    # Remove all translations starting with the module's assets path
    temp_file=$(mktemp)
    jq --arg base "$assets_base" \
        '.projects.app.i18n.locales.nl.translation = [.projects.app.i18n.locales.nl.translation[] | select(startswith($base) | not)]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"

    temp_file=$(mktemp)
    jq --arg base "$assets_base" \
        '.projects.app.i18n.locales.de.translation = [.projects.app.i18n.locales.de.translation[] | select(startswith($base) | not)]' \
        "$ANGULAR_JSON" > "$temp_file" && mv "$temp_file" "$ANGULAR_JSON"

    log_success "Removed assets/styles/translations for $dir_name"
}

# =============================================================================
# environment.ts Management
# =============================================================================

add_environment_import() {
    local scope="$1"
    local lib_name="$2"
    local module_class="$3"
    local import_path="$scope/$lib_name"

    if [ -z "$module_class" ]; then
        log_info "No module class specified, skipping environment.ts update"
        return
    fi

    log_info "Adding '$module_class' to environment.ts..."

    # Check if import already exists
    if grep -q "import.*$module_class.*from '$import_path'" "$ENVIRONMENT_FILE" 2>/dev/null; then
        log_warning "Import for '$module_class' already exists in environment.ts"
        return
    fi

    # Create temp file
    local temp_file=$(mktemp)

    # Add import statement after the last import line
    # Find the line number of the last import statement
    local last_import_line=$(grep -n "^import " "$ENVIRONMENT_FILE" | tail -1 | cut -d: -f1)

    if [ -n "$last_import_line" ]; then
        # Insert new import after the last import
        head -n "$last_import_line" "$ENVIRONMENT_FILE" > "$temp_file"
        echo "import { $module_class } from '$import_path';" >> "$temp_file"
        tail -n +"$((last_import_line + 1))" "$ENVIRONMENT_FILE" >> "$temp_file"
    else
        # No imports found, add at the beginning
        echo "import { $module_class } from '$import_path';" > "$temp_file"
        cat "$ENVIRONMENT_FILE" >> "$temp_file"
    fi

    mv "$temp_file" "$ENVIRONMENT_FILE"

    # Now add the module to the imports array
    # Find the imports array and add the module before the closing bracket
    temp_file=$(mktemp)

    # Use sed to add the module to the imports array
    # Look for the pattern "imports: [" and add the module before the "],"
    if grep -q "$module_class," "$ENVIRONMENT_FILE" 2>/dev/null || grep -q "$module_class\]" "$ENVIRONMENT_FILE" 2>/dev/null; then
        log_warning "'$module_class' already in imports array"
        rm -f "$temp_file"
    else
        # Add module to imports array - find the line with "]," after "imports: ["
        # This is a bit tricky with sed, so we use awk
        awk -v module="$module_class" '
            /imports: \[/ { in_imports = 1 }
            in_imports && /^[[:space:]]*\],/ {
                # Insert the module before the closing ], with proper indentation
                print "    " module ","
                in_imports = 0
            }
            { print }
        ' "$ENVIRONMENT_FILE" > "$temp_file"

        mv "$temp_file" "$ENVIRONMENT_FILE"
    fi

    log_success "Added '$module_class' to environment.ts"
}

remove_environment_import() {
    local scope="$1"
    local lib_name="$2"
    local module_class="$3"
    local import_path="$scope/$lib_name"

    if [ -z "$module_class" ]; then
        log_info "No module class specified, skipping environment.ts cleanup"
        return
    fi

    log_info "Removing '$module_class' from environment.ts..."

    local temp_file=$(mktemp)

    # Remove the import statement
    grep -v "import.*{.*$module_class.*}.*from '$import_path'" "$ENVIRONMENT_FILE" > "$temp_file"
    mv "$temp_file" "$ENVIRONMENT_FILE"

    # Remove the module from the imports array
    temp_file=$(mktemp)
    # Remove the line containing just the module name (with optional comma)
    sed "/$module_class,*$/d" "$ENVIRONMENT_FILE" > "$temp_file"
    mv "$temp_file" "$ENVIRONMENT_FILE"

    log_success "Removed '$module_class' from environment.ts"
}

# =============================================================================
# Symlink Management
# =============================================================================

create_symlink() {
    local source_path="$1"
    local module_name="$2"
    local target_path="$PROJECTS_DIR/$module_name"

    # Convert to absolute path if relative
    if [[ ! "$source_path" = /* ]]; then
        source_path="$(cd "$SCRIPT_DIR" && cd "$(dirname "$source_path")" && pwd)/$(basename "$source_path")"
    fi

    if [ ! -d "$source_path" ]; then
        log_error "Source directory does not exist: $source_path"
        exit 1
    fi

    if [ -e "$target_path" ]; then
        if [ -L "$target_path" ]; then
            log_warning "Symlink already exists at $target_path, removing..."
            rm "$target_path"
        else
            log_error "A non-symlink file/directory already exists at $target_path"
            log_error "Please remove it manually or choose a different module name"
            exit 1
        fi
    fi

    log_info "Creating symlink: $target_path -> $source_path"
    ln -s "$source_path" "$target_path"
    log_success "Symlink created successfully"
}

remove_symlink() {
    local module_name="$1"
    local target_path="$PROJECTS_DIR/$module_name"

    if [ -L "$target_path" ]; then
        log_info "Removing symlink: $target_path"
        rm "$target_path"
        log_success "Symlink removed"
    elif [ -e "$target_path" ]; then
        log_warning "$target_path exists but is not a symlink, skipping removal"
    else
        log_warning "Symlink does not exist: $target_path"
    fi
}

# =============================================================================
# Commands
# =============================================================================

cmd_link() {
    local source_path=""
    local scope="@tailormap-viewer"
    local dir_name=""
    local lib_name=""
    local module_class=""
    local prefix="tm"
    local with_assets=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --scope)
                scope="$2"
                shift 2
                ;;
            --name)
                dir_name="$2"
                shift 2
                ;;
            --lib)
                lib_name="$2"
                shift 2
                ;;
            --module)
                module_class="$2"
                shift 2
                ;;
            --prefix)
                prefix="$2"
                shift 2
                ;;
            --assets)
                with_assets=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                exit 1
                ;;
            *)
                if [ -z "$source_path" ]; then
                    source_path="$1"
                else
                    log_error "Unexpected argument: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [ -z "$source_path" ]; then
        log_error "Source path is required"
        echo "Usage: $0 link <source-path> [--scope <scope>] [--name <name>] [--lib <lib>] [--module <class>] [--assets] [--prefix <prefix>]"
        exit 1
    fi

    # Convert to absolute path if relative (needed for asset detection)
    if [[ ! "$source_path" = /* ]]; then
        source_path="$(cd "$SCRIPT_DIR" && cd "$(dirname "$source_path")" && pwd)/$(basename "$source_path")"
    fi

    # Derive directory name from source path if not provided
    if [ -z "$dir_name" ]; then
        dir_name=$(basename "$source_path")
    fi

    # Use directory name as library name if not provided
    if [ -z "$lib_name" ]; then
        lib_name="$dir_name"
    fi

    log_info "Linking module:"
    log_info "  Source: $source_path"
    log_info "  Directory: projects/$dir_name"
    log_info "  Import path: $scope/$lib_name"
    if [ -n "$module_class" ]; then
        log_info "  Module class: $module_class (will be added to environment.ts)"
    fi
    if [ "$with_assets" = true ]; then
        log_info "  Assets: will auto-detect and add assets/styles/translations"
    fi
    log_info "  Prefix: $prefix"
    echo ""

    ensure_backup_dir
    backup_file "$TSCONFIG_FILE"
    backup_file "$ANGULAR_JSON"
    if [ -n "$module_class" ]; then
        backup_file "$ENVIRONMENT_FILE"
    fi

    create_symlink "$source_path" "$dir_name"
    add_tsconfig_path "$scope" "$dir_name" "$lib_name"
    add_angular_project "$dir_name" "$prefix"
    if [ -n "$module_class" ]; then
        add_environment_import "$scope" "$lib_name" "$module_class"
    fi
    if [ "$with_assets" = true ]; then
        detect_and_add_assets "$source_path" "$dir_name"
    fi
    add_to_state "$dir_name" "$source_path" "$scope" "$lib_name" "$module_class" "$with_assets"

    echo ""
    log_success "Module linked successfully!"
    echo ""
    echo "To use this module in your code, import from:"
    echo "  import { ... } from '$scope/$lib_name';"
    if [ -n "$module_class" ]; then
        echo ""
        echo "The module '$module_class' has been added to environment.ts imports."
    fi
    if [ "$with_assets" = true ]; then
        echo ""
        echo "Assets, styles, and translations have been added to angular.json."
    fi
    echo ""
    echo "To unlink this module later, run:"
    echo "  ./link-modules.sh unlink $dir_name"
}

cmd_unlink() {
    local dir_name="$1"

    if [ -z "$dir_name" ]; then
        log_error "Module directory name is required"
        echo "Usage: $0 unlink <directory-name>"
        exit 1
    fi

    local module_info=$(get_module_info "$dir_name")
    if [ -z "$module_info" ]; then
        log_warning "Module '$dir_name' not found in state file, attempting cleanup anyway..."
        local scope="@tailormap-viewer"
        local lib_name="$dir_name"
        local module_class=""
        local with_assets=false
    else
        local scope=$(echo "$module_info" | jq -r '.scope')
        local lib_name=$(echo "$module_info" | jq -r '.lib // .name')
        local module_class=$(echo "$module_info" | jq -r '.module // empty')
        local with_assets=$(echo "$module_info" | jq -r '.assets // false')
    fi

    log_info "Unlinking module: $dir_name"
    log_info "  Import path: $scope/$lib_name"
    if [ -n "$module_class" ]; then
        log_info "  Module class: $module_class"
    fi
    if [ "$with_assets" = "true" ]; then
        log_info "  Assets: will be removed"
    fi
    echo ""

    ensure_backup_dir
    backup_file "$TSCONFIG_FILE"
    backup_file "$ANGULAR_JSON"
    if [ -n "$module_class" ]; then
        backup_file "$ENVIRONMENT_FILE"
    fi

    remove_symlink "$dir_name"
    remove_tsconfig_path "$scope" "$lib_name"
    remove_angular_project "$dir_name"
    if [ -n "$module_class" ]; then
        remove_environment_import "$scope" "$lib_name" "$module_class"
    fi
    if [ "$with_assets" = "true" ]; then
        remove_all_module_assets "$dir_name"
    fi
    remove_from_state "$dir_name"

    echo ""
    log_success "Module '$dir_name' unlinked successfully!"
}

cmd_list() {
    init_state_file

    echo ""
    echo "Linked Modules:"
    echo "==============="

    local modules=$(jq -r '.linkedModules[] | "\(.name)\t\(.scope)/\(.lib // .name)\t\(.module // "-")\t\(if .assets then "✓" else "-" end)\t\(.source)"' "$STATE_FILE" 2>/dev/null)

    if [ -z "$modules" ]; then
        echo "  (none)"
    else
        echo ""
        printf "  %-15s %-25s %-18s %-7s %s\n" "DIRECTORY" "IMPORT PATH" "MODULE CLASS" "ASSETS" "SOURCE"
        printf "  %-15s %-25s %-18s %-7s %s\n" "---------" "-----------" "------------" "------" "------"
        while IFS=$'\t' read -r name import_path module_class assets source; do
            printf "  %-15s %-25s %-18s %-7s %s\n" "$name" "$import_path" "$module_class" "$assets" "$source"
        done <<< "$modules"
    fi
    echo ""
}

cmd_status() {
    echo ""
    echo "Link Modules Status"
    echo "==================="
    echo ""

    # Check state file
    if [ -f "$STATE_FILE" ]; then
        log_info "State file: $STATE_FILE (exists)"
    else
        log_warning "State file: $STATE_FILE (not found)"
    fi

    # Check backups
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l | tr -d ' ')
        log_info "Backup directory: $BACKUP_DIR ($backup_count backups)"
    else
        log_info "Backup directory: $BACKUP_DIR (not created yet)"
    fi

    echo ""

    # List linked modules and verify symlinks
    init_state_file
    local modules=$(jq -r '.linkedModules[] | "\(.name)\t\(.scope)/\(.lib // .name)\t\(.module // "")"' "$STATE_FILE" 2>/dev/null)

    if [ -z "$modules" ]; then
        log_info "No linked modules"
    else
        echo "Linked modules:"
        while IFS=$'\t' read -r name import_path module_class; do
            local target_path="$PROJECTS_DIR/$name"
            if [ -L "$target_path" ]; then
                local link_target=$(readlink "$target_path")
                if [ -d "$target_path" ]; then
                    echo -e "  ${GREEN}✓${NC} $name -> $link_target"
                    echo -e "      Import: $import_path"
                    if [ -n "$module_class" ]; then
                        echo -e "      Module: $module_class (in environment.ts)"
                    fi
                else
                    echo -e "  ${RED}✗${NC} $name -> $link_target (broken link)"
                fi
            else
                echo -e "  ${RED}✗${NC} $name (symlink missing)"
            fi
        done <<< "$modules"
    fi
    echo ""
}

cmd_revert() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "No backups found. Nothing to revert."
        exit 1
    fi

    echo ""
    echo "Available backups:"
    echo ""

    ls -lt "$BACKUP_DIR" | head -20

    echo ""
    echo "To restore a specific backup, copy it back to the original location."
    echo "For example:"
    echo "  cp $BACKUP_DIR/tsconfig.json.<timestamp>.backup $TSCONFIG_FILE"
    echo "  cp $BACKUP_DIR/angular.json.<timestamp>.backup $ANGULAR_JSON"
    echo ""

    read -p "Do you want to restore the most recent backups? [y/N] " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local latest_tsconfig=$(ls -t "$BACKUP_DIR"/tsconfig.json.*.backup 2>/dev/null | head -1)
        local latest_angular=$(ls -t "$BACKUP_DIR"/angular.json.*.backup 2>/dev/null | head -1)
        local latest_environment=$(ls -t "$BACKUP_DIR"/environment.ts.*.backup 2>/dev/null | head -1)

        if [ -n "$latest_tsconfig" ]; then
            cp "$latest_tsconfig" "$TSCONFIG_FILE"
            log_success "Restored tsconfig.json from $latest_tsconfig"
        else
            log_warning "No tsconfig.json backup found"
        fi

        if [ -n "$latest_angular" ]; then
            cp "$latest_angular" "$ANGULAR_JSON"
            log_success "Restored angular.json from $latest_angular"
        else
            log_warning "No angular.json backup found"
        fi

        if [ -n "$latest_environment" ]; then
            cp "$latest_environment" "$ENVIRONMENT_FILE"
            log_success "Restored environment.ts from $latest_environment"
        else
            log_warning "No environment.ts backup found"
        fi

        # Also unlink all modules
        log_info "Removing all symlinks..."
        init_state_file
        local modules=$(jq -r '.linkedModules[] | .name' "$STATE_FILE" 2>/dev/null)
        while read -r name; do
            if [ -n "$name" ]; then
                remove_symlink "$name"
            fi
        done <<< "$modules"

        # Clear state
        echo '{"linkedModules":[]}' > "$STATE_FILE"

        echo ""
        log_success "Revert complete!"
    else
        log_info "Revert cancelled"
    fi
}

cmd_help() {
    cat << EOF
Angular Module Symlink Manager for tailormap-viewer

USAGE:
    ./link-modules.sh <command> [options]

COMMANDS:
    link <source-path>   Link an external module into the project
        --scope <scope>  Package scope (default: @tailormap-viewer)
        --name <name>    Directory name in projects/ (default: source dir name)
        --lib <lib>      Library name for imports (default: same as --name)
        --module <class> Angular module class to add to environment.ts (optional)
        --assets         Auto-detect and add assets/styles/translations to angular.json
        --prefix <prefix> Angular component prefix (default: tm)

    unlink <dir-name>    Unlink a previously linked module by directory name

    list                 List all linked modules

    status               Show detailed status of linked modules

    revert               Restore configuration files from backups

EXAMPLES:
    # Link a module from tailormap-gbi
    ./link-modules.sh link ../tailormap-gbi/projects/gbi-plugin

    # Link with custom scope and directory name
    ./link-modules.sh link ../tailormap-gbi/projects/gbi --scope @tailormap-gbi --name plugin

    # Link with different directory name but keep original library name for imports
    # This creates projects/gbi-shared but imports as @tailormap-gbi/shared
    ./link-modules.sh link ../tailormap-gbi/projects/shared --scope @tailormap-gbi --name gbi-shared --lib shared

    # Link and add module to environment.ts
    ./link-modules.sh link ../tailormap-gbi/projects/maps --scope @tailormap-gbi --module GbiMapsModule

    # Link with assets (like ng-add schematic) - auto-detects assets/styles/translations
    ./link-modules.sh link ../tailormap-gbi/projects/maps --scope @tailormap-gbi --module GbiMapsModule --assets

    # Full example with all options
    ./link-modules.sh link ../tailormap-gbi/projects/shared \\
        --scope @tailormap-gbi \\
        --name gbi-shared \\
        --lib shared \\
        --module GbiSharedModule \\
        --assets

    # Unlink a module (use the directory name, not the lib name)
    ./link-modules.sh unlink gbi-shared

    # List all linked modules
    ./link-modules.sh list

    # Check status
    ./link-modules.sh status

    # Revert all changes
    ./link-modules.sh revert

ASSETS DETECTION (--assets flag):
    When --assets is specified, the script auto-detects:
    - assets/icons/     -> copied to dist/icons/
    - assets/root/      -> copied to dist/ root
    - assets/*.css      -> added to styles
    - assets/*.scss     -> added to styles
    - assets/locale/*.nl.xlf -> added to i18n translations (nl)
    - assets/locale/*.de.xlf -> added to i18n translations (de)

NOTES:
    - Backups are stored in .link-modules-backup/
    - State is tracked in .linked-modules.json
    - Use --lib when you need to avoid directory conflicts but keep original import paths
    - Use --module to automatically add the Angular module to environment.ts
    - Use --assets to replicate ng-add schematic behavior for assets/styles/translations
    - After linking, import modules using: import { ... } from '<scope>/<lib>';

EOF
}

# =============================================================================
# Main
# =============================================================================

main() {
    ensure_jq

    local command="${1:-help}"
    shift || true

    case "$command" in
        link)
            cmd_link "$@"
            ;;
        unlink)
            cmd_unlink "$@"
            ;;
        list)
            cmd_list
            ;;
        status)
            cmd_status
            ;;
        revert)
            cmd_revert
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
