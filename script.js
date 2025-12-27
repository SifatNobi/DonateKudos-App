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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// FIREBASE CONFIG
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
    userData: null,
    creatorsLoaded: false,
    creators: []
};

// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    setupAuthListener();
    setupGlobalListeners();
});

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
// LOAD USER DATA
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
// GLOBAL EVENT LISTENERS
// ==========================================
function setupGlobalListeners() {
    // Navbar scroll
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('active');
        }
    });

    // Close modals on overlay click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
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

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(function(p) {
        p.classList.remove('active');
    });
    
    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link[data-page]').forEach(function(link) {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Close mobile menu
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('active');

    // Load page content
    if (page === 'dashboard' && APP.currentUser) {
        renderDashboard();
    } else if (page === 'donations') {
        loadPublicCampaigns();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleMobileMenu = function() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.toggle('active');
};

window.toggleUserDropdown = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('active');
};

// ==========================================
// AUTHENTICATION
// ==========================================
window.handleCreatePage = function() {
    if (APP.currentUser) {
        navigateTo('dashboard');
    } else {
        openModal('signupModal');
    }
};

window.handleSignup = async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }

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
        showToast('Welcome, ' + name + '!', 'success');
        e.target.reset();
        APP.creatorsLoaded = false;
        
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showToast('Email already registered!', 'error');
        } else if (error.code === 'auth/weak-password') {
            showToast('Password must be at least 6 characters.', 'error');
        } else {
            showToast('Signup failed. Try again.', 'error');
        }
    }
};

window.handleLogin = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        showToast('Signing in...', 'warning');
        await signInWithEmailAndPassword(auth, email, password);
        closeModal('loginModal');
        showToast('Welcome back!', 'success');
        e.target.reset();
    } catch (error) {
        showToast('Invalid email or password!', 'error');
    }
};

window.handleLogout = async function() {
    try {
        await signOut(auth);
        showToast('Signed out!', 'success');
        navigateTo('home');
    } catch (error) {
        showToast('Error signing out', 'error');
    }
};

// ==========================================
// MODALS
// ==========================================
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.switchAuthModal = function(type) {
    if (type === 'signup') {
        closeModal('loginModal');
        setTimeout(function() { openModal('signupModal'); }, 200);
    } else {
        closeModal('signupModal');
        setTimeout(function() { openModal('loginModal'); }, 200);
    }
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icons = { success: '✓', error: '✗', warning: '⏳' };
    toast.innerHTML = '<span>' + (icons[type] || '•') + '</span><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ==========================================
// DASHBOARD
// ==========================================
async function renderDashboard() {
    if (!APP.currentUser || !APP.userData) return;
    
    const profileSection = document.getElementById('profileSection');
    if (profileSection) {
        profileSection.innerHTML = `
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
    }

    // Load data
    loadUserQRCodes();
    loadUserLinks();
    loadUserCampaigns();
}

// ==========================================
// QR UPLOAD - CLICK HANDLER (FIXED)
// ==========================================
window.triggerQRUpload = function() {
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const inputs = document.querySelectorAll('#qrFileInput');
    if (inputs && inputs.length > 0) {
        inputs[0].click();
    }
};

window.handleQRFileSelect = function(input) {
    if (input.files && input.files.length > 0) {
        uploadQRFiles(input.files);
    }
    input.value = '';
};

// ==========================================
// QR CODES - LOAD
// ==========================================
async function loadUserQRCodes() {
    if (!APP.currentUser) return;

    const grid = document.getElementById('qrGrid');
    const empty = document.getElementById('qrEmptyState');
    const count = document.getElementById('qrCount');
    const countStat = document.getElementById('qrCountStat');

    try {
        const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'qrCodes'));
        
        const qrCodes = [];
        snapshot.forEach(function(docSnap) {
            qrCodes.push({ 
                id: docSnap.id, 
                ...docSnap.data()
            });
        });

        // Update counts
        if (count) count.textContent = qrCodes.length;
        if (countStat) countStat.textContent = qrCodes.length;

        if (qrCodes.length === 0) {
            if (grid) grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            if (grid) {
                grid.innerHTML = qrCodes.map(function(qr) {
                    return `
                        <div class="glass-card item-card">
                            <div class="item-card-image" onclick="showQRPreview('${qr.id}')">
                                <img src="${qr.imageData}" alt="${qr.name || 'QR'}">
                            </div>
                            <div class="item-card-title">${qr.name || 'QR Code'}</div>
                            <div class="item-card-actions">
                                <button class="btn btn-danger btn-sm" onclick="deleteQR('${qr.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading QR codes:', error);
    }
}

// ==========================================
// QR CODES - UPLOAD (FIXED & OPTIMIZED)
// ==========================================
async function uploadQRFiles(files) {
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }

    // Check current count
    let currentCount = 0;
    try {
        const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'qrCodes'));
        currentCount = snapshot.size;
    } catch (e) {
        console.error('Error checking count:', e);
    }

    const remaining = 10 - currentCount;
    if (remaining <= 0) {
        showToast('Maximum 10 QR codes allowed!', 'warning');
        return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    let uploaded = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Validate
        if (!file.type.startsWith('image/')) {
            showToast(file.name + ' is not an image!', 'error');
            continue;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast(file.name + ' is too large! Max 5MB.', 'error');
            continue;
        }

        showToast('Uploading ' + file.name + '...', 'warning');

        try {
            // Read file
            const base64 = await readFileAsBase64(file);
            
            // Compress
            const compressed = await compressImageSimple(base64);
            
            // Save
            await addDoc(collection(db, 'users', APP.currentUser.uid, 'qrCodes'), {
                name: file.name,
                imageData: compressed,
                createdAt: serverTimestamp()
            });
            
            uploaded++;
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Failed to upload ' + file.name, 'error');
        }
    }

    if (uploaded > 0) {
        showToast(uploaded + ' QR code(s) uploaded!', 'success');
        loadUserQRCodes();
        APP.creatorsLoaded = false;
    }
}

