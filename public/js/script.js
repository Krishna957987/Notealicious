const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const wrapper = document.querySelector(".wrapper");
const loginTitle = document.querySelector(".title-login");
const registerTitle = document.querySelector(".title-register");
const signUpBtn = document.querySelector("#SignUpBtn");
const signInBtn = document.querySelector("#SignInBtn");
const list = document.querySelectorAll('.list');
function activeLink() {
    list.forEach((item) =>
    item.classList.remove('active'));
    this.classList.add('active');
}
list.forEach((item) =>
item.addEventListener('click',activeLink));


function loginFunction(){
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
function registerFunction(){
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

// Registration
signUpBtn.addEventListener("click", async () => {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-pass").value;
    const role = document.getElementById("reg-role").value;

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
signInBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("log-email").value;
  const password = document.getElementById("log-pass").value;

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      return alert("Login failed: " + data.error);
    }

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

document.getElementById('courseForm')
      .addEventListener('submit', async (e) => {
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
            window.location.href = '/teacher.html';
          } else {
            alert('Error: ' + result.error);
          }
        } catch (err) {
          console.error(err);
          alert('Upload failed.');
        }
      });
