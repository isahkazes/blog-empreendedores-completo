let currentUser = null;

// Initialize
loadSettings();
loadPosts();

function loadSettings() {
    fetch('/api/settings')
        .then(r => r.json())
        .then(s => {
            document.title = s.site_title || 'Blog';
            document.getElementById('site-title').textContent = s.site_title;
            document.getElementById('hero-title').textContent = s.home_hero_title;
        });
}

function loadPosts() {
    fetch('/api/posts')
        .then(r => r.json())
        .then(data => {
            const html = data.posts.map(p => `
                <div class="card post-card mb-4">
                    <div class="card-body">
                        <h5>${p.title}</h5>
                        <p>${p.excerpt || p.content.substring(0, 150)}...</p>
                        <button class="btn btn-primary btn-sm" onclick="loadPost('${p.slug}')">Read More</button>
                    </div>
                </div>
            `).join('');
            document.getElementById('posts-list').innerHTML = html;
        });
}

function loadPost(slug) {
    fetch(`/api/posts/${slug}`)
        .then(r => r.json())
        .then(post => {
            document.getElementById('post-content').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h1>${post.title}</h1>
                        <small class="text-muted">By ${post.author}</small>
                        <div class="mt-4">${post.content}</div>
                    </div>
                </div>
            `;
            document.getElementById('posts-list').style.display = 'none';
            document.getElementById('single-post').style.display = 'block';
        });
}

function showPosts() {
    document.getElementById('single-post').style.display = 'none';
    document.getElementById('posts-list').style.display = 'block';
}

function showLogin() {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(result => {
        if (result.user) {
            currentUser = result.user;
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAdmin();
        } else {
            alert(result.error);
        }
    });
});

function showAdmin() {
    document.getElementById('blog-content').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    showSection('posts');
}

function showSection(section) {
    document.querySelectorAll('.list-group-item').forEach(i => i.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('admin-content');
    if (section === 'posts') {
        content.innerHTML = `
            <div class="d-flex justify-content-between mb-4">
                <h3>Posts</h3>
                <button class="btn btn-primary" onclick="showPostEditor()">New Post</button>
            </div>
            <div id="posts-admin"></div>
        `;
        loadAdminPosts();
    } else if (section === 'settings') {
        loadSettingsForm();
    }
}

function loadAdminPosts() {
    fetch('/api/posts?status=all&limit=50')
        .then(r => r.json())
        .then(data => {
            const html = `<div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Title</th><th>Status</th><th>Created</th></tr></thead>
                    <tbody>
                        ${data.posts.map(p => `<tr><td>${p.title}</td><td>${p.status}</td><td>${new Date(p.created_at).toDateString()}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
            document.getElementById('posts-admin').innerHTML = html;
        });
}

function showPostEditor() {
    document.getElementById('admin-content').innerHTML = `
        <form id="postForm">
            <div class="mb-3">
                <label>Title</label>
                <input type="text" name="title" class="form-control" required>
            </div>
            <div class="mb-3">
                <label>Content</label>
                <textarea name="content" class="form-control" rows="10" required></textarea>
            </div>
            <div class="mb-3">
                <label>Status</label>
                <select name="status" class="form-select">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Create Post</button>
        </form>
    `;
    
    document.getElementById('postForm').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        fetch('/api/posts', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(result => {
                alert(result.message);
                showSection('posts');
            });
    });
}

function loadSettingsForm() {
    fetch('/api/settings')
        .then(r => r.json())
        .then(settings => {
            document.getElementById('admin-content').innerHTML = `
                <form id="settingsForm">
                    <div class="mb-3">
                        <label>Site Title</label>
                        <input type="text" name="site_title" class="form-control" value="${settings.site_title || ''}">
                    </div>
                    <div class="mb-3">
                        <label>Site Description</label>
                        <textarea name="site_description" class="form-control">${settings.site_description || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label>Hero Title</label>
                        <input type="text" name="home_hero_title" class="form-control" value="${settings.home_hero_title || ''}">
                    </div>
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                </form>
            `;
            
            document.getElementById('settingsForm').addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const settings = {};
                for (let [k, v] of formData.entries()) settings[k] = v;
                
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                })
                .then(r => r.json())
                .then(result => {
                    alert(result.message);
                    loadSettings();
                });
            });
        });
}

function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            currentUser = null;
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('blog-content').style.display = 'block';
        });
}