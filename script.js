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
    console.log('App initializing...');
    setupAuthListener();
    setupEventListeners();
    loadPublicCampaigns();
    loadAllCreators();
    console.log('App initialized successfully');
}

// ==========================================
// AUTH LISTENER
// ==========================================
function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User logged in:', user.email);
            APP.currentUser = user;
            await loadUserData(user.uid);
        } else {
            console.log('User logged out');
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
            console.log('User data loaded:', APP.userData.name);
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Setup QR Upload listeners
    setupQRUploadListeners();

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
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
    
    console.log('Event listeners set up complete');
}

// ==========================================
// QR UPLOAD EVENT LISTENERS (FIXED)
// ==========================================
function setupQRUploadListeners() {
    const qrUploadArea = document.getElementById('qrUploadArea');
    const qrFileInput = document.getElementById('qrFileInput');
    
    if (!qrUploadArea) {
        console.warn('QR Upload area not found - will retry when dashboard loads');
        return;
    }
    
    if (!qrFileInput) {
        console.warn('QR File input not found');
        return;
    }
    
    console.log('Setting up QR upload listeners...');
    
    // Remove any existing listeners by cloning
    const newUploadArea = qrUploadArea.cloneNode(true);
    qrUploadArea.parentNode.replaceChild(newUploadArea, qrUploadArea);
    
    const newFileInput = document.getElementById('qrFileInput');
    
    // Click to open file picker
    newUploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upload area clicked');
        
        if (!APP.currentUser) {
            showToast('Please sign in first!', 'error');
            return;
        }
        
        newFileInput.click();
    });
    
    // Drag over effect
    newUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        newUploadArea.classList.add('dragover');
    });
    
    // Drag leave effect
    newUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        newUploadArea.classList.remove('dragover');
    });
    
    // Drop files
    newUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        newUploadArea.classList.remove('dragover');
        
        console.log('Files dropped');
        
        if (!APP.currentUser) {
            showToast('Please sign in first!', 'error');
            return;
        }
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            console.log('Dropped files count:', files.length);
            handleQRFileUpload(files);
        }
    });
    
    // File input change
    newFileInput.addEventListener('change', (e) => {
        console.log('File input changed');
        
        const files = e.target.files;
        if (files && files.length > 0) {
            console.log('Selected files count:', files.length);
            handleQRFileUpload(files);
        }
        
        // Reset input so same file can be selected again
        e.target.value = '';
    });
    
    console.log('QR upload listeners attached successfully');
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
    console.log('Navigating to:', page);
    
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

    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('active');

    if (page === 'dashboard' && APP.currentUser) {
        renderDashboard();
        // Re-setup QR upload listeners after dashboard renders
        setTimeout(() => {
            setupQRUploadListeners();
        }, 100);
    } else if (page === 'donations') {
        loadPublicCampaigns();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.toggleMobileMenu = function() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.toggle('active');
}

window.toggleUserDropdown = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('active');
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
        showToast(`Welcome, ${name}!`, 'success');
        e.target.reset();
        
        // Refresh creators list
        loadAllCreators();
        
    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showToast('Email already registered!', 'error');
        } else if (error.code === 'auth/weak-password') {
            showToast('Password must be at least 6 characters.', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showToast('Invalid email address.', 'error');
        } else {
            showToast('Signup failed. Try again.', 'error');
        }
    }
}

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
        console.error('Logout error:', error);
        showToast('Error signing out', 'error');
    }
}

// ==========================================
// MODALS
// ==========================================
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
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
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.log('Toast:', type, message);
        return;
    }
    
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
    if (!APP.currentUser || !APP.userData) {
        console.warn('Cannot render dashboard - user not loaded');
        return;
    }
    
    console.log('Rendering dashboard...');
    
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

    await loadUserQRCodes();
    await loadUserLinks();
    await loadUserCampaigns();
    
    console.log('Dashboard rendered');
}

// ==========================================
// QR CODES - COMPLETE FIXED VERSION
// ==========================================

