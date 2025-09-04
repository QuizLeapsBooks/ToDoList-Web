import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;
let notes = [];
let tasks = [];
let archive = []; // For archived items

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById('welcome-name').textContent = user.displayName || 'User';
      document.getElementById('user-name').textContent = `Hi, ${user.displayName || 'User'}`;
      loadData(user.uid);
    } else {
      window.location.href = 'signup.html';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'signup.html');
  });

  // Modal Controls
  document.getElementById('new-note-btn').addEventListener('click', () => {
    document.getElementById('new-note-modal').classList.remove('hidden');
  });

  document.getElementById('new-task-btn').addEventListener('click', () => {
    document.getElementById('new-task-modal').classList.remove('hidden');
  });

  document.getElementById('cancel-note').addEventListener('click', () => {
    document.getElementById('new-note-modal').classList.add('hidden');
    clearNoteForm();
  });

  document.getElementById('cancel-task').addEventListener('click', () => {
    document.getElementById('new-task-modal').classList.add('hidden');
    clearTaskForm();
  });

  // Create Note
  document.getElementById('create-note').addEventListener('click', () => addNote());

  // Create Task
  document.getElementById('create-task').addEventListener('click', () => addTask());

  // Tabs
  document.getElementById('notes-tab').addEventListener('click', () => {
    document.getElementById('notes-tab').classList.add('bg-white');
    document.getElementById('tasks-tab').classList.remove('bg-white');
    document.getElementById('archive-tab').classList.remove('bg-white');
    document.getElementById('tasks-tab').classList.add('bg-gray-100');
    document.getElementById('archive-tab').classList.add('bg-gray-100');
    document.getElementById('notes-content').classList.remove('hidden');
    document.getElementById('tasks-content').classList.add('hidden');
    document.getElementById('archive-content').classList.add('hidden');
  });

  document.getElementById('tasks-tab').addEventListener('click', () => {
    document.getElementById('tasks-tab').classList.add('bg-white');
    document.getElementById('notes-tab').classList.remove('bg-white');
    document.getElementById('archive-tab').classList.remove('bg-white');
    document.getElementById('notes-tab').classList.add('bg-gray-100');
    document.getElementById('archive-tab').classList.add('bg-gray-100');
    document.getElementById('tasks-content').classList.remove('hidden');
    document.getElementById('notes-content').classList.add('hidden');
    document.getElementById('archive-content').classList.add('hidden');
  });

  document.getElementById('archive-tab').addEventListener('click', () => {
    document.getElementById('archive-tab').classList.add('bg-white');
    document.getElementById('notes-tab').classList.remove('bg-white');
    document.getElementById('tasks-tab').classList.remove('bg-white');
    document.getElementById('notes-tab').classList.add('bg-gray-100');
    document.getElementById('tasks-tab').classList.add('bg-gray-100');
    document.getElementById('archive-content').classList.remove('hidden');
    document.getElementById('notes-content').classList.add('hidden');
    document.getElementById('tasks-content').classList.add('hidden');
  });

  // Event Delegation for Delete Buttons
  document.getElementById('notes-content').addEventListener('click', handleDelete);
  document.getElementById('pinned-notes').addEventListener('click', handleDelete);
  document.getElementById('tasks-content').addEventListener('click', handleDelete);
  document.getElementById('archive-content').addEventListener('click', handleDelete);
});

function loadData(uid) {
  const notesQuery = query(collection(db, 'notes'), where('userId', '==', uid), where('archived', '==', false));
  onSnapshot(notesQuery, (snapshot) => {
    notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateStats();
    updateDisplay();
  });

  const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid), where('archived', '==', false));
  onSnapshot(tasksQuery, (snapshot) => {
    tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateStats();
    updateDisplay();
  });

  const archiveQuery = query(collection(db, 'archive'), where('userId', '==', uid));
  onSnapshot(archiveQuery, (snapshot) => {
    archive = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateArchiveDisplay();
  });

  // Populate categories dynamically
  const filter = document.getElementById('category-filter');
  filter.innerHTML = '<option>All Categories</option>'; // Reset to avoid duplicates
  [...new Set([...notes.map(n => n.category), ...tasks.map(t => t.category)])].forEach(cat => {
    if (cat) {
      const option = document.createElement('option');
      option.textContent = cat;
      filter.appendChild(option);
    }
  });
}

function updateStats() {
  document.getElementById('total-notes').textContent = notes.length;
  document.getElementById('pending-tasks').textContent = tasks.filter(t => !t.completed).length;
  document.getElementById('completed-tasks').textContent = tasks.filter(t => t.completed).length;
  document.getElementById('pinned-notes').textContent = notes.filter(n => n.pinned).length;
  document.getElementById('notes-count').textContent = notes.length;
  document.getElementById('tasks-count').textContent = tasks.length;
}

function updateDisplay() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('category-filter').value;

  // Pinned Notes
  const pinnedContainer = document.getElementById('pinned-notes');
  pinnedContainer.innerHTML = '';
  notes.filter(n => n.pinned && (category === 'All Categories' || n.category === category) && (n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search) || (n.tags && n.tags.some(tag => tag.toLowerCase().includes(search))))).forEach(note => {
    const card = createNoteCard(note);
    card.classList.add('animate-fade-in');
    pinnedContainer.appendChild(card);
  });

  // Notes Content
  const notesContainer = document.getElementById('notes-content');
  notesContainer.innerHTML = '';
  notes.filter(n => !n.pinned && (category === 'All Categories' || n.category === category) && (n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search) || (n.tags && n.tags.some(tag => tag.toLowerCase().includes(search))))).forEach(note => {
    const card = createNoteCard(note);
    card.classList.add('animate-fade-in');
    notesContainer.appendChild(card);
  });

  // Tasks Content
  const tasksContainer = document.getElementById('tasks-content');
  tasksContainer.innerHTML = '';
  tasks.filter(t => (category === 'All Categories' || t.category === category) && (t.title.toLowerCase().includes(search) || t.description.toLowerCase().includes(search) || (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search))))).forEach(task => {
    const card = createTaskCard(task);
    card.classList.add('animate-fade-in');
    tasksContainer.appendChild(card);
  });
}

function updateArchiveDisplay() {
  const archiveContainer = document.getElementById('archive-content');
  archiveContainer.innerHTML = '';
  archive.forEach(item => {
    let card;
    if (item.type === 'note') {
      card = createNoteCard(item);
    } else if (item.type === 'task') {
      card = createTaskCard(item);
    }
    card.classList.add('animate-fade-in');
    archiveContainer.appendChild(card);
  });
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = `note-card ${note.colorTheme} p-4 rounded-lg shadow`;
  card.innerHTML = `
    <div class="flex justify-between">
      <h4 class="font-bold">${note.title}</h4>
      <i class="fas fa-thumbtack text-purple-500 ${note.pinned ? '' : 'hidden'}"></i>
    </div>
    <span class="category-tag ${note.category.toLowerCase()}">${note.category}</span>
    <p class="text-gray-600 mt-2">${note.content.substring(0, 100)}...</p>
    <p class="text-sm text-gray-500 mt-2">${new Date(note.timestamp.seconds * 1000).toLocaleString()}</p>
    <div class="tags mt-2">
      ${note.tags ? note.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('') : ''}
    </div>
    <button class="text-red-500 mt-2 delete-btn" data-id="${note.id}" data-type="note">Delete</button>
    <button class="text-blue-500 mt-2 share-btn" data-id="${note.id}" data-type="note">Share</button>
    <button class="text-gray-500 mt-2 archive-btn" data-id="${note.id}" data-type="note">Archive</button>
  `;
  return card;
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card p-4 rounded-lg shadow';
  card.innerHTML = `
    <div class="flex items-center">
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete('${task.id}', this.checked)">
      <h4 class="font-bold ml-2 ${task.completed ? 'line-through' : ''}">${task.title}</h4>
    </div>
    <span class="category-tag ${task.category.toLowerCase()}">${task.category}</span>
    <span class="priority-badge ${task.priority.toLowerCase()} ml-2">${task.priority}</span>
    <p class="text-gray-600 mt-2">${task.description.substring(0, 100)}...</p>
    <p class="text-sm text-gray-500 mt-2">Due: ${task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : 'No due date'}</p>
    <div class="tags mt-2">
      ${task.tags ? task.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('') : ''}
    </div>
    <button class="text-red-500 mt-2 delete-btn" data-id="${task.id}" data-type="task">Delete</button>
    <button class="text-green-500 mt-2 complete-btn" data-id="${task.id}" data-type="task">Complete</button>
    <button class="text-blue-500 mt-2 share-btn" data-id="${task.id}" data-type="task">Share</button>
    <button class="text-gray-500 mt-2 archive-btn" data-id="${task.id}" data-type="task">Archive</button>
  `;
  return card;
}

function handleDelete(event) {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.dataset.id;
    const type = event.target.dataset.type;
    const user = auth.currentUser;
    if (user) {
      deleteDoc(doc(db, type + 's', id)).then(() => {
        console.log(`${type} ${id} deleted successfully`);
        updateDisplay(); // Refresh UI after delete
        updateStats(); // Update stats
      }).catch(error => console.error(`Error deleting ${type}:`, error));
    }
  }
}

function addNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const tags = document.getElementById('note-tags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
  const pinned = document.getElementById('note-pin').checked;
  const user = auth.currentUser;

  if (title && content && user) {
    addDoc(collection(db, 'notes'), {
      userId: user.uid,
      title,
      content,
      category,
      tags,
      colorTheme: selectedColor,
      pinned,
      archived: false,
      timestamp: Timestamp.now()
    }).then(() => {
      document.getElementById('new-note-modal').classList.add('hidden');
      clearNoteForm();
      updateDisplay(); // Refresh after add
    }).catch(error => console.error('Error adding note:', error));
  } else {
    console.error('Missing fields or user not authenticated');
  }
}

function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const desc = document.getElementById('task-desc').value.trim();
  const category = document.getElementById('task-category').value;
  const tags = document.getElementById('task-tags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
  const priority = document.getElementById('task-priority').value;
  const due = document.getElementById('task-due').value;
  const user = auth.currentUser;

  if (title && user) {
    addDoc(collection(db, 'tasks'), {
      userId: user.uid,
      title,
      description: desc,
      category,
      tags,
      priority,
      dueDate: due ? Timestamp.fromDate(new Date(due)) : null,
      completed: false,
      archived: false,
      timestamp: Timestamp.now()
    }).then(() => {
      document.getElementById('new-task-modal').classList.add('hidden');
      clearTaskForm();
      updateDisplay(); // Refresh after add
    }).catch(error => console.error('Error adding task:', error));
  } else {
    console.error('Missing fields or user not authenticated');
  }
}

function toggleComplete(id, completed) {
  const user = auth.currentUser;
  if (user) {
    updateDoc(doc(db, 'tasks', id), { completed }).then(() => {
      updateStats(); // Update pending/completed count
      updateDisplay(); // Refresh UI
    }).catch(error => console.error('Error updating task:', error));
  }
}

function clearNoteForm() {
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  document.getElementById('note-tags').value = '';
  document.getElementById('note-pin').checked = false;
  selectedColor = 'bg-blue-100';
  document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'));
  document.querySelector('[data-color="bg-blue-100"]').classList.add('ring-2', 'ring-blue-500');
}

function clearTaskForm() {
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-tags').value = '';
  document.getElementById('task-due').value = '';
}