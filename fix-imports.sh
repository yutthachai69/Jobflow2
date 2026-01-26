#!/bin/bash
# Script to fix all imports from @/app/actions to @/app/actions/index

find app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s|from '@/app/actions'|from '@/app/actions/index'|g" {} \;