// Load user's QR codes
async function loadUserQRCodes() {
    const grid = document.getElementById('qrGrid');
    const empty = document.getElementById('qrEmptyState');
    const count = document.getElementById('qrCount');
    const countStat = document.getElementById('qrCountStat');

    if (!APP.currentUser) {
        console.warn('Cannot load QR codes - not logged in');
        return;
    }

    console.log('Loading QR codes...');

    try {
        const qrCodesRef = collection(db, 'users', APP.currentUser.uid, 'qrCodes');
        const snapshot = await getDocs(qrCodesRef);
        
        const qrCodes = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            qrCodes.push({ 
                id: docSnap.id, 
                name: data.name || 'QR Code',
                imageData: data.imageData || '',
                createdAt: data.createdAt
            });
        });
        
        // Sort by createdAt (newest first)
        qrCodes.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        console.log('Loaded QR codes:', qrCodes.length);

        // Update counts
        if (count) count.textContent = qrCodes.length;
        if (countStat) countStat.textContent = qrCodes.length;

        // Render grid
        if (qrCodes.length === 0) {
            if (grid) grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            if (grid) {
                grid.innerHTML = qrCodes.map(qr => {
                    // Escape the imageData for safe onclick
                    const safeImageData = qr.imageData.replace(/'/g, "\\'");
                    return `
                        <div class="glass-card item-card">
                            <div class="item-card-image" onclick="previewImage('${safeImageData}')">
                                <img src="${qr.imageData}" alt="${qr.name}" onerror="this.style.display='none'">
                            </div>
                            <div class="item-card-title">${qr.name}</div>
                            <div class="item-card-actions">
                                <button class="btn btn-danger btn-sm" onclick="deleteUserQR('${qr.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading QR codes:', error);
        showToast('Error loading QR codes', 'error');
    }
}

// Convert file to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            console.log('File converted to Base64');
            resolve(reader.result);
        };
        
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Compress image to reduce size
function compressImage(base64, maxWidth = 400, quality = 0.5) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if too large
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                // Also limit height
                const maxHeight = 400;
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                console.log('Compression done. Size reduced from', 
                    Math.round(base64.length / 1024), 'KB to', 
                    Math.round(compressedBase64.length / 1024), 'KB');
                
                resolve(compressedBase64);
            } catch (error) {
                console.error('Canvas error:', error);
                reject(new Error('Failed to compress image'));
            }
        };
        
        img.onerror = () => {
            console.error('Failed to load image for compression');
            reject(new Error('Failed to load image'));
        };
        
        img.src = base64;
    });
}

// Main upload handler
async function handleQRFileUpload(files) {
    console.log('=== QR Upload Started ===');
    console.log('Files to process:', files.length);
    
    // Check if user is logged in
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    // Check if files exist
    if (!files || files.length === 0) {
        showToast('No files selected', 'error');
        return;
    }
    
    try {
        // Check current count
        const qrCodesRef = collection(db, 'users', APP.currentUser.uid, 'qrCodes');
        const snapshot = await getDocs(qrCodesRef);
        const currentCount = snapshot.size;
        const remaining = 10 - currentCount;
        
        console.log('Current QR count:', currentCount);
        console.log('Remaining slots:', remaining);
        
        if (remaining <= 0) {
            showToast('Maximum 10 QR codes allowed!', 'warning');
            return;
        }

        // Process files
        const filesToProcess = Array.from(files).slice(0, remaining);
        let successCount = 0;
        
        for (let i = 0; i < filesToProcess.length; i++) {
            const file = filesToProcess[i];
            console.log(`Processing file ${i + 1}/${filesToProcess.length}:`, file.name);
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} is not an image!`, 'error');
                continue;
            }

            // Validate file size (max 5MB before compression)
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name} is too large! Max 5MB.`, 'error');
                continue;
            }

            try {
                showToast(`Uploading ${file.name}...`, 'warning');
                
                // Step 1: Convert to Base64
                console.log('Step 1: Converting to Base64...');
                const base64 = await fileToBase64(file);
                console.log('Base64 size:', Math.round(base64.length / 1024), 'KB');
                
                // Step 2: Compress image
                console.log('Step 2: Compressing...');
                let compressedImage = await compressImage(base64, 400, 0.5);
                
                // Step 3: Check if still too large, compress more
                if (compressedImage.length > 800000) {
                    console.log('Still large, compressing more...');
                    compressedImage = await compressImage(base64, 300, 0.3);
                }
                
                // Step 4: Final size check
                if (compressedImage.length > 900000) {
                    showToast(`${file.name} is too large even after compression`, 'error');
                    continue;
                }
                
                // Step 5: Save to Firestore
                console.log('Step 3: Saving to Firestore...');
                const docRef = await addDoc(qrCodesRef, {
                    name: file.name,
                    imageData: compressedImage,
                    createdAt: serverTimestamp()
                });
                
                console.log('Saved with ID:', docRef.id);
                successCount++;
                
            } catch (error) {
                console.error('Error processing file:', file.name, error);
                showToast(`Failed to upload ${file.name}`, 'error');
            }
        }
        
        // Show success message
        if (successCount > 0) {
            showToast(`${successCount} QR code(s) uploaded!`, 'success');
        }
        
        // Reload QR codes
        console.log('Reloading QR codes...');
        await loadUserQRCodes();
        
        // Refresh creators list
        loadAllCreators();
        
        console.log('=== QR Upload Complete ===');
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed. Please try again.', 'error');
    }
}

// Delete QR code
window.deleteUserQR = async function(docId) {
    if (!confirm('Delete this QR code?')) return;
    
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    try {
        console.log('Deleting QR code:', docId);
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'qrCodes', docId));
        showToast('QR code deleted!', 'success');
        await loadUserQRCodes();
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

    if (!APP.currentUser) return;

    try {
        const linksRef = collection(db, 'users', APP.currentUser.uid, 'links');
        const snapshot = await getDocs(linksRef);
        
        const links = [];
        snapshot.forEach(docSnap => {
            links.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Sort by createdAt
        links.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        if (count) count.textContent = links.length;
        if (countStat) countStat.textContent = links.length;

        if (links.length === 0) {
            if (list) list.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            if (list) {
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
        }
    } catch (error) {
        console.error('Error loading links:', error);
    }
}

window.handleAddLink = async function(e) {
    e.preventDefault();
    
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const titleInput = document.getElementById('linkTitle');
    const urlInput = document.getElementById('linkUrl');
    const iconInput = document.getElementById('linkIcon');
    
    if (!titleInput || !urlInput) return;
    
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const icon = iconInput ? iconInput.value.trim() || '🔗' : '🔗';
    
    if (!title || !url) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    try {
        const linksRef = collection(db, 'users', APP.currentUser.uid, 'links');
        const snapshot = await getDocs(linksRef);
        
        if (snapshot.size >= 10) {
            showToast('Maximum 10 links allowed!', 'warning');
            return;
        }

        showToast('Adding link...', 'warning');
        
        await addDoc(linksRef, {
            title: title,
            url: url,
            icon: icon,
            createdAt: serverTimestamp()
        });

        closeModal('addLinkModal');
        showToast('Link added!', 'success');
        e.target.reset();
        if (iconInput) iconInput.value = '🔗';
        await loadUserLinks();
        loadAllCreators();
        
    } catch (error) {
        console.error('Error adding link:', error);
        showToast('Failed to add link', 'error');
    }
}

window.deleteUserLink = async function(docId) {
    if (!confirm('Delete this link?')) return;
    
    if (!APP.currentUser) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'links', docId));
        showToast('Link deleted!', 'success');
        await loadUserLinks();
        loadAllCreators();
    } catch (error) {
        console.error('Delete error:', error);
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

    if (!APP.currentUser) return;

    try {
        const campaignsRef = collection(db, 'users', APP.currentUser.uid, 'campaigns');
        const snapshot = await getDocs(campaignsRef);
        
        const campaigns = [];
        snapshot.forEach(docSnap => {
            campaigns.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Sort by createdAt
        campaigns.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        if (count) count.textContent = campaigns.length;
        if (countStat) countStat.textContent = campaigns.length;

        if (campaigns.length === 0) {
            if (grid) grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            if (grid) {
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
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

window.handleAddCampaign = async function(e) {
    e.preventDefault();
    
    if (!APP.currentUser) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const titleInput = document.getElementById('campaignTitle');
    const urlInput = document.getElementById('campaignUrl');
    const platformInput = document.getElementById('campaignPlatform');
    const descInput = document.getElementById('campaignDescription');
    
    if (!titleInput || !urlInput || !platformInput || !descInput) return;
    
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const platform = platformInput.value;
    const description = descInput.value.trim();
    
    if (!title || !url || !platform || !description) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        showToast('Adding campaign...', 'warning');
        
        const campaignsRef = collection(db, 'users', APP.currentUser.uid, 'campaigns');
        
        await addDoc(campaignsRef, {
            title: title,
            url: url,
            platform: platform,
            description: description,
            createdAt: serverTimestamp()
        });

        closeModal('addCampaignModal');
        showToast('Campaign added!', 'success');
        e.target.reset();
        await loadUserCampaigns();
        loadPublicCampaigns();
        loadAllCreators();
        
    } catch (error) {
        console.error('Error adding campaign:', error);
        showToast('Failed to add campaign', 'error');
    }
}

window.deleteUserCampaign = async function(docId) {
    if (!confirm('Delete this campaign?')) return;
    
    if (!APP.currentUser) return;
    
    try {
        await deleteDoc(doc(db, 'users', APP.currentUser.uid, 'campaigns', docId));
        showToast('Campaign deleted!', 'success');
        await loadUserCampaigns();
        loadPublicCampaigns();
        loadAllCreators();
    } catch (error) {
        console.error('Delete error:', error);
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

    if (!grid) return;

    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allCampaigns = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            try {
                const campaignsSnapshot = await getDocs(
                    collection(db, 'users', userDoc.id, 'campaigns')
                );
                
                campaignsSnapshot.forEach(docSnap => {
                    allCampaigns.push({
                        ...docSnap.data(),
                        creator: userData.name || 'Anonymous'
                    });
                });
            } catch (err) {
                // Skip if can't read campaigns
            }
        }

        if (allCampaigns.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
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
    
    // Re-setup QR listeners when switching to QR tab
    if (tab === 'qr-codes') {
        setTimeout(() => {
            setupQRUploadListeners();
        }, 100);
    }
}

// ==========================================
// IMAGE PREVIEW
// ==========================================
window.previewImage = function(src) {
    const previewImg = document.getElementById('previewImage');
    if (previewImg && src) {
        previewImg.src = src;
        openModal('imagePreviewModal');
    }
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
let searchTimeout = null;
let allCreators = [];

// Load all creators for search
async function loadAllCreators() {
    try {
        console.log('Loading all creators...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        allCreators = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            let qrCount = 0;
            let linksCount = 0;
            let campaignsCount = 0;
            
            try {
                const qrSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'qrCodes'));
                qrCount = qrSnapshot.size;
            } catch (e) {}
            
            try {
                const linksSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'links'));
                linksCount = linksSnapshot.size;
            } catch (e) {}
            
            try {
                const campaignsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'campaigns'));
                campaignsCount = campaignsSnapshot.size;
            } catch (e) {}
            
            allCreators.push({
                id: userDoc.id,
                name: userData.name || 'Anonymous',
                email: userData.email || '',
                qrCount: qrCount,
                linksCount: linksCount,
                campaignsCount: campaignsCount
            });
        }
        
        console.log('Loaded creators:', allCreators.length);
    } catch (error) {
        console.error('Error loading creators:', error);
    }
}

// Search handler
window.handleSearch = function(searchTerm) {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        await performSearch(searchTerm.trim().toLowerCase());
    }, 300);
}

// Perform search
async function performSearch(searchTerm) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    if (!searchTerm) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Load creators if not loaded
    if (allCreators.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results"><div class="icon">⏳</div><p>Searching...</p></div>';
        await loadAllCreators();
    }
    
    // Filter creators
    const results = allCreators.filter(creator => 
        creator.name.toLowerCase().includes(searchTerm) ||
        creator.email.toLowerCase().includes(searchTerm)
    );
    
    // Display results
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

// Open creator profile
window.openCreatorProfile = async function(creatorId) {
    const profileContent = document.getElementById('creatorProfileContent');
    const profileAvatar = document.getElementById('creatorProfileAvatar');
    const profileName = document.getElementById('creatorProfileName');
    const profileEmail = document.getElementById('creatorProfileEmail');
    
    if (!profileContent) {
        showToast('Profile modal not found', 'error');
        return;
    }
    
    // Show loading
    profileContent.innerHTML = '<div class="empty-section">Loading profile...</div>';
    openModal('creatorProfileModal');
    
    try {
        // Get creator data
        const creatorDoc = await getDoc(doc(db, 'users', creatorId));
        
        if (!creatorDoc.exists()) {
            profileContent.innerHTML = '<div class="empty-section">Creator not found</div>';
            return;
        }
        
        const creatorData = creatorDoc.data();
        
        // Update header
        if (profileAvatar) profileAvatar.textContent = (creatorData.name || 'A').charAt(0).toUpperCase();
        if (profileName) profileName.textContent = creatorData.name || 'Anonymous';
        if (profileEmail) profileEmail.textContent = creatorData.email || '';
        
        // Load data
        let qrCodes = [];
        let links = [];
        let campaigns = [];
        
        try {
            const qrSnapshot = await getDocs(collection(db, 'users', creatorId, 'qrCodes'));
            qrSnapshot.forEach(docSnap => qrCodes.push({ id: docSnap.id, ...docSnap.data() }));
        } catch (e) {}
        
        try {
            const linksSnapshot = await getDocs(collection(db, 'users', creatorId, 'links'));
            linksSnapshot.forEach(docSnap => links.push({ id: docSnap.id, ...docSnap.data() }));
        } catch (e) {}
        
        try {
            const campaignsSnapshot = await getDocs(collection(db, 'users', creatorId, 'campaigns'));
            campaignsSnapshot.forEach(docSnap => campaigns.push({ id: docSnap.id, ...docSnap.data() }));
        } catch (e) {}
        
        // Build content
        let contentHTML = '';
        
        // QR Codes
        contentHTML += `
            <div class="creator-section">
                <h4>📱 QR Codes (${qrCodes.length})</h4>
                ${qrCodes.length > 0 ? `
                    <div class="creator-qr-grid">
                        ${qrCodes.map(qr => `
                            <div class="creator-qr-item" onclick="previewImage('${(qr.imageData || '').replace(/'/g, "\\'")}')">
                                <img src="${qr.imageData || ''}" alt="${qr.name || 'QR'}" onerror="this.style.display='none'">
                                <p>${qr.name || 'QR Code'}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-section">No QR codes added yet</div>'}
            </div>
        `;
        
        // Links
        contentHTML += `
            <div class="creator-section">
                <h4>🔗 Support Links (${links.length})</h4>
                ${links.length > 0 ? `
                    <div class="creator-links-list">
                        ${links.map(link => `
                            <a href="${link.url}" target="_blank" rel="noopener" class="creator-link-item">
                                <span class="creator-link-icon">${link.icon || '🔗'}</span>
                                <div class="creator-link-info">
                                    <h5>${link.title || 'Link'}</h5>
                                    <span>${link.url}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                ` : '<div class="empty-section">No support links added yet</div>'}
            </div>
        `;
        
        // Campaigns
        contentHTML += `
            <div class="creator-section">
                <h4>🚀 Campaigns (${campaigns.length})</h4>
                ${campaigns.length > 0 ? `
                    <div class="creator-campaigns-list">
                        ${campaigns.map(c => `
                            <div class="creator-campaign-item">
                                <h5>${getPlatformIcon(c.platform)} ${c.title || 'Campaign'}</h5>
                                <p>${c.description || ''}</p>
                                <a href="${c.url}" target="_blank" rel="noopener">Support this campaign →</a>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-section">No campaigns added yet</div>'}
            </div>
        `;
        
        profileContent.innerHTML = contentHTML;
        
    } catch (error) {
        console.error('Error loading creator profile:', error);
        profileContent.innerHTML = '<div class="empty-section">Error loading profile. Please try again.</div>';
    }
}

// ==========================================
// START APP
// ==========================================
document.addEventListener('DOMContentLoaded', init);
