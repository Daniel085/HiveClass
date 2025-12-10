#!/bin/bash

# Fix Montage Framework Dependencies
# This script creates symlinks for Montage's nested node_modules requirement
# because modern npm uses flat hoisting but Montage expects npm v2-style nesting

echo "🔧 Fixing Montage framework dependencies..."

# Login app
if [ -d "login/node_modules/montage" ]; then
    echo "  📁 Fixing login app..."
    mkdir -p login/node_modules/montage/node_modules
    cd login/node_modules/montage/node_modules
    ln -sf ../../bluebird bluebird 2>/dev/null
    ln -sf ../packages/mr mr 2>/dev/null
    cd ../../../..
    echo "  ✅ Login app fixed"
fi

# Student app
if [ -d "student/node_modules/montage" ]; then
    echo "  📁 Fixing student app..."
    mkdir -p student/node_modules/montage/node_modules
    cd student/node_modules/montage/node_modules
    ln -sf ../../bluebird bluebird 2>/dev/null
    ln -sf ../packages/mr mr 2>/dev/null
    cd ../../../..
    echo "  ✅ Student app fixed"
fi

# Teacher app
if [ -d "teacher/node_modules/montage" ]; then
    echo "  📁 Fixing teacher app..."
    mkdir -p teacher/node_modules/montage/node_modules
    cd teacher/node_modules/montage/node_modules
    ln -sf ../../bluebird bluebird 2>/dev/null
    ln -sf ../packages/mr mr 2>/dev/null
    cd ../../../..
    echo "  ✅ Teacher app fixed"
fi

echo "✨ Montage dependencies fixed!"
echo ""
echo "Note: This is a workaround for Montage.js (2012-2015 framework)"
echo "See MONTAGE_FRAMEWORK_TECHNICAL_DEBT.md for full details"
