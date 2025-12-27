// ==========================================
// FIREBASE IMPORTS
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// YOUR FIREBASE CONFIG
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBm5_P7L85paQ53Gt6e8FxY36j9A5EV9Ag",
    authDomain: "donatekudos-app-b6d3b.firebaseapp.com",
    projectId: "donatekudos-app-b6d3b",
    storageBucket: "donatekudos-app-b6d3b.firebasestorage.app",
    messagingSenderId: "220214029300",
    appId: "1:220214029300:web:d9a9e3b438b51f4047e7a1",
    measurementId: "G-GR057X8BD8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// APP STATE
// ==========================================
const APP = {
    currentUser: null,
    userData: null
};

// ==========================================
// INITIALIZE
// ==========================================
function init() {
    setupAuthListener();
    setupEventListeners();
    loadPublicCampaigns();
    loadAllCreators();
}

// ==========================================
// AUTH LISTENER
// ==========================================
function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            APP.currentUser = user;
            await loadUserData(user.uid);
        } else {
            APP.currentUser = null;
            APP.userData = null;
        }
        updateNavigation();
        updateHomePageAuth();
    });
}

// ==========================================
// USER DATA
// ==========================================
async function loadUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            APP.userData = userDoc.data();
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
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

    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('active');
        }
    });

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
// UPDATE UI
// ==========================================
function updateHomePageAuth() {
    const heroAuthButtons = document.getElementById('heroAuthButtons');
    if (!heroAuthButtons) return;

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

function updateNavigation() {
    const authNav = document.getElementById('authNav');
    if (!authNav) return;
    
    if (APP.currentUser && APP.userData) {
        authNav.innerHTML = `
            <button class="nav-link" data-page="dashboard" onclick="navigateTo('dashboard')">
                📊 Get Support
            </button>
            <div class="user-menu">
                <button class="user-menu-btn" onclick="toggleUserDropdown()">
                    <div class="user-avatar">${APP.userData.name.charAt(0).toUpperCase()}</div>
                    <span>${APP.userData.name}</span>
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

// ==========================================
// NAVIGATION
// ==========================================
window.navigateTo = function(page) {
    if (page === 'dashboard' && !APP.currentUser) {
        showToast('Please sign in first!', 'warning');
        openModal('loginModal');
        return;
    }

    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    document.getElementById('navLinks').classList.remove('active');

    if (page === 'dashboard' && APP.currentUser) {
        renderDashboard();
    } else if (page === 'donations') {
        loadPublicCampaigns();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.toggleMobileMenu = function() {
    document.getElementById('navLinks').classList.toggle('active');
}

window.toggleUserDropdown = function() {
    document.getElementById('userDropdown').classList.toggle('active');
}

// ==========================================
// AUTHENTICATION
// ==========================================
window.handleCreatePage = function() {
    if (APP.currentUser) {
        navigateTo('dashboard');
    } else {
        openModal('signupModal');
    }
}

window.handleSignup = async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    try {
        showToast('Creating account...', 'warning');
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp()
        });
        
        closeModal('signupModal');
        showToast(`Welcome, ${name}!`, 'success');
        e.target.reset();
        loadAllCreators();
        
    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showToast('Email already registered!', 'error');
        } else if (error.code === 'auth/weak-password') {
            showToast('Password must be at least 6 characters.', 'error');
        } else {
            showToast('Signup failed. Try again.', 'error');
        }
    }
}

window.handleLogin = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
        showToast('Signing in...', 'warning');
        
        await signInWithEmailAndPassword(auth, email, password);
        closeModal('loginModal');
        showToast('Welcome back!', 'success');
        e.target.reset();
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Invalid email or password!', 'error');
    }
}

window.handleLogout = async function() {
    try {
        await signOut(auth);
        showToast('Signed out!', 'success');
        navigateTo('home');
    } catch (error) {
        showToast('Error signing out', 'error');
    }
}

// ==========================================
// MODALS
// ==========================================
window.openModal = function(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

window.switchAuthModal = function(type) {
    if (type === 'signup') {
        closeModal('loginModal');
        setTimeout(() => openModal('signupModal'), 200);
    } else {
        closeModal('signupModal');
        setTimeout(() => openModal('loginModal'), 200);
    }
}

// ==========================================
// TOAST
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: '✓', error: '✗', warning: '⏳' };
    toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// DASHBOARD
// ==========================================
async function renderDashboard() {
    if (!APP.currentUser || !APP.userData) return;
    
    document.getElementById('profileSection').innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${APP.userData.name.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
                <h2>${APP.userData.name}</h2>
                <p>${APP.userData.email}</p>
            </div>
        </div>
        <div class="profile-stats">
            <div class="stat-item">
                <div class="stat-value" id="qrCountStat">0</div>
                <div class="stat-label">QR Codes</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="linksCountStat">0</div>
                <div class="stat-label">Links</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="campaignsCountStat">0</div>
                <div class="stat-label">Campaigns</div>
            </div>
        </div>
    `;

    await loadUserQRCodes();
    await loadUserLinks();
    await loadUserCampaigns();
}

// ==========================================
// QR CODES (Base64 - No Storage Needed)
// ==========================================
async function loadUserQRCodes() {
    const grid = document.getElementById('qrGrid');
    const empty = document.getElementById('qrEmptyState');
    const count = document.getElementById('qrCount');
    const countStat = document.getElementById('qrCountStat');

    try {
        const q = query(
            collection(db, 'users', APP.currentUser.uid, 'qrCodes'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const qrCodes = [];
        snapshot.forEach(doc => qrCodes.push({ id: doc.id, ...doc.data() }));

        if (count) count.textContent = qrCodes.length;
        if (countStat) countStat.textContent = qrCodes.length;

        if (qrCodes.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            grid.innerHTML = qrCodes.map(qr => `
                <div class="glass-card item-card">
                    <div class="item-card-image" onclick="previewImage('${qr.imageData}')">
                        <img src="${qr.imageData}" alt="${qr.name}">
                    </div>
                    <div class="item-card-title">${qr.name}</div>
                    <div class="item-card-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteUserQR('${qr.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading QR codes:', error);
        showToast('Error loading QR codes', 'error');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function compressImage(base64, maxWidth = 500) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = base64;
    });
}

async function handleFileUpload(files) {
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'qrCodes'));
    const remaining = 10 - snapshot.size;
    
    if (remaining <= 0) {
        showToast('Maximum 10 QR codes allowed!', 'warning');
        return;
    }

    for (const file of Array.from(files).slice(0, remaining)) {
        if (!file.type.startsWith('image/')) {
            showToast(`${file.name} is not an image!`, 'error');
            continue;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast(`${file.name} is too large! Max 2MB.`, 'error');
            continue;
        }

        try {
            showToast('Uploading...', 'warning');
            
            const base64 = await fileToBase64(file);
            const compressedImage = await compressImage(base64);
            
            await addDoc(collection(db, 'users', APP.currentUser.uid, 'qrCodes'), {
                name: file.name,
                imageData: compressedImage,
                createdAt: serverTimestamp()
            });
            
            showToast('QR code uploaded!', 'success');
            
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload failed', 'error');
        }
    }
    
    loadUserQRCodes();
    loadAllCreators();
}

window.deleteUserQR = async function(docId) {
    if (!confirm('Delete this QR code?')) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'qrCodes', docId));
        showToast('QR code deleted!', 'success');
        loadUserQRCodes();
        loadAllCreators();
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Delete failed', 'error');
    }
}

// ==========================================
// LINKS
// ==========================================
async function loadUserLinks() {
    const list = document.getElementById('linksList');
    const empty = document.getElementById('linksEmptyState');
    const count = document.getElementById('linksCount');
    const countStat = document.getElementById('linksCountStat');

    try {
        const q = query(
            collection(db, 'users', APP.currentUser.uid, 'links'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const links = [];
        snapshot.forEach(doc => links.push({ id: doc.id, ...doc.data() }));

        if (count) count.textContent = links.length;
        if (countStat) countStat.textContent = links.length;

        if (links.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            list.innerHTML = links.map(link => `
                <div class="glass-card link-item">
                    <div class="link-icon">${link.icon || '🔗'}</div>
                    <div class="link-info">
                        <h4>${link.title}</h4>
                        <a href="${link.url}" target="_blank">${link.url}</a>
                    </div>
                    <div class="link-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteUserLink('${link.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading links:', error);
    }
}

window.handleAddLink = async function(e) {
    e.preventDefault();
    
    if (!APP.currentUser) return;
    
    const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'links'));
    if (snapshot.size >= 10) {
        showToast('Maximum 10 links allowed!', 'warning');
        return;
    }

    try {
        showToast('Adding link...', 'warning');
        
        await addDoc(collection(db, 'users', APP.currentUser.uid, 'links'), {
            title: document.getElementById('linkTitle').value.trim(),
            url: document.getElementById('linkUrl').value.trim(),
            icon: document.getElementById('linkIcon').value.trim() || '🔗',
            createdAt: serverTimestamp()
        });

        closeModal('addLinkModal');
        showToast('Link added!', 'success');
        e.target.reset();
        document.getElementById('linkIcon').value = '🔗';
        loadUserLinks();
        loadAllCreators();
        
    } catch (error) {
        console.error('Error adding link:', error);
        showToast('Failed to add link', 'error');
    }
}

window.deleteUserLink = async function(docId) {
    if (!confirm('Delete this link?')) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'links', docId));
        showToast('Link deleted!', 'success');
        loadUserLinks();
        loadAllCreators();
    } catch (error) {
        showToast('Delete failed', 'error');
    }
}

// ==========================================
// CAMPAIGNS
// ==========================================
async function loadUserCampaigns() {
    const grid = document.getElementById('campaignsGrid');
    const empty = document.getElementById('campaignsEmptyState');
    const count = document.getElementById('campaignsCount');
    const countStat = document.getElementById('campaignsCountStat');

    try {
        const q = query(
            collection(db, 'users', APP.currentUser.uid, 'campaigns'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const campaigns = [];
        snapshot.forEach(doc => campaigns.push({ id: doc.id, ...doc.data() }));

        if (count) count.textContent = campaigns.length;
        if (countStat) countStat.textContent = campaigns.length;

        if (campaigns.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            grid.innerHTML = campaigns.map(c => `
                <div class="glass-card campaign-card">
                    <div class="campaign-image">${getPlatformIcon(c.platform)}</div>
                    <h3 class="campaign-title">${c.title}</h3>
                    <p class="campaign-description">${c.description}</p>
                    <div class="campaign-footer">
                        <span class="campaign-platform">${c.platform}</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Visit →</a>
                            <button class="btn btn-danger btn-sm" onclick="deleteUserCampaign('${c.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

window.handleAddCampaign = async function(e) {
    e.preventDefault();
    
    if (!APP.currentUser) return;

    try {
        showToast('Adding campaign...', 'warning');
        
        await addDoc(collection(db, 'users', APP.currentUser.uid, 'campaigns'), {
            title: document.getElementById('campaignTitle').value.trim(),
            url: document.getElementById('campaignUrl').value.trim(),
            platform: document.getElementById('campaignPlatform').value,
            description: document.getElementById('campaignDescription').value.trim(),
            createdAt: serverTimestamp()
        });

        closeModal('addCampaignModal');
        showToast('Campaign added!', 'success');
        e.target.reset();
        loadUserCampaigns();
        loadPublicCampaigns();
        loadAllCreators();
        
    } catch (error) {
        console.error('Error adding campaign:', error);
        showToast('Failed to add campaign', 'error');
    }
}

window.deleteUserCampaign = async function(docId) {
    if (!confirm('Delete this campaign?')) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'campaigns', docId));
        showToast('Campaign deleted!', 'success');
        loadUserCampaigns();
        loadPublicCampaigns();
        loadAllCreators();
    } catch (error) {
        showToast('Delete failed', 'error');
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
// PUBLIC CAMPAIGNS
// ==========================================
async function loadPublicCampaigns() {
    const grid = document.getElementById('publicCampaignsGrid');
    const empty = document.getElementById('publicCampaignsEmpty');

    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allCampaigns = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const campaignsSnapshot = await getDocs(
                collection(db, 'users', userDoc.id, 'campaigns')
            );
            
            campaignsSnapshot.forEach(doc => {
                allCampaigns.push({
                    ...doc.data(),
                    creator: userData.name || 'Anonymous'
                });
            });
        }

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
    } catch (error) {
        console.error('Error loading public campaigns:', error);
    }
}

// ==========================================
// TAB SWITCHING
// ==========================================
window.switchDashboardTab = function(tab) {
    document.querySelectorAll('#dashboardTabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#page-dashboard .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tab);
    });
}

// ==========================================
// IMAGE PREVIEW
// ==========================================
window.previewImage = function(src) {
    document.getElementById('previewImage').src = src;
    openModal('imagePreviewModal');
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
let searchTimeout = null;
let allCreators = [];

async function loadAllCreators() {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        allCreators = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            const qrSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'qrCodes'));
            const linksSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'links'));
            const campaignsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'campaigns'));
            
            allCreators.push({
                id: userDoc.id,
                name: userData.name || 'Anonymous',
                email: userData.email || '',
                qrCount: qrSnapshot.size,
                linksCount: linksSnapshot.size,
                campaignsCount: campaignsSnapshot.size
            });
        }
    } catch (error) {
        console.error('Error loading creators:', error);
    }
}

window.handleSearch = function(searchTerm) {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        performSearch(searchTerm.trim().toLowerCase());
    }, 300);
}

async function performSearch(searchTerm) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchTerm) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    if (allCreators.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results"><div class="icon">⏳</div><p>Searching...</p></div>';
        await loadAllCreators();
    }
    
    const results = allCreators.filter(creator => 
        creator.name.toLowerCase().includes(searchTerm) ||
        creator.email.toLowerCase().includes(searchTerm)
    );
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="icon">🔍</div>
                <p>No creators found for "${searchTerm}"</p>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = results.map(creator => `
            <div class="creator-card" onclick="openCreatorProfile('${creator.id}')">
                <div class="creator-header">
                    <div class="creator-avatar">${creator.name.charAt(0).toUpperCase()}</div>
                    <div class="creator-info">
                        <h3>${creator.name}</h3>
                        <div class="creator-stats">
                            <span class="creator-stat">📱 <span class="count">${creator.qrCount}</span> QR</span>
                            <span class="creator-stat">🔗 <span class="count">${creator.linksCount}</span> Links</span>
                            <span class="creator-stat">🚀 <span class="count">${creator.campaignsCount}</span> Campaigns</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

window.openCreatorProfile = async function(creatorId) {
    try {
        const creatorDoc = await getDoc(doc(db, 'users', creatorId));
        if (!creatorDoc.exists()) {
            showToast('Creator not found', 'error');
            return;
        }
        
        const creatorData = creatorDoc.data();
        
        document.getElementById('creatorProfileAvatar').textContent = creatorData.name.charAt(0).toUpperCase();
        document.getElementById('creatorProfileName').textContent = creatorData.name;
        document.getElementById('creatorProfileEmail').textContent = creatorData.email;
        
        const qrSnapshot = await getDocs(
            query(collection(db, 'users', creatorId, 'qrCodes'), orderBy('createdAt', 'desc'))
        );
        const qrCodes = [];
        qrSnapshot.forEach(doc => qrCodes.push({ id: doc.id, ...doc.data() }));
        
        const linksSnapshot = await getDocs(
            query(collection(db, 'users', creatorId, 'links'), orderBy('createdAt', 'desc'))
        );
        const links = [];
        linksSnapshot.forEach(doc => links.push({ id: doc.id, ...doc.data() }));
        
        const campaignsSnapshot = await getDocs(
            query(collection(db, 'users', creatorId, 'campaigns'), orderBy('createdAt', 'desc'))
        );
        const campaigns = [];
        campaignsSnapshot.forEach(doc => campaigns.push({ id: doc.id, ...doc.data() }));
        
        let contentHTML = '';
        
        contentHTML += `
            <div class="creator-section">
                <h4>📱 QR Codes (${qrCodes.length})</h4>
                ${qrCodes.length > 0 ? `
                    <div class="creator-qr-grid">
                        ${qrCodes.map(qr => `
                            <div class="creator-qr-item" onclick="previewImage('${qr.imageData}')">
                                <img src="${qr.imageData}" alt="${qr.name}">
                                <p>${qr.name}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-section">No QR codes added yet</div>'}
            </div>
        `;
        
        contentHTML += `
            <div class="creator-section">
                <h4>🔗 Support Links (${links.length})</h4>
                ${links.length > 0 ? `
                    <div class="creator-links-list">
                        ${links.map(link => `
                            <a href="${link.url}" target="_blank" rel="noopener" class="creator-link-item">
                                <span class="creator-link-icon">${link.icon || '🔗'}</span>
                                <div class="creator-link-info">
                                    <h5>${link.title}</h5>
                                    <span>${link.url}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                ` : '<div class="empty-section">No support links added yet</div>'}
            </div>
        `;
        
        contentHTML += `
            <div class="creator-section">
                <h4>🚀 Campaigns (${campaigns.length})</h4>
                ${campaigns.length > 0 ? `
                    <div class="creator-campaigns-list">
                        ${campaigns.map(c => `
                            <div class="creator-campaign-item">
                                <h5>${getPlatformIcon(c.platform)} ${c.title}</h5>
                                <p>${c.description}</p>
                                <a href="${c.url}" target="_blank" rel="noopener">Support this campaign →</a>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-section">No campaigns added yet</div>'}
            </div>
        `;
        
        document.getElementById('creatorProfileContent').innerHTML = contentHTML;
        
        openModal('creatorProfileModal');
        
    } catch (error) {
        console.error('Error loading creator profile:', error);
        showToast('Error loading profile', 'error');
    }
}

// ==========================================
// START APP
// ==========================================
document.addEventListener('DOMContentLoaded', init);