// Read file as Base64
function readFileAsBase64(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function() { reject(new Error('Failed to read file')); };
        reader.readAsDataURL(file);
    });
}

// Simple image compression
function compressImageSimple(base64) {
    return new Promise(function(resolve, reject) {
        const img = new Image();
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 350;
            
            let width = img.width;
            let height = img.height;
            
            // Resize
            if (width > height && width > maxSize) {
                height = Math.round(height * maxSize / width);
                width = maxSize;
            } else if (height > maxSize) {
                width = Math.round(width * maxSize / height);
                height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress
            let result = canvas.toDataURL('image/jpeg', 0.6);
            
            // If still too large, compress more
            if (result.length > 500000) {
                result = canvas.toDataURL('image/jpeg', 0.4);
            }
            
            resolve(result);
        };
        
        img.onerror = function() { reject(new Error('Failed to load image')); };
        img.src = base64;
    });
}

// Show QR Preview
window.showQRPreview = async function(qrId) {
    if (!APP.currentUser) return;
    
    try {
        const qrDoc = await getDoc(doc(db, 'users', APP.currentUser.uid, 'qrCodes', qrId));
        if (qrDoc.exists()) {
            const data = qrDoc.data();
            const previewImg = document.getElementById('previewImage');
            if (previewImg) {
                previewImg.src = data.imageData;
                openModal('imagePreviewModal');
            }
        }
    } catch (error) {
        console.error('Preview error:', error);
    }
};

// Delete QR
window.deleteQR = async function(qrId) {
    if (!confirm('Delete this QR code?')) return;
    if (!APP.currentUser) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'qrCodes', qrId));
        showToast('QR code deleted!', 'success');
        loadUserQRCodes();
        APP.creatorsLoaded = false;
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Delete failed', 'error');
    }
};

// ==========================================
// LINKS
// ==========================================
async function loadUserLinks() {
    if (!APP.currentUser) return;

    const list = document.getElementById('linksList');
    const empty = document.getElementById('linksEmptyState');
    const count = document.getElementById('linksCount');
    const countStat = document.getElementById('linksCountStat');

    try {
        const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'links'));
        
        const links = [];
        snapshot.forEach(function(docSnap) {
            links.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (count) count.textContent = links.length;
        if (countStat) countStat.textContent = links.length;

        if (links.length === 0) {
            if (list) list.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            if (list) {
                list.innerHTML = links.map(function(link) {
                    return `
                        <div class="glass-card link-item">
                            <div class="link-icon">${link.icon || '🔗'}</div>
                            <div class="link-info">
                                <h4>${link.title}</h4>
                                <a href="${link.url}" target="_blank">${link.url}</a>
                            </div>
                            <div class="link-actions">
                                <button class="btn btn-danger btn-sm" onclick="deleteLink('${link.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading links:', error);
    }
}

window.handleAddLink = async function(e) {
    e.preventDefault();
    if (!APP.currentUser) return;
    
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const icon = document.getElementById('linkIcon').value.trim() || '🔗';
    
    if (!title || !url) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    // Check count
    const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'links'));
    if (snapshot.size >= 10) {
        showToast('Maximum 10 links allowed!', 'warning');
        return;
    }

    try {
        showToast('Adding link...', 'warning');
        
        await addDoc(collection(db, 'users', APP.currentUser.uid, 'links'), {
            title: title,
            url: url,
            icon: icon,
            createdAt: serverTimestamp()
        });

        closeModal('addLinkModal');
        showToast('Link added!', 'success');
        e.target.reset();
        document.getElementById('linkIcon').value = '🔗';
        loadUserLinks();
        APP.creatorsLoaded = false;
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add link', 'error');
    }
};

window.deleteLink = async function(linkId) {
    if (!confirm('Delete this link?')) return;
    if (!APP.currentUser) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'links', linkId));
        showToast('Link deleted!', 'success');
        loadUserLinks();
        APP.creatorsLoaded = false;
    } catch (error) {
        showToast('Delete failed', 'error');
    }
};

// ==========================================
// CAMPAIGNS
// ==========================================
async function loadUserCampaigns() {
    if (!APP.currentUser) return;

    const grid = document.getElementById('campaignsGrid');
    const empty = document.getElementById('campaignsEmptyState');
    const count = document.getElementById('campaignsCount');
    const countStat = document.getElementById('campaignsCountStat');

    try {
        const snapshot = await getDocs(collection(db, 'users', APP.currentUser.uid, 'campaigns'));
        
        const campaigns = [];
        snapshot.forEach(function(docSnap) {
            campaigns.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (count) count.textContent = campaigns.length;
        if (countStat) countStat.textContent = campaigns.length;

        if (campaigns.length === 0) {
            if (grid) grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            if (grid) {
                grid.innerHTML = campaigns.map(function(c) {
                    return `
                        <div class="glass-card campaign-card">
                            <div class="campaign-image">${getPlatformIcon(c.platform)}</div>
                            <h3 class="campaign-title">${c.title}</h3>
                            <p class="campaign-description">${c.description}</p>
                            <div class="campaign-footer">
                                <span class="campaign-platform">${c.platform}</span>
                                <div style="display: flex; gap: 0.5rem;">
                                    <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Visit →</a>
                                    <button class="btn btn-danger btn-sm" onclick="deleteCampaign('${c.id}')">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

window.handleAddCampaign = async function(e) {
    e.preventDefault();
    if (!APP.currentUser) return;
    
    const title = document.getElementById('campaignTitle').value.trim();
    const url = document.getElementById('campaignUrl').value.trim();
    const platform = document.getElementById('campaignPlatform').value;
    const description = document.getElementById('campaignDescription').value.trim();
    
    if (!title || !url || !platform || !description) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        showToast('Adding campaign...', 'warning');
        
        await addDoc(collection(db, 'users', APP.currentUser.uid, 'campaigns'), {
            title: title,
            url: url,
            platform: platform,
            description: description,
            createdAt: serverTimestamp()
        });

        closeModal('addCampaignModal');
        showToast('Campaign added!', 'success');
        e.target.reset();
        loadUserCampaigns();
        APP.creatorsLoaded = false;
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add campaign', 'error');
    }
};

window.deleteCampaign = async function(campaignId) {
    if (!confirm('Delete this campaign?')) return;
    if (!APP.currentUser) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'campaigns', campaignId));
        showToast('Campaign deleted!', 'success');
        loadUserCampaigns();
        loadPublicCampaigns();
        APP.creatorsLoaded = false;
    } catch (error) {
        showToast('Delete failed', 'error');
    }
};

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
    if (!grid) return;

    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allCampaigns = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            try {
                const campSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'campaigns'));
                campSnapshot.forEach(function(docSnap) {
                    allCampaigns.push({
                        ...docSnap.data(),
                        creator: userData.name || 'Anonymous'
                    });
                });
            } catch (e) {}
        }

        if (allCampaigns.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            grid.innerHTML = allCampaigns.map(function(c) {
                return `
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
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==========================================
// TAB SWITCHING
// ==========================================
window.switchDashboardTab = function(tab) {
    document.querySelectorAll('#dashboardTabs .tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#page-dashboard .tab-content').forEach(function(content) {
        content.classList.toggle('active', content.id === 'tab-' + tab);
    });
};

// ==========================================
// IMAGE PREVIEW
// ==========================================
window.previewImage = function(src) {
    const img = document.getElementById('previewImage');
    if (img && src) {
        img.src = src;
        openModal('imagePreviewModal');
    }
};

// ==========================================
// SEARCH (LAZY LOAD - OPTIMIZED)
// ==========================================
let searchTimeout = null;

window.handleSearch = function(term) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
        doSearch(term.trim().toLowerCase());
    }, 400);
};

async function doSearch(term) {
    const results = document.getElementById('searchResults');
    if (!results) return;
    
    if (!term) {
        results.innerHTML = '';
        return;
    }
    
    // Load creators if not loaded
    if (!APP.creatorsLoaded) {
        results.innerHTML = '<div class="search-no-results"><div class="icon">⏳</div><p>Loading...</p></div>';
        await loadCreators();
    }
    
    // Filter
    const matches = APP.creators.filter(function(c) {
        return c.name.toLowerCase().includes(term);
    });
    
    if (matches.length === 0) {
        results.innerHTML = '<div class="search-no-results"><div class="icon">🔍</div><p>No creators found</p></div>';
    } else {
        results.innerHTML = matches.map(function(c) {
            return `
                <div class="creator-card" onclick="viewCreator('${c.id}')">
                    <div class="creator-header">
                        <div class="creator-avatar">${c.name.charAt(0).toUpperCase()}</div>
                        <div class="creator-info">
                            <h3>${c.name}</h3>
                            <div class="creator-stats">
                                <span class="creator-stat">📱 ${c.qr}</span>
                                <span class="creator-stat">🔗 ${c.links}</span>
                                <span class="creator-stat">🚀 ${c.camps}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

async function loadCreators() {
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        APP.creators = [];
        
        for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            
            let qr = 0, links = 0, camps = 0;
            try { qr = (await getDocs(collection(db, 'users', userDoc.id, 'qrCodes'))).size; } catch(e) {}
            try { links = (await getDocs(collection(db, 'users', userDoc.id, 'links'))).size; } catch(e) {}
            try { camps = (await getDocs(collection(db, 'users', userDoc.id, 'campaigns'))).size; } catch(e) {}
            
            APP.creators.push({
                id: userDoc.id,
                name: data.name || 'Anonymous',
                qr: qr,
                links: links,
                camps: camps
            });
        }
        
        APP.creatorsLoaded = true;
    } catch (error) {
        console.error('Error:', error);
    }
}

window.viewCreator = async function(id) {
    const content = document.getElementById('creatorProfileContent');
    const avatar = document.getElementById('creatorProfileAvatar');
    const name = document.getElementById('creatorProfileName');
    const email = document.getElementById('creatorProfileEmail');
    
    if (!content) return;
    
    content.innerHTML = '<div class="empty-section">Loading...</div>';
    openModal('creatorProfileModal');
    
    try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (!userDoc.exists()) {
            content.innerHTML = '<div class="empty-section">Creator not found</div>';
            return;
        }
        
        const data = userDoc.data();
        if (avatar) avatar.textContent = (data.name || 'A').charAt(0).toUpperCase();
        if (name) name.textContent = data.name || 'Anonymous';
        if (email) email.textContent = data.email || '';
        
        // Load data
        let qrCodes = [], links = [], campaigns = [];
        
        try {
            const qrSnap = await getDocs(collection(db, 'users', id, 'qrCodes'));
            qrSnap.forEach(function(d) { qrCodes.push(d.data()); });
        } catch(e) {}
        
        try {
            const linksSnap = await getDocs(collection(db, 'users', id, 'links'));
            linksSnap.forEach(function(d) { links.push(d.data()); });
        } catch(e) {}
        
        try {
            const campSnap = await getDocs(collection(db, 'users', id, 'campaigns'));
            campSnap.forEach(function(d) { campaigns.push(d.data()); });
        } catch(e) {}
        
        // Build HTML
        let html = '';
        
        // QR Codes
        html += '<div class="creator-section"><h4>📱 QR Codes (' + qrCodes.length + ')</h4>';
        if (qrCodes.length > 0) {
            html += '<div class="creator-qr-grid">';
            qrCodes.forEach(function(qr) {
                html += '<div class="creator-qr-item"><img src="' + qr.imageData + '" alt="QR"><p>' + (qr.name || 'QR') + '</p></div>';
            });
            html += '</div>';
        } else {
            html += '<div class="empty-section">No QR codes</div>';
        }
        html += '</div>';
        
        // Links
        html += '<div class="creator-section"><h4>🔗 Links (' + links.length + ')</h4>';
        if (links.length > 0) {
            html += '<div class="creator-links-list">';
            links.forEach(function(link) {
                html += '<a href="' + link.url + '" target="_blank" class="creator-link-item"><span class="creator-link-icon">' + (link.icon || '🔗') + '</span><div class="creator-link-info"><h5>' + link.title + '</h5><span>' + link.url + '</span></div></a>';
            });
            html += '</div>';
        } else {
            html += '<div class="empty-section">No links</div>';
        }
        html += '</div>';
        
        // Campaigns
        html += '<div class="creator-section"><h4>🚀 Campaigns (' + campaigns.length + ')</h4>';
        if (campaigns.length > 0) {
            html += '<div class="creator-campaigns-list">';
            campaigns.forEach(function(c) {
                html += '<div class="creator-campaign-item"><h5>' + getPlatformIcon(c.platform) + ' ' + c.title + '</h5><p>' + c.description + '</p><a href="' + c.url + '" target="_blank">Support →</a></div>';
            });
            html += '</div>';
        } else {
            html += '<div class="empty-section">No campaigns</div>';
        }
        html += '</div>';
        
        content.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        content.innerHTML = '<div class="empty-section">Error loading profile</div>';
    }
};

