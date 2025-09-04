document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Typing effect for hero section
  const textElement = document.getElementById('typing-text');
  const texts = ['Master Your Tasks with NotesApp', 'Stay Organized, Stay Ahead', 'Your Productivity Partner'];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    const currentText = texts[textIndex];
    if (!isDeleting && charIndex < currentText.length) {
      textElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100;
    } else if (isDeleting && charIndex > 0) {
      textElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50;
    } else if (!isDeleting && charIndex === currentText.length) {
      typingSpeed = 2000; // Pause before deleting
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typingSpeed = 500; // Pause before typing next
    }
    setTimeout(type, typingSpeed);
  }

  type();
});