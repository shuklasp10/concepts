#!/bin/bash

# Move to the repository root
cd "$(dirname "$0")/.."

# Colors for logging
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}   🧠 KNOWLEDGE BASE SETUP WIZARD       ${NC}"
echo -e "${CYAN}=========================================${NC}"
echo -e "Initializing environment..."

# Function for logging
log_process() {
    echo -e "${YELLOW}[PROCESS]${NC} $1..."
}

# 1. Setting Git Hooks
log_process "Configuring local Git hooks path"
if git config core.hooksPath setup/assets/.githooks; then
    echo -e "  ${GREEN}✅ Success: Hooks path set to setup/assets/.githooks${NC}"
else
    echo -e "  ${RED}❌ Failed to set hooks path${NC}"; exit 1
fi

# 2. Setting Commit Template
log_process "Linking commit message template"
if git config commit.template setup/assets/.gitmessage; then
    echo -e "  ${GREEN}✅ Success: Template linked to .gitmessage${NC}"
else
    echo -e "  ${RED}❌ Failed to link template${NC}"; exit 1
fi

# 3. Permissions
log_process "Updating file permissions"
chmod +x setup/assets/.githooks/commit-msg
chmod +x setup/setup.sh
echo -e "  ${GREEN}✅ Success: Execution bits updated${NC}"

# 4. Git aliases
log_process "Registering Git Aliases"
git config --local alias.notes "log --oneline --grep='^note:'"
git config --local alias.today "log --oneline --since='1 day ago'"
git config --local alias.sync "push"
echo -e "  ${GREEN}✅ Success: Aliases (nlog, today, sync) registered.${NC}"

echo -e "\n${GREEN}✨ SETUP COMPLETE! Your brain is now synced. ✨${NC}"
echo -e "Remember: Use ${CYAN}note:, docs:, fix:, refactor:, asset:, or chore:${NC}"