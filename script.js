// ==========================================
// APPLICATION STATE
// ==========================================
const APP = {
    currentUser: null,
    users: {}
};

// ==========================================
// INITIALIZATION
// ==========================================
function init() {
    loadState();
    updateNavigation();
    updateHomePageAuth();
    setupEventListeners();
    renderPublicCampaigns();
}

function loadState() {
    try {
        const users = localStorage.getItem('dk_users');
        const current = localStorage.getItem('dk_current');

        if (users) APP.users = JSON.parse(users);
        if (current) APP.currentUser = JSON.parse(current);
    } catch (e) {
        console.error('Error loading state:', e);
    }
}

function saveState() {
    localStorage.setItem('dk_users', JSON.stringify(APP.users));
    if (APP.currentUser) {
        localStorage.setItem('dk_current', JSON.stringify(APP.currentUser));
    } else {
        localStorage.removeItem('dk_current');
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // QR Upload
    const qrUploadArea = document.getElementById('qrUploadArea');
    const qrFileInput = document.getElementById('qrFileInput');
    
    if (qrUploadArea) {
        qrUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            qrUploadArea.classList.add('dragover');
        });
        
        qrUploadArea.addEventListener('dragleave', () => {
            qrUploadArea.classList.remove('dragover');
        });
        
        qrUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            qrUploadArea.classList.remove('dragover');
            handleFileUpload(e.dataTransfer.files);
        });
        
        qrFileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files);
            e.target.value = '';
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('active');
        }
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// ==========================================
// HOME PAGE AUTH STATE
// ==========================================
function updateHomePageAuth() {
    const heroAuthButtons = document.getElementById('heroAuthButtons');

    if (APP.currentUser) {
        heroAuthButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="navigateTo('dashboard')">
                📊 Go to Dashboard
            </button>
        `;
    } else {
        heroAuthButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="openModal('signupModal')">Sign Up</button>
            <button class="btn btn-outline" onclick="openModal('loginModal')">Sign In</button>
        `;
    }
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(page) {
    if (page === 'dashboard') {
        if (!APP.currentUser) {
            showToast('Please sign in first!', 'warning');
            openModal('loginModal');
            return;
        }
    }

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Close mobile menu
    document.getElementById('navLinks').classList.remove('active');

    // Render page content
    if (page === 'home') {
        updateHomePageAuth();
    } else if (page === 'dashboard' && APP.currentUser) {
        renderDashboard();
    } else if (page === 'donations') {
        renderPublicCampaigns();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}

function updateNavigation() {
    const authNav = document.getElementById('authNav');
    
    if (APP.currentUser) {
        authNav.innerHTML = `
            <button class="nav-link" data-page="dashboard" onclick="navigateTo('dashboard')">
                📊 Get Support
            </button>
            <div class="user-menu">
                <button class="user-menu-btn" onclick="toggleUserDropdown()">
                    <div class="user-avatar">${APP.currentUser.name.charAt(0).toUpperCase()}</div>
                    <span>${APP.currentUser.name}</span>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <button class="user-dropdown-item" onclick="navigateTo('dashboard')">
                        📊 Dashboard
                    </button>
                    <div class="user-dropdown-divider"></div>
                    <button class="user-dropdown-item" onclick="handleLogout()">
                        🚪 Sign Out
                    </button>
                </div>
            </div>
        `;
    } else {
        authNav.innerHTML = `
            <button class="btn btn-secondary btn-sm" onclick="openModal('signupModal')">Sign Up</button>
            <button class="btn btn-outline btn-sm" onclick="openModal('loginModal')">Sign In</button>
        `;
    }
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

// ==========================================
// AUTHENTICATION
// ==========================================
function handleCreatePage() {
    if (APP.currentUser) {
        navigateTo('dashboard');
    } else {
        openModal('signupModal');
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    if (APP.users[email]) {
        showToast('Email already registered!', 'error');
        return;
    }

    APP.users[email] = {
        email,
        password,
        name,
        qrCodes: [],
        links: [],
        campaigns: []
    };

    APP.currentUser = APP.users[email];
    saveState();
    closeModal('signupModal');
    updateNavigation();
    updateHomePageAuth();
    showToast(`Welcome, ${name}!`, 'success');
    navigateTo('dashboard');
    e.target.reset();
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const user = APP.users[email];

    if (!user || user.password !== password) {
        showToast('Invalid email or password!', 'error');
        return;
    }

    APP.currentUser = user;
    saveState();
    closeModal('loginModal');
    updateNavigation();
    updateHomePageAuth();
    showToast(`Welcome back, ${user.name}!`, 'success');
    navigateTo('dashboard');
    e.target.reset();
}

function handleLogout() {
    APP.currentUser = null;
    saveState();
    updateNavigation();
    updateHomePageAuth();
    showToast('Signed out successfully!', 'success');
    navigateTo('home');
}

// ==========================================
// MODALS
// ==========================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

function switchAuthModal(type) {
    if (type === 'signup') {
        closeModal('loginModal');
        setTimeout(() => openModal('signupModal'), 200);
    } else {
        closeModal('signupModal');
        setTimeout(() => openModal('loginModal'), 200);
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: '✓', error: '✗', warning: '⚠' };
    toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// DASHBOARD RENDERING
// ==========================================
function renderDashboard() {
    if (!APP.currentUser) return;
    
    const user = APP.users[APP.currentUser.email];
    
    // Profile Section
    document.getElementById('profileSection').innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
                <h2>${user.name}</h2>
                <p>${user.email}</p>
            </div>
        </div>
        <div class="profile-stats">
            <div class="stat-item">
                <div class="stat-value">${user.qrCodes.length}</div>
                <div class="stat-label">QR Codes</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${user.links.length}</div>
                <div class="stat-label">Links</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${user.campaigns.length}</div>
                <div class="stat-label">Campaigns</div>
            </div>
        </div>
    `;

    // Update counters
    document.getElementById('qrCount').textContent = user.qrCodes.length;
    document.getElementById('linksCount').textContent = user.links.length;
    document.getElementById('campaignsCount').textContent = user.campaigns.length;

    renderUserQRCodes();
    renderUserLinks();
    renderUserCampaigns();
}

function renderUserQRCodes() {
    const user = APP.users[APP.currentUser.email];
    const grid = document.getElementById('qrGrid');
    const empty = document.getElementById('qrEmptyState');

    if (user.qrCodes.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        grid.innerHTML = user.qrCodes.map((qr, i) => `
            <div class="glass-card item-card">
                <div class="item-card-image" onclick="previewImage('${qr.data}')">
                    <img src="${qr.data}" alt="${qr.name}">
                </div>
                <div class="item-card-title">${qr.name}</div>
                <div class="item-card-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteUserQR(${i})">Delete</button>
                </div>
            </div>
        `).join('');
    }
}

function renderUserLinks() {
    const user = APP.users[APP.currentUser.email];
    const list = document.getElementById('linksList');
    const empty = document.getElementById('linksEmptyState');

    if (user.links.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        list.innerHTML = user.links.map((link, i) => `
            <div class="glass-card link-item">
                <div class="link-icon">${link.icon}</div>
                <div class="link-info">
                    <h4>${link.title}</h4>
                    <a href="${link.url}" target="_blank">${link.url}</a>
                </div>
                <div class="link-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteUserLink(${i})">Delete</button>
                </div>
            </div>
        `).join('');
    }
}

function renderUserCampaigns() {
    const user = APP.users[APP.currentUser.email];
    const grid = document.getElementById('campaignsGrid');
    const empty = document.getElementById('campaignsEmptyState');

    if (user.campaigns.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        grid.innerHTML = user.campaigns.map((c, i) => `
            <div class="glass-card campaign-card">
                <div class="campaign-image">${getPlatformIcon(c.platform)}</div>
                <h3 class="campaign-title">${c.title}</h3>
                <p class="campaign-description">${c.description}</p>
                <div class="campaign-footer">
                    <span class="campaign-platform">${c.platform}</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Visit →</a>
                        <button class="btn btn-danger btn-sm" onclick="deleteUserCampaign(${i})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function getPlatformIcon(platform) {
    const icons = {
        kickstarter: '🚀',
        gofundme: '💚',
        indiegogo: '💡',
        patreon: '🎨',
        other: '🔗'
    };
    return icons[platform] || '🔗';
}

// ==========================================
// TAB SWITCHING
// ==========================================
function switchDashboardTab(tab) {
    document.querySelectorAll('#dashboardTabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#page-dashboard .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tab);
    });
}

// ==========================================
// FILE UPLOAD
// ==========================================
function handleFileUpload(files) {
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const user = APP.users[APP.currentUser.email];
    const remaining = 10 - user.qrCodes.length;
    
    if (remaining <= 0) {
        showToast('Maximum 10 QR codes allowed!', 'warning');
        return;
    }

    Array.from(files).slice(0, remaining).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showToast(`${file.name} is not an image!`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            user.qrCodes.push({ name: file.name, data: e.target.result });
            saveState();
            renderDashboard();
            showToast('QR code uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    });
}

// ==========================================
// USER CRUD OPERATIONS
// ==========================================
function deleteUserQR(index) {
    if (confirm('Delete this QR code?')) {
        APP.users[APP.currentUser.email].qrCodes.splice(index, 1);
        saveState();
        renderDashboard();
        showToast('QR code deleted!', 'success');
    }
}

function handleAddLink(e) {
    e.preventDefault();
    
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const user = APP.users[APP.currentUser.email];

    if (user.links.length >= 10) {
        showToast('Maximum 10 links allowed!', 'warning');
        return;
    }

    user.links.push({
        title: document.getElementById('linkTitle').value.trim(),
        url: document.getElementById('linkUrl').value.trim(),
        icon: document.getElementById('linkIcon').value.trim() || '🔗'
    });

    saveState();
    closeModal('addLinkModal');
    renderDashboard();
    showToast('Link added!', 'success');
    e.target.reset();
    document.getElementById('linkIcon').value = '🔗';
}

function deleteUserLink(index) {
    if (confirm('Delete this link?')) {
        APP.users[APP.currentUser.email].links.splice(index, 1);
        saveState();
        renderDashboard();
        showToast('Link deleted!', 'success');
    }
}

function handleAddCampaign(e) {
    e.preventDefault();
    
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const user = APP.users[APP.currentUser.email];

    user.campaigns.push({
        title: document.getElementById('campaignTitle').value.trim(),
        url: document.getElementById('campaignUrl').value.trim(),
        platform: document.getElementById('campaignPlatform').value,
        description: document.getElementById('campaignDescription').value.trim()
    });

    saveState();
    closeModal('addCampaignModal');
    renderDashboard();
    renderPublicCampaigns();
    showToast('Campaign added!', 'success');
    e.target.reset();
}

function deleteUserCampaign(index) {
    if (confirm('Delete this campaign?')) {
        APP.users[APP.currentUser.email].campaigns.splice(index, 1);
        saveState();
        renderDashboard();
        renderPublicCampaigns();
        showToast('Campaign deleted!', 'success');
    }
}

// ==========================================
// PUBLIC CAMPAIGNS
// ==========================================
function renderPublicCampaigns() {
    const grid = document.getElementById('publicCampaignsGrid');
    const empty = document.getElementById('publicCampaignsEmpty');

    const allCampaigns = [];
    Object.values(APP.users).forEach(user => {
        if (user.campaigns) {
            user.campaigns.forEach(c => {
                allCampaigns.push({ ...c, creator: user.name });
            });
        }
    });

    if (allCampaigns.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        grid.innerHTML = allCampaigns.map(c => `
            <div class="glass-card campaign-card">
                <div class="campaign-image">${getPlatformIcon(c.platform)}</div>
                <h3 class="campaign-title">${c.title}</h3>
                <p class="campaign-description">${c.description}</p>
                <div class="campaign-footer">
                    <div>
                        <span class="campaign-platform">${c.platform}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem;"> by ${c.creator}</span>
                    </div>
                    <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Support →</a>
                </div>
            </div>
        `).join('');
    }
}

// ==========================================
// IMAGE PREVIEW
// ==========================================
function previewImage(src) {
    document.getElementById('previewImage').src = src;
    openModal('imagePreviewModal');
}

// ==========================================
// INITIALIZE APP
// ==========================================
document.addEventListener('DOMContentLoaded', init);