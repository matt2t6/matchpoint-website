// Puter.js Startup Authentication - Auto-initialized by start-stack.ps1
// This script runs automatically when the stack starts to enable seamless Puter integration

(function() {
    'use strict';

    console.log('[start-stack] 🚀 Puter.js startup authentication initialized');

    // Wait for DOM and Puter SDK to be ready
    const initPuterAuth = () => {
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkPuterSDK);
            return;
        }

        checkPuterSDK();
    };

    const checkPuterSDK = () => {
        if (window.puter && window.puter.auth) {
            console.log('[start-stack] ✅ Puter SDK detected, initializing authentication...');
            startPuterAuth();
        } else {
            console.log('[start-stack] ⏳ Waiting for Puter SDK to load...');
            setTimeout(checkPuterSDK, 500);
        }
    };

    const startPuterAuth = async () => {
        try {
            // Check current authentication status
            const user = await window.puter.auth.getUser();

            if (user && (user.username || user.email)) {
                console.log('[start-stack] ✅ Already authenticated as:', user.username || user.email);

                // Update UI to show authenticated state
                updateAuthUI(true, user);

                // Initialize cloud storage for demo data
                initializeCloudStorage(user);
                return;
            }

            console.log('[start-stack] 🔄 No active session found, attempting automatic sign-in...');

            // Attempt automatic sign-in for demo purposes
            try {
                await window.puter.auth.signIn();
                const newUser = await window.puter.auth.getUser();

                if (newUser) {
                    console.log('[start-stack] ✅ Auto-signed in as:', newUser.username || newUser.email);
                    updateAuthUI(true, newUser);
                    initializeCloudStorage(newUser);
                    return;
                }
            } catch (signInError) {
                console.log('[start-stack] ℹ️  Auto sign-in failed, manual authentication required');
                console.log('[start-stack] 💡 Click the "Sign In" button in the Aegis panel to authenticate');
            }

            // Update UI to show sign-in available
            updateAuthUI(false);

        } catch (error) {
            console.log('[start-stack] ℹ️  Puter authentication not yet available:', error.message);
            console.log('[start-stack] 💡 Click the "Sign In" button when ready to authenticate');

            // Update UI to show sign-in available
            updateAuthUI(false);
        }
    };

    const initializeCloudStorage = async (user) => {
        try {
            // Create demo data directory in cloud storage
            const demoDir = await window.puter.fs.mkdir(MatchPoint-Demo-, {createMissingParents: true});
            console.log('[start-stack] 📁 Cloud storage initialized:', demoDir.name);

            // Store initial demo configuration
            const config = {
                version: 'phoenix-pro-v1',
                timestamp: new Date().toISOString(),
                user: user.username || user.email,
                features: ['aegis-dashboard', 'redis-cache', 'real-time-analytics']
            };

            await window.puter.fs.write('demo-config.json', JSON.stringify(config, null, 2));
            console.log('[start-stack] 💾 Demo configuration saved to cloud');

        } catch (storageError) {
            console.log('[start-stack] ℹ️  Cloud storage initialization failed (optional):', storageError.message);
        }
    };

    const updateAuthUI = (isAuthenticated, user = null) => {
        // Update cloud status indicator if it exists
        const cloudIndicator = document.getElementById('cloud-status');
        const signInBtn = document.getElementById('puter-signin-btn');

        if (cloudIndicator) {
            if (isAuthenticated) {
                cloudIndicator.textContent = '☁️';
                cloudIndicator.title = Authenticated as ;
                cloudIndicator.style.color = '#00f5d4'; // aegis-neon color
            } else {
                cloudIndicator.textContent = '☁️';
                cloudIndicator.title = 'Click Sign In to authenticate with Puter';
                cloudIndicator.style.color = '#64748b'; // muted color
            }
        }

        if (signInBtn && !isAuthenticated) {
            signInBtn.style.display = 'block';
            signInBtn.textContent = 'Sign In';
        }
    };

    // Start the initialization process
    initPuterAuth();

    console.log('[start-stack] 🎯 Puter.js authentication startup complete');
})();
