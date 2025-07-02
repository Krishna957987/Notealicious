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

//register//
  signUpBtn?.addEventListener("click", async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;
  const role = document.getElementById("reg-role").value;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,20}$/;

  if (!email || !password || !role) {
    return alert("Please fill in all fields.");
  }

  if (!emailRegex.test(email)) {
    return alert("Invalid email format.");
  }

  if (!passwordRegex.test(password)) {
    return alert("Password must be 8–20 characters long, include at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
  }

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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Use a Gmail address.");

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) return alert("Login failed: " + data.error);

    // Store user data in localStorage
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("userRole", data.user.role);

    switch (data.user.role) {
      case "teacher":
        window.location.href = "/teacher.html";
        break;
      case "student":
        window.location.href = "/student.html";
        break;
      default:
        alert("Unknown role.");
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
async function loadCourses(userId) {
  try {
    const res = await fetch(`/courses/${userId}`);
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

      const skipBtn = document.createElement('button');
      skipBtn.textContent = "Skip";
      skipBtn.classList.add("skip-btn");
      skipBtn.setAttribute("data-course-id", course.id);
      card.appendChild(skipBtn);

      skipBtn.addEventListener('click', async () => {
        const courseId = course.id;
        const userId = localStorage.getItem("userId");

        const res = await fetch('/skip-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, courseId }),
        });

        const result = await res.json();
        if (result.success) {
          alert('Course skipped successfully!');
          card.remove();
        } else {
          alert('Failed to skip course.');
        }
      });

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
        <form class="mark-form" data-id="${sub.id}">
          <input type="text" name="mark" placeholder="Enter mark" value="${sub.mark || ''}" required />
          <button type="submit">Save Mark</button>
        </form>
        <button class="delete-btn" data-id="${sub.id}">Delete</button>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading submissions:', err);
  }
}

document.addEventListener('submit', async (e) => {
  if (e.target.classList.contains('mark-form')) {
    e.preventDefault();
    const form = e.target;
    const submissionId = form.getAttribute('data-id');
    const mark = form.querySelector('input[name="mark"]').value;

    try {
      const res = await fetch(`/submissions/${submissionId}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark })
      });

      const data = await res.json();
      if (data.success) {
        alert('Mark saved!');
      } else {
        alert('Error saving mark.');
      }
    } catch (err) {
      console.error('Error marking:', err);
    }
  }
});

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const submissionId = e.target.getAttribute('data-id');
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      const res = await fetch(`/submissions/${submissionId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        alert('Submission deleted.');
        loadSubmissions(); // Reload the list
      } else {
        alert('Error deleting.');
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  }
});

if (document.getElementById('courses-container')) {
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  if (userId && userRole == 'student') {
    loadCourses(userId);
  } else {
    alert("Not logged in");
    window.location.href = "/index.html"; 
  }
}

if (document.getElementById('submissions-container')) {
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  console.log(userId,'check teacher')
  if (userId && userRole == 'teacher') {
    loadSubmissions(userId);
  } else {
    alert("Not logged in");
    window.location.href = "/index.html"; 
  }
}

