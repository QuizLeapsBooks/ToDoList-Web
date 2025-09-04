import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;
let notes = [];
let tasks = [];
let categories = new Set(['Personal', 'Work', 'Study']);
let selectedColor = 'bg-blue-100';

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

  // Color Selection
  document.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedColor = e.target.dataset.color;
      document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'));
      e.target.classList.add('ring-2', 'ring-blue-500');
    });
  });

  // Create Note
  document.getElementById('create-note').addEventListener('click', () => addNote());

  // Create Task
  document.getElementById('create-task').addEventListener('click', () => addTask());

  // Tabs
  document.getElementById('notes-tab').addEventListener('click', () => {
    document.getElementById('notes-tab').classList.add('bg-white');
    document.getElementById('tasks-tab').classList.remove('bg-white');
    document.getElementById('tasks-tab').classList.add('bg-gray-100');
    document.getElementById('notes-content').classList.remove('hidden');
    document.getElementById('tasks-content').classList.add('hidden');
  });

  document.getElementById('tasks-tab').addEventListener('click', () => {
    document.getElementById('tasks-tab').classList.add('bg-white');
    document.getElementById('notes-tab').classList.remove('bg-white');
    document.getElementById('notes-tab').classList.add('bg-gray-100');
    document.getElementById('tasks-content').classList.remove('hidden');
    document.getElementById('notes-content').classList.add('hidden');
  });

  // Search and Filter
  document.getElementById('search-input').addEventListener('input', updateDisplay);
  document.getElementById('category-filter').addEventListener('change', updateDisplay);

  // Event Delegation for Delete and Complete Buttons
  document.getElementById('notes-content').addEventListener('click', handleDelete);
  document.getElementById('pinned-notes').addEventListener('click', handleDelete);
  document.getElementById('tasks-content').addEventListener('click', handleDelete);
  document.getElementById('tasks-content').addEventListener('click', handleComplete);
});

function loadData(uid) {
  const notesQuery = query(collection(db, 'notes'), where('userId', '==', uid));
  onSnapshot(notesQuery, (snapshot) => {
    notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateStats();
    updateDisplay();
  }, (error) => console.error('Error loading notes:', error));

  const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid));
  onSnapshot(tasksQuery, (snapshot) => {
    tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateStats();
    updateDisplay();
  }, (error) => console.error('Error loading tasks:', error));

  // Populate categories dynamically
  const filter = document.getElementById('category-filter');
  [...new Set([...notes.map(n => n.category), ...tasks.map(t => t.category)])].forEach(cat => {
    if (cat && !categories.has(cat)) {
      categories.add(cat);
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
  notes.filter(n => n.pinned && (category === 'All Categories' || n.category === category) && (n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search) || (n.tags || []).some(tag => tag.toLowerCase().includes(search)))).forEach(note => {
    const card = createNoteCard(note);
    card.classList.add('animate-fade-in');
    pinnedContainer.appendChild(card);
  });

  // Notes Content
  const notesContainer = document.getElementById('notes-content');
  notesContainer.innerHTML = '';
  notes.filter(n => !n.pinned && (category === 'All Categories' || n.category === category) && (n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search) || (n.tags || []).some(tag => tag.toLowerCase().includes(search)))).forEach(note => {
    const card = createNoteCard(note);
    card.classList.add('animate-fade-in');
    notesContainer.appendChild(card);
  });

  // Tasks Content
  const tasksContainer = document.getElementById('tasks-content');
  tasksContainer.innerHTML = '';
  tasks.filter(t => (category === 'All Categories' || t.category === category) && (t.title.toLowerCase().includes(search) || t.description.toLowerCase().includes(search) || (t.tags || []).some(tag => tag.toLowerCase().includes(search)))).forEach(task => {
    const card = createTaskCard(task);
    card.classList.add('animate-fade-in');
    tasksContainer.appendChild(card);
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
    <p class="text-sm text-gray-500 mt-2">${new Date(note.timestamp).toLocaleString()}</p>
    <div class="flex space-x-2 mt-2">
      <button class="text-red-500 delete-btn" data-id="${note.id}">Delete</button>
      <button class="text-blue-500 share-btn" data-id="${note.id}" data-type="note">Share</button>
    </div>
  `;
  return card;
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card p-4 rounded-lg shadow';
  card.innerHTML = `
    <div class="flex items-center">
      <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" class="complete-checkbox">
      <h4 class="font-bold ml-2 ${task.completed ? 'line-through' : ''}">${task.title}</h4>
    </div>
    <span class="category-tag ${task.category.toLowerCase()}">${task.category}</span>
    <span class="priority-badge ${task.priority.toLowerCase()} ml-2">${task.priority}</span>
    <p class="text-gray-600 mt-2">${task.description.substring(0, 100)}...</p>
    <p class="text-sm text-gray-500 mt-2">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
    <div class="flex space-x-2 mt-2">
      <button class="text-red-500 delete-btn" data-id="${task.id}">Delete</button>
      <button class="text-blue-500 share-btn" data-id="${task.id}" data-type="task">Share</button>
      <button class="text-green-500 complete-btn ${task.completed ? 'hidden' : ''}" data-id="${task.id}">Complete</button>
    </div>
  `;
  return card;
}

function handleDelete(event) {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.dataset.id;
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to delete items!');
      return;
    }
    const note = notes.find(n => n.id === id);
    const task = tasks.find(t => t.id === id);
    if (note) {
      notes = notes.filter(n => n.id !== id);
      updateDisplay();
      deleteDoc(doc(db, 'notes', id)).then(() => {
        console.log(`Note ${id} deleted successfully`);
      }).catch(error => {
        console.error('Error deleting note:', error);
        notes.push(note);
        updateDisplay();
        if (error.code === 'permission-denied') {
          alert('You don’t have permission to delete this note. Ensure you’re the owner.');
        } else if (error.code === 'not-found') {
          alert('Note not found in the database.');
        } else {
          alert('Failed to delete note: ' + error.message);
        }
      });
    } else if (task) {
      tasks = tasks.filter(t => t.id !== id);
      updateDisplay();
      deleteDoc(doc(db, 'tasks', id)).then(() => {
        console.log(`Task ${id} deleted successfully`);
      }).catch(error => {
        console.error('Error deleting task:', error);
        tasks.push(task);
        updateDisplay();
        if (error.code === 'permission-denied') {
          alert('You don’t have permission to delete this task. Ensure you’re the owner.');
        } else if (error.code === 'not-found') {
          alert('Task not found in the database.');
        } else {
          alert('Failed to delete task: ' + error.message);
        }
      });
    } else {
      alert('Item not found in local data. Please refresh and try again.');
    }
  }
}

function handleComplete(event) {
  if (event.target.classList.contains('complete-btn') || event.target.classList.contains('complete-checkbox')) {
    const id = event.target.dataset.id;
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to complete tasks!');
      return;
    }
    const task = tasks.find(t => t.id === id);
    if (task) {
      const completed = event.target.classList.contains('complete-checkbox') ? event.target.checked : true;
      updateDoc(doc(db, 'tasks', id), { completed }).then(() => {
        console.log(`Task ${id} marked as ${completed ? 'completed' : 'incomplete'}`);
        if (completed) {
          event.target.classList.add('hidden'); // Hide complete button
        }
      }).catch(error => {
        console.error('Error updating task:', error);
        alert('Failed to update task status: ' + error.message);
      });
    } else {
      alert('Task not found!');
    }
  }
}

function addNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const tags = document.getElementById('note-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const pinned = document.getElementById('note-pin').checked;
  const user = auth.currentUser;

  if (!title || !content) {
    alert('Please enter both title and content for the note!');
    return;
  }
  if (!user) {
    alert('You must be logged in to create a note!');
    return;
  }

  addDoc(collection(db, 'notes'), {
    userId: user.uid,
    title,
    content,
    category,
    tags,
    colorTheme: selectedColor,
    pinned,
    timestamp: new Date()
  }).then(() => {
    document.getElementById('new-note-modal').classList.add('hidden');
    clearNoteForm();
  }).catch(error => {
    console.error('Error adding note:', error);
    alert('Failed to create note: ' + error.message);
  });
}

function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const desc = document.getElementById('task-desc').value.trim();
  const category = document.getElementById('task-category').value;
  const tags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const priority = document.getElementById('task-priority').value;
  const due = document.getElementById('task-due').value;
  const user = auth.currentUser;

  if (!title) {
    alert('Please enter a title for the task!');
    return;
  }
  if (!user) {
    alert('You must be logged in to create a task!');
    return;
  }

  addDoc(collection(db, 'tasks'), {
    userId: user.uid,
    title,
    description: desc,
    category,
    tags,
    priority,
    dueDate: due ? new Date(due) : null,
    completed: false,
    timestamp: new Date()
  }).then(() => {
    document.getElementById('new-task-modal').classList.add('hidden');
    clearTaskForm();
  }).catch(error => {
    console.error('Error adding task:', error);
    alert('Failed to create task: ' + error.message);
  });
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