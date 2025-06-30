// UI + Auth logic remains the same
const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const wrapper = document.querySelector(".wrapper");
const loginTitle = document.querySelector(".title-login");
const registerTitle = document.querySelector(".title-register");
const signUpBtn = document.querySelector("#SignUpBtn");
const signInBtn = document.querySelector("#SignInBtn");
const list = document.querySelectorAll('.list');

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

// REGISTER
signUpBtn?.addEventListener("click", async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;
  const role = document.getElementById("reg-role").value;

  if (!email || !password || !role) return alert("Please fill in all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Invalid email.");

  const res = await fetch("/register", {
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

// LOGIN
signInBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("log-email").value;
  const password = document.getElementById("log-pass").value;

  if (!email || !password) return alert("Missing credentials.");
  if (!/^[^\s@]+@gmail.com$/.test(email)) return alert("Use a Gmail address.");

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) return alert("Login failed: " + data.error);

    switch (data.user.role) {
      case "teacher": window.location.href = "/teacher.html"; break;
      case "student": window.location.href = "/student.html"; break;
      default: alert("Unknown role.");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("An error occurred.");
  }
});

// COURSE CREATION (teacher)
if (document.getElementById('courseForm')) {
  document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = document.getElementById('courseForm');
    const data = new FormData(form);

    try {
      const res = await fetch('/courses', { method: 'POST', body: data });
      const result = await res.json();
      if (result.success) {
        alert('Course created!');
        window.location.href = '/teacher.html';
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  });
}

// LOAD COURSES (student.html)
async function loadCourses() {
  try {
    const res = await fetch('/courses');
    const data = await res.json();

    if (!data.success) return alert('Could not fetch courses');
    const container = document.getElementById('courses-container');
    if (!container) return;

    container.innerHTML = '';

    if (data.courses.length === 0) {
      container.innerHTML = "<p>No courses available yet.</p>";
      return;
    }

    data.courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';

      card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Topic:</strong> ${course.topic}</p>
        <p>${course.description}</p>
        ${course.files.map(file => `
          <p><a href="/uploads/${file.filename}" target="_blank">${file.originalname}</a></p>
        `).join('')}
        <form class="response-form" data-course-id="${course.id}" enctype="multipart/form-data">
          <label><strong>Your answer</strong></label>
          <input type="file" name="response" required />
          <button type="submit">Submit Response</button>
        </form>
      `;

      

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading courses:', err);
  }
}


document.addEventListener('submit', async (e) => {
  if (e.target.classList.contains('response-form')) {
    e.preventDefault();
    const form = e.target;
    const courseId = form.getAttribute('data-course-id');
    const fileInput = form.querySelector('input[type="file"]');
    const formData = new FormData();
    formData.append('response', fileInput.files[0]);
    formData.append('courseId', courseId);

    try {
      const res = await fetch('/submit', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        alert('Submission successful!');
        form.reset();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('An error occurred.');
    }
  }
});


async function loadSubmissions() {
  const container = document.getElementById('submissions-container');
  if (!container) return;

  try {
    const res = await fetch('/submissions');
    const data = await res.json();

    if (!data.success || !data.submissions.length) {
      container.innerHTML = "<p>No submissions yet.</p>";
      return;
    }

    container.innerHTML = '';
    data.submissions.forEach(sub => {
      const card = document.createElement('div');
      card.className = 'submission-card';

      card.innerHTML = `
        <h3>${sub.courseTitle}</h3>
        <p><strong>Topic:</strong> ${sub.topic}</p>
        <p>${sub.description}</p>
        <p><a href="/uploads/${sub.filename}" target="_blank">${sub.originalname}</a></p>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading submissions:', err);
  }
}

// INIT
if (document.getElementById('courses-container')) loadCourses();
if (document.getElementById('submissions-container')) loadSubmissions();
