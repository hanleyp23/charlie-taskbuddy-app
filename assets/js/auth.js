(() => {
  const AUTH_API_URL =
    'https://authn.barrycumbie.com/api/authn/login';

  const FALLBACK_PASSWORD = 'cat';

  if (
    window.taskBuddyAuth &&
    window.taskBuddyAuth.isAuthenticated()
  ) {
    window.location.replace(
      window.taskBuddyAuth.buildAppUrl('index.html')
    );

    return;
  }

  const loginForm = document.getElementById('loginForm');
  const userBox = document.getElementById('userBox');
  const passBox = document.getElementById('passBox');
  const authMessage = document.getElementById('authMsg');

  if (!loginForm || !userBox || !passBox || !authMessage) {
    return;
  }

  // Shows login message
  function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.classList.toggle('text-danger', isError);
  }

  // Saves login session
  function saveSession(username, token) {
    sessionStorage.setItem('sessionAuthN', 'true');
    sessionStorage.setItem('sessionUser', username);
    sessionStorage.setItem('sessionToken', token);
  }

  // Sends the login data to auth web
  async function loginWithApi(username, password) {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed.');
    }

    return response.json();
  }

  // Signs user in
  async function handleLogin(event) {
    event.preventDefault();

    const username = userBox.value.trim();
    const password = passBox.value.trim();

    if (!username || !password) {
      showMessage('Wrong Password.', true);
      return;
    }

    showMessage('Signing in...');

    try {
      const data = await loginWithApi(username, password);
      const token = data.token || 'api-login';

      saveSession(username, token);

      window.location.assign(
        window.taskBuddyAuth.buildAppUrl('index.html')
      );
    } catch (error) {
      if (password === FALLBACK_PASSWORD) {
        saveSession(username, 'fallback-login');

        window.location.assign(
          window.taskBuddyAuth.buildAppUrl('index.html')
        );

        return;
      }

      showMessage('Login failed. Use cat as the password.', true);
    }
  }

  loginForm.addEventListener('submit', handleLogin);
})();