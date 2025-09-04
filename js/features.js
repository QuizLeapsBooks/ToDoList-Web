import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const auth = window.auth;

// Share Option
function handleShare(event) {
  if (event.target.classList.contains('share-btn')) {
    const id = event.target.dataset.id;
    const type = event.target.dataset.type;
    const user = auth.currentUser;
    if (user) {
      let item;
      if (type === 'note') {
        item = window.notes.find(n => n.id === id);
      } else if (type === 'task') {
        item = window.tasks.find(t => t.id === id);
      }
      if (item) {
        const watermark = "\n\nShared via NotesApp - Your Productivity Hub (notesapp.com)";
        const shareText = `${type.toUpperCase()}: ${item.title}\n${
          type === 'note' ? item.content : item.description
        }${watermark}`;
        if (navigator.share) {
          navigator.share({
            title: item.title,
            text: shareText,
          }).then(() => console.log('Shared successfully'))
            .catch(error => {
              console.error('Error sharing:', error);
              alert('Failed to share: ' + error.message);
            });
        } else {
          navigator.clipboard.writeText(shareText).then(() => alert('Copied to clipboard with NotesApp watermark!'))
            .catch(error => {
              console.error('Error copying to clipboard:', error);
              alert('Failed to copy to clipboard: ' + error.message);
            });
        }
      } else {
        alert('Item not found! Please refresh and try again.');
      }
    } else {
      alert('You must be logged in to share!');
    }
  }
}

// Dark/Light Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  const body = document.getElementById('body-theme');
  body.classList.toggle('dark-theme');
  localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.getElementById('body-theme').classList.add('dark-theme');
}

// Event Delegation for Share Buttons
document.getElementById('notes-content').addEventListener('click', handleShare);
document.getElementById('pinned-notes').addEventListener('click', handleShare);
document.getElementById('tasks-content').addEventListener('click', handleShare);