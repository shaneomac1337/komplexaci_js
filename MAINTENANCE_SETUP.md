# 🔧 Komplexáci Maintenance Mode Setup

This guide will help you set up a beautiful maintenance page for your website that shows when the site is down for maintenance.

## 📋 What You Get

- **Beautiful maintenance page** with gaming clan theme
- **Easy maintenance mode toggle** (on/off with one command)
- **Automatic fallback** when Next.js app is down
- **Responsive design** that works on all devices
- **Interactive animations** and effects

## 🚀 Setup Instructions

### 1. Copy the maintenance page

```bash
# Copy the maintenance.html to nginx web directory
sudo cp maintenance.html /var/www/html/maintenance.html

# Set proper permissions
sudo chown www-data:www-data /var/www/html/maintenance.html
sudo chmod 644 /var/www/html/maintenance.html
```

### 2. Update nginx configuration

```bash
# Backup your current config
sudo cp /etc/nginx/sites-enabled/komplexaci.cz /etc/nginx/sites-enabled/komplexaci.cz.backup

# Copy the new config
sudo cp komplexaci.cz.conf /etc/nginx/sites-enabled/komplexaci.cz

# Test the configuration
sudo nginx -t

# If test passes, reload nginx
sudo nginx -s reload
```

### 3. Set up the maintenance script

```bash
# Copy the maintenance script
sudo cp maintenance.sh /usr/local/bin/maintenance
sudo chmod +x /usr/local/bin/maintenance

# Now you can use it from anywhere
maintenance status
```

## 🎮 How to Use

### Enable Maintenance Mode
```bash
# Enable maintenance mode
maintenance on
# or
sudo touch /var/www/maintenance.flag && sudo nginx -s reload
```

### Disable Maintenance Mode
```bash
# Disable maintenance mode
maintenance off
# or
sudo rm /var/www/maintenance.flag && sudo nginx -s reload
```

### Check Status
```bash
# Check current status
maintenance status
```

## 🔄 How It Works

1. **Normal Operation**: When `/var/www/maintenance.flag` doesn't exist, nginx proxies all requests to your Next.js app on localhost:3000

2. **Maintenance Mode**: When `/var/www/maintenance.flag` exists, nginx serves the maintenance page instead

3. **Automatic Fallback**: If your Next.js app crashes or is stopped, nginx automatically shows the maintenance page (502/503 errors)

## 🎨 Customizing the Maintenance Page

The maintenance page is located at `/var/www/html/maintenance.html`. You can edit it to:

- Change the message text
- Update colors and styling
- Add estimated downtime
- Include social media links
- Add your logo

### Key sections to customize:

```html
<!-- Main heading -->
<h1>Stránky jsou v údržbě</h1>

<!-- Message -->
<div class="message">
    Momentálně provádíme údržbu našich serverů pro lepší herní zážitek.<br>
    Stránky budou brzy opět dostupné!
</div>

<!-- Status badge -->
<div class="status">
    🚀 Vylepšujeme systém
</div>
```

## 🛠️ Troubleshooting

### Maintenance page not showing?
```bash
# Check if maintenance.html exists
ls -la /var/www/html/maintenance.html

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test nginx config
sudo nginx -t
```

### Permission issues?
```bash
# Fix permissions
sudo chown www-data:www-data /var/www/html/maintenance.html
sudo chmod 644 /var/www/html/maintenance.html
```

### Script not working?
```bash
# Make sure script is executable
sudo chmod +x /usr/local/bin/maintenance

# Check if flag directory exists
sudo mkdir -p /var/www
```

## 📱 Features of the Maintenance Page

- **Responsive design** - Works on desktop, tablet, and mobile
- **Animated background** - Floating particles effect
- **Interactive elements** - Mouse sparkle effects
- **Gaming theme** - Dark colors with gold accents
- **Loading animation** - Shows the site is being worked on
- **Professional look** - Matches your gaming clan aesthetic

## 🔄 Workflow Example

```bash
# Before maintenance
maintenance status
# Output: 🚀 Maintenance mode: DISABLED

# Enable maintenance
maintenance on
# Output: ✅ Maintenance mode ENABLED
#         🌐 Website now shows maintenance page

# Do your maintenance work...
# Stop Next.js app, update code, restart, etc.

# Disable maintenance
maintenance off
# Output: ✅ Maintenance mode DISABLED
#         🌐 Website is now live
```

## 🎯 Benefits

- **Professional appearance** during downtime
- **User-friendly** - visitors know what's happening
- **Easy management** - one command to toggle
- **Automatic fallback** - works even if you forget to enable it
- **SEO friendly** - returns proper 503 status codes
- **Mobile responsive** - looks great on all devices

Your users will now see a beautiful, professional maintenance page instead of ugly nginx error pages! 🎮✨
