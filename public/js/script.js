const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const wrapper = document.querySelector(".wrapper");
const loginTitle = document.querySelector(".title-login");
const registerTitle = document.querySelector(".title-register");
const signUpBtn = document.querySelector("#SignUpBtn");
const signInBtn = document.querySelector("#SignInBtn");
const list = document.querySelectorAll('.list');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function activeLink() {
  list.forEach((item) => item.classList.remove('active'));
  this.classList.add('active');
}
list.forEach((item) => item.addEventListener('click', activeLink));

function loginFunction() {
  loginForm.style.left = "50%";
  loginForm.style.opacity = 1;
  registerForm.style.left = "150%";
  registerForm.style.opacity = 0;
  wrapper.style.height = "500px";
  loginTitle.style.top = "50%";
  loginTitle.style.opacity = 1;
  registerTitle.style.top = "50px";
  registerTitle.style.opacity = 0;
}

function registerFunction() {
  loginForm.style.left = "-50%";
  loginForm.style.opacity = 0;
  registerForm.style.left = "50%";
  registerForm.style.opacity = 1;
  wrapper.style.height = "580px";
  loginTitle.style.top = "-60px";
  loginTitle.style.opacity = 0;
  registerTitle.style.top = "50%";
  registerTitle.style.opacity = 1;
}

function validateEmailInput() {
  const emailInput = document.getElementById('emailInput').value;
  const feedbackElement = document.getElementById('emailFeedback');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
}

// Registration
signUpBtn?.addEventListener("click", async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;
  const role = document.getElementById("reg-role").value;

  if (!email) return alert("Please enter your email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Please enter a valid Email address.");
  if (!password) return alert("Please enter your password.");
  if (!role) return alert("Please select a role.");

  const res = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await res.json();
  if (data.success) {
    alert("Registration successful!");
    loginFunction();
  } else {
    alert("Error: " + data.error);
  }
});

// Login
signInBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("log-email").value;
  const password = document.getElementById("log-pass").value;

  if (!email) return alert("Please enter your email.");
  if (!/^[^\s@]+@gmail.com$/.test(email)) return alert("Please enter a valid Gmail address.");
  if (!password) return alert("Please enter your password.");

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) return alert("Login failed: " + data.error);

    // Redirect based on role:
    switch (data.user.role) {
      case "teacher":
        window.location.href = "/teacher.html";
        break;
      case "student":
        window.location.href = "/student.html";
        break;
      default:
        alert("Unknown role: " + data.user.role);
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("An error occurred. Check the console.");
  }
});

// ✅ Course creation only if courseForm exists
if (document.getElementById('courseForm')) {
  document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = document.getElementById('courseForm');
    const data = new FormData(form);

    try {
      const res = await fetch('/courses', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.success) {
        alert('Course created!');
        // Redirect to student page so courses appear there
        window.location.href = '/student.html';
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  });
}

// ✅ Load courses only if on student page
// ✅ Load courses only if on student page
async function loadCourses() {
  try {
    const res = await fetch('/courses');
    const data = await res.json();

    if (!data.success) {
      return alert('Could not fetch courses');
    }

    const container = document.getElementById('courses-container');
    if (!container) return;

    container.innerHTML = ''; // clear old content

    if (data.courses.length === 0) {
      container.innerHTML = "<p>No courses available yet.</p>";
      return;
    }

    data.courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';

      // Build file links if any
      let filesHTML = '';
      if (course.files && course.files.length > 0) {
        filesHTML += '<div><strong>Attachments:</strong><ul>';
        course.files.forEach(file => {
          const filename = file.originalname || 'Attachment';
          const fileUrl = `/uploads/${file.filename}`;
          filesHTML += `<li><a href="${fileUrl}" target="_blank">${filename}</a></li>`;
        });
        filesHTML += '</ul></div>';
      }

      card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Topic:</strong> ${course.topic}</p>
        <p>${course.description}</p>
        ${filesHTML}
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Failed to fetch courses:', err);
  }
}

if (document.getElementById('courses-container')) {
  loadCourses();
}