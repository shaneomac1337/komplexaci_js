#!/bin/bash

# Komplexáci Maintenance Mode Manager
# Usage: ./maintenance.sh [on|off|status]

MAINTENANCE_FLAG="/var/www/maintenance.flag"
MAINTENANCE_HTML="/var/www/html/maintenance.html"

case "$1" in
    "on")
        echo "🔧 Enabling maintenance mode..."
        
        # Create maintenance flag
        sudo touch "$MAINTENANCE_FLAG"
        
        # Ensure maintenance.html exists
        if [ ! -f "$MAINTENANCE_HTML" ]; then
            echo "⚠️  Warning: $MAINTENANCE_HTML not found!"
            echo "Please copy maintenance.html to /var/www/html/"
            exit 1
        fi
        
        # Reload nginx
        sudo nginx -t && sudo nginx -s reload
        
        if [ $? -eq 0 ]; then
            echo "✅ Maintenance mode ENABLED"
            echo "🌐 Website now shows maintenance page"
        else
            echo "❌ Error reloading nginx"
            exit 1
        fi
        ;;
        
    "off")
        echo "🚀 Disabling maintenance mode..."
        
        # Remove maintenance flag
        sudo rm -f "$MAINTENANCE_FLAG"
        
        # Reload nginx
        sudo nginx -t && sudo nginx -s reload
        
        if [ $? -eq 0 ]; then
            echo "✅ Maintenance mode DISABLED"
            echo "🌐 Website is now live"
        else
            echo "❌ Error reloading nginx"
            exit 1
        fi
        ;;
        
    "status")
        if [ -f "$MAINTENANCE_FLAG" ]; then
            echo "🔧 Maintenance mode: ENABLED"
            echo "📅 Flag created: $(stat -c %y "$MAINTENANCE_FLAG")"
        else
            echo "🚀 Maintenance mode: DISABLED"
            echo "🌐 Website is live"
        fi
        ;;
        
    *)
        echo "Komplexáci Maintenance Mode Manager"
        echo ""
        echo "Usage: $0 [on|off|status]"
        echo ""
        echo "Commands:"
        echo "  on      - Enable maintenance mode"
        echo "  off     - Disable maintenance mode"
        echo "  status  - Check current maintenance status"
        echo ""
        echo "Examples:"
        echo "  $0 on     # Enable maintenance"
        echo "  $0 off    # Disable maintenance"
        echo "  $0 status # Check status"
        ;;
esac
