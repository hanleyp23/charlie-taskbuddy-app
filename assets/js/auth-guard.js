(() => {
  const AUTH_KEY = 'sessionAuthN';

  // Finds main folder
  function getBasePath() {
    const path = window.location.pathname;
    const pagesIndex = path.indexOf('/pages/');

    if (pagesIndex >= 0) {
      return path.slice(0, pagesIndex);
    }

    return path.slice(0, path.lastIndexOf('/'));
  }

  // Builds app URL
  function buildAppUrl(filePath) {
    return `${window.location.origin}${getBasePath()}/${filePath}`;
  }

  // Checks login 
  function isAuthenticated() {
  return Boolean(sessionStorage.getItem('sessionToken'));

  }

  // Gets the signed-in username
  function getSessionUser() {
    return sessionStorage.getItem('sessionUser') || '';
  }

  // Removes login session
  function clearSession() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('sessionUser');
    sessionStorage.removeItem('sessionToken');
  }

  // Protects pages that require login
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.replace(
        buildAppUrl('pages/auth.html')
      );

      return false;
    }

    return true;
  }

  window.taskBuddyAuth = {
    buildAppUrl,
    isAuthenticated,
    getSessionUser,
    clearSession,
    requireAuth,
  };
})();