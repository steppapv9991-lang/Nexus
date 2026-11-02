#!/usr/bin/env bash
# ============================================================================
# NexusAI — Installer Script
# ============================================================================
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USER/nexus-core/main/install.sh | bash
#
# Or download and run locally:
#   wget https://raw.githubusercontent.com/YOUR_USER/nexus-core/main/install.sh
#   chmod +x install.sh && ./install.sh
# ============================================================================

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Helper functions ────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✓${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✗${NC}  $*"; }
header()  { echo -e "\n${BOLD}${CYAN}── $* ──${NC}\n"; }

# ─── Pre-flight checks ──────────────────────────────────────────────────────
header "NexusAI Installer"

# Check OS
OS="$(uname -s)"
case "$OS" in
    Linux*)   PLATFORM=linux;;
    Darwin*)  PLATFORM=macos;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM=windows;;
    *)        error "Unsupported OS: $OS"; exit 1;;
esac
success "Operating system: $OS ($PLATFORM)"

# Check architecture
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64|amd64) ARCH_NAME="x86_64";;
    aarch64|arm64) ARCH_NAME="arm64";;
    *) error "Unsupported architecture: $ARCH"; exit 1;;
esac
success "Architecture: $ARCH ($ARCH_NAME)"

# Check Python
header "Checking Python"

PYTHON=""
for cmd in python3.12 python3.11 python3 python; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON="$cmd"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    error "Python not found!"
    echo ""
    echo "Please install Python 3.11 or newer:"
    if [ "$PLATFORM" = "macos" ]; then
        echo "  brew install python@3.12"
        echo "  # or download from https://www.python.org/downloads/"
    elif [ "$PLATFORM" = "linux" ]; then
        echo "  # Ubuntu/Debian:"
        echo "  sudo apt update && sudo apt install python3.12 python3.12-venv"
        echo "  # Fedora:"
        echo "  sudo dnf install python3.12"
        echo "  # Arch:"
        echo "  sudo pacman -S python"
    fi
    exit 1
fi

PYTHON_VERSION=$($PYTHON --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
    error "Python $PYTHON_VERSION found, but 3.11+ required"
    exit 1
fi
success "Python $PYTHON_VERSION found ($PYTHON)"

# Check pip
if ! $PYTHON -m pip --version &>/dev/null; then
    warn "pip not found, installing..."
    curl -sS https://bootstrap.pypa.io/get-pip.py | $PYTHON
    success "pip installed"
fi

# ─── Installation directory ──────────────────────────────────────────────────
header "Setting up NexusAI"

NEXUS_HOME="${NEXUS_HOME:-$HOME/.nexus}"
mkdir -p "$NEXUS_HOME"
success "NexusAI home: $NEXUS_HOME"

# ─── Virtual environment ─────────────────────────────────────────────────────
info "Creating virtual environment..."
$PYTHON -m venv "$NEXUS_HOME/venv"
source "$NEXUS_HOME/venv/bin/activate"
success "Virtual environment created and activated"

# Upgrade pip
python -m pip install --upgrade pip --quiet

# ─── Install NexusAI ─────────────────────────────────────────────────────────
header "Installing NexusAI"

# Option 1: From PyPI (when published)
# pip install "nexus-core[full]"

# Option 2: From GitHub (current working method)
GITHUB_REPO="${NEXUS_REPO:-https://github.com/nexusai/nexus-core.git}"

info "Cloning from $GITHUB_REPO ..."
if [ -d "$NEXUS_HOME/src" ]; then
    info "Updating existing installation..."
    cd "$NEXUS_HOME/src"
    git pull --quiet
else
    git clone --quiet "$GITHUB_REPO" "$NEXUS_HOME/src"
    cd "$NEXUS_HOME/src"
fi

info "Installing package with all extras..."
pip install -e ".[full]" --quiet
success "NexusAI installed"

# ─── Create config ───────────────────────────────────────────────────────────
header "Creating configuration"

CONFIG_FILE="$NEXUS_HOME/config.yaml"
ENV_FILE="$NEXUS_HOME/.env"

if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << 'YAML'
# NexusAI Configuration
# Documentation: https://github.com/nexusai/nexus-core/wiki

profiles:
  default:
    model: "claude-sonnet-4-20250514"
    provider: "anthropic"
    max_tokens: 8192
    temperature: 0.3

  fast:
    model: "gpt-4o-mini"
    provider: "openai"
    max_tokens: 4096
    temperature: 0.5

  local:
    model: "codellama:34b"
    provider: "ollama"
    base_url: "http://localhost:11434"
    max_tokens: 4096

models:
  primary:
    model_id: "claude-sonnet-4-20250514"
    provider: "anthropic"
    api_key: "${ANTHROPIC_API_KEY}"
    context_window: 200000
    fallback_models: ["gpt-4o"]

  secondary:
    model_id: "gpt-4o"
    provider: "openai"
    api_key: "${OPENAI_API_KEY}"
    context_window: 128000
    fallback_models: ["claude-sonnet-4-20250514"]

context:
  max_tokens: 128000
  compression_threshold: 0.8
  auto_compress: true

security:
  sandbox:
    enabled: true
    allowed_paths:
      - "."
      - "/tmp/nexus-*"
    blocked_paths:
      - "/etc/**"
      - "~/.ssh/**"
      - "~/.aws/**"
  shell:
    allowed_commands:
      - "ls" - "cat" - "grep" - "find" - "git"
      - "npm" - "python" - "node" - "cargo"
    require_approval:
      - "rm" - "mv" - "sudo"

skills:
  directory: "./skills"
  auto_load: true
  max_tools_in_context: 15

ui:
  theme: "dark"
  streaming: true
  show_thoughts: true
  diff_preview: true
YAML
    success "Config created: $CONFIG_FILE"
else
    info "Config already exists, skipping"
fi

if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'ENV'
# NexusAI API Keys
# Get your keys:
#   Anthropic: https://console.anthropic.com
#   OpenAI:    https://platform.openai.com/api-keys
#   OpenRouter: https://openrouter.ai/keys

ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
ENV
    chmod 600 "$ENV_FILE"
    success "Env file created: $ENV_FILE (permissions: 600)"
else
    info "Env file already exists, skipping"
fi

# Create skills directory
mkdir -p "$NEXUS_HOME/skills"
success "Skills directory: $NEXUS_HOME/skills"

# ─── Shell integration ───────────────────────────────────────────────────────
header "Shell integration"

# Create nexus launcher script
LAUNCHER="$NEXUS_HOME/bin/nexus"
mkdir -p "$(dirname "$LAUNCHER")"
cat > "$LAUNCHER" << LAUNCHER
#!/usr/bin/env bash
# NexusAI launcher
source "$NEXUS_HOME/venv/bin/activate"
source "$NEXUS_HOME/.env" 2>/dev/null || true
exec python -m nexus_core "\$@"
LAUNCHER
chmod +x "$LAUNCHER"
success "Launcher created: $LAUNCHER"

# Add to PATH
SHELL_RC=""
if [ -n "${ZSH_VERSION:-}" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "${BASH_VERSION:-}" ] || [ "$SHELL" = "/bin/bash" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then
    SHELL_RC="$HOME/.profile"
fi

if [ -n "$SHELL_RC" ]; then
    PATH_LINE="export PATH=\"$NEXUS_HOME/bin:\$PATH\""
    if ! grep -qF "nexus/bin" "$SHELL_RC" 2>/dev/null; then
        echo "" >> "$SHELL_RC"
        echo "# NexusAI" >> "$SHELL_RC"
        echo "$PATH_LINE" >> "$SHELL_RC"
        success "Added $NEXUS_HOME/bin to PATH in $SHELL_RC"
    else
        info "PATH already configured in $SHELL_RC"
    fi
    export PATH="$NEXUS_HOME/bin:$PATH"
fi

# ─── Verify ──────────────────────────────────────────────────────────────────
header "Verification"

if command -v nexus &>/dev/null || [ -x "$LAUNCHER" ]; then
    success "nexus command available"
    nexus --version 2>/dev/null || info "(version check requires restart of shell)"
else
    warn "nexus not in PATH yet — restart your terminal or run:"
    echo "    source $SHELL_RC"
fi

# ─── Done ────────────────────────────────────────────────────────────────────
header "Installation complete! 🚀"

echo -e "${BOLD}Next steps:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Add your API keys to ${BOLD}$ENV_FILE${NC}"
echo -e "     ${YELLOW}nano $ENV_FILE${NC}"
echo ""
echo -e "  ${CYAN}2.${NC} Restart your terminal (or run ${BOLD}source $SHELL_RC${NC})"
echo ""
echo -e "  ${CYAN}3.${NC} Go to your project and start NexusAI:"
echo -e "     ${YELLOW}cd ~/my-project${NC}"
echo -e "     ${YELLOW}nexus${NC}"
echo ""
echo -e "  ${CYAN}4.${NC} Try a query:"
echo -e "     ${YELLOW}nexus -q \"explain this project\"${NC}"
echo ""
echo -e "${GREEN}${BOLD}Happy coding! 💻${NC}"
echo ""
echo -e "Docs:    ${BLUE}https://github.com/nexusai/nexus-core/wiki${NC}"
echo -e "Issues:  ${BLUE}https://github.com/nexusai/nexus-core/issues${NC}"
echo -e "Discord: ${BLUE}https://discord.gg/nexusai${NC}"
