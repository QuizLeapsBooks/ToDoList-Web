import { getAuth, collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;
window.folders = [
  { id: 'all', name: 'All', userId: null },
  { id: 'uncategorized', name: 'Uncategorized', userId: null }
];

document.addEventListener('DOMContentLoaded', () => {
  console.log('folders.js loaded');
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadFolders(user.uid);
    }
  });

  // Folder Modal Controls
  document.getElementById('create-folder-btn').addEventListener('click', () => {
    console.log('Create folder button clicked');
    document.getElementById('create-folder-modal').classList.remove('hidden');
  });

  document.getElementById('cancel-folder').addEventListener('click', () => {
    document.getElementById('create-folder-modal').classList.add('hidden');
    document.getElementById('folder-name').value = '';
  });

  document.getElementById('save-folder').addEventListener('click', () => {
    const name = document.getElementById('folder-name').value.trim();
    const user = auth.currentUser;
    if (!name) {
      alert('Please enter a folder name!');
      return;
    }
    if (!user) {
      alert('You must be logged in to create a folder!');
      return;
    }
    if (window.folders.some(f => f.name.toLowerCase() === name.toLowerCase() && f.userId === user.uid)) {
      alert('Folder name already exists!');
      return;
    }
    addDoc(collection(db, 'folders'), {
      userId: user.uid,
      name,
      createdAt: new Date()
    }).then(() => {
      console.log('Folder created');
      document.getElementById('create-folder-modal').classList.add('hidden');
      document.getElementById('folder-name').value = '';
    }).catch(error => {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + error.message);
    });
  });

  // Folder Selection
  document.getElementById('folder-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('folder-btn')) {
      window.selectedFolder = e.target.dataset.folderId;
      console.log('Selected folder:', window.selectedFolder);
      document.querySelectorAll('.folder-btn').forEach(btn => btn.classList.remove('bg-blue-200'));
      e.target.classList.add('bg-blue-200');
      window.updateDisplay();
    }
  });
});

function loadFolders(uid) {
  console.log('Loading folders for user:', uid);
  const foldersQuery = query(collection(db, 'folders'), where('userId', '==', uid));
  onSnapshot(foldersQuery, (snapshot) => {
    window.folders = [
      { id: 'all', name: 'All', userId: null },
      { id: 'uncategorized', name: 'Uncategorized', userId: null },
      ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    console.log('Folders loaded:', window.folders);
    updateFolderUI();
  }, (error) => console.error('Error loading folders:', error));
}

function updateFolderUI() {
  const folderList = document.getElementById('folder-list');
  folderList.innerHTML = '';
  window.folders.forEach(folder => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button class="folder-btn w-full text-left p-2 bg-gray-100 rounded ${window.selectedFolder === folder.id ? 'bg-blue-200' : ''}" data-folder-id="${folder.id}">
        ${folder.name}
        ${folder.id !== 'all' && folder.id !== 'uncategorized' ? '<span class="delete-folder-btn float-right text-red-500"><i class="fas fa-trash"></i></span>' : ''}
      </button>
    `;
    folderList.appendChild(li);
  });

  // Populate folder dropdowns
  const noteFolderSelect = document.getElementById('note-folder');
  const taskFolderSelect = document.getElementById('task-folder');
  noteFolderSelect.innerHTML = '';
  taskFolderSelect.innerHTML = '';
  window.folders.filter(f => f.id !== 'all').forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.name;
    noteFolderSelect.appendChild(option.cloneNode(true));
    taskFolderSelect.appendChild(option);
  });

  // Event delegation for folder deletion
  folderList.addEventListener('click', (e) => {
    if (e.target.closest('.delete-folder-btn')) {
      const folderId = e.target.closest('.folder-btn').dataset.folderId;
      handleDeleteFolder(folderId);
    }
  });
}

function handleDeleteFolder(folderId) {
  if (folderId === 'all' || folderId === 'uncategorized') {
    alert('Cannot delete All or Uncategorized folders!');
    return;
  }
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to delete folders!');
    return;
  }
  const updates = [];
  window.notes.filter(n => n.folderId === folderId).forEach(note => {
    updates.push(updateDoc(doc(db, 'notes', note.id), { folderId: 'uncategorized' }));
  });
  window.tasks.filter(t => t.folderId === folderId).forEach(task => {
    updates.push(updateDoc(doc(db, 'tasks', task.id), { folderId: 'uncategorized' }));
  });
  window.archive.filter(a => a.folderId === folderId).forEach(item => {
    updates.push(updateDoc(doc(db, 'archive', item.id), { folderId: 'uncategorized' }));
  });
  Promise.all(updates).then(() => {
    deleteDoc(doc(db, 'folders', folderId)).then(() => {
      console.log(`Folder ${folderId} deleted successfully`);
      if (window.selectedFolder === folderId) {
        window.selectedFolder = 'uncategorized';
      }
      window.updateDisplay();
    }).catch(error => {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder: ' + error.message);
    });
  }).catch(error => {
    console.error('Error moving items to Uncategorized:', error);
    alert('Failed to move items to Uncategorized: ' + error.message);
  });
}