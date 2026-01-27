#!/bin/bash

# Kriterion - File Tree Generator
# Generates a visual tree of the project structure

echo "# Kriterion Project Structure"
echo ""
echo "\`\`\`"
tree -L 3 -I 'node_modules|__pycache__|.next|*.pyc|.git' -a
echo "\`\`\`"
echo ""
echo "Total files created: $(find . -type f \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "Dockerfile" -o -name "Makefile" -o -name "*.md" -o -name "*.sh" -o -name "*.ini" \) ! -path "*/node_modules/*" ! -path "*/__pycache__/*" ! -path "*/.next/*" | wc -l)"
