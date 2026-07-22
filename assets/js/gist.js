// This helper shows a Bootstrap alert on the gist page.
function showGistMessage(message, alertType) {
  const messageElement = document.getElementById('gist-message');

  if (!messageElement) {
    return;
  }

  messageElement.className = `alert alert-${alertType}`;
  messageElement.innerHTML = message;
}

// This helper accepts either a gist ID or a gist URL and returns the gist ID.
function normalizeGistId(inputValue) {
  const trimmedValue = inputValue.trim();

  if (!trimmedValue) {
    return '';
  }

  if (!trimmedValue.includes('/')) {
    return trimmedValue;
  }

  const cleanedUrl = trimmedValue.replace(/\/$/, '');
  const pathParts = cleanedUrl.split('/');
  const lastSegment = pathParts[pathParts.length - 1];

  return lastSegment.split('?')[0].split('#')[0];
}

// This helper creates the request body to post a comment on an existing gist.
function buildGistCommentPayload(savedData) {
  const fileContents = JSON.stringify(savedData, null, 2);
  const timestamp = new Date().toISOString();

  return {
    body: `New JSON submission at ${timestamp}\n\n\`\`\`json\n${fileContents}\n\`\`\``
  };
}

// This function adds a comment to an existing gist.
async function createGistComment(token, gistId, payload) {
  console.log('Sending POST request to the GitHub Gist comments API...');

  const response = await fetch(`https://api.github.com/gists/${gistId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();
  console.log('GitHub API response:', responseData);

  if (!response.ok) {
    const errorMessage =
      responseData.message || 'GitHub returned an unexpected error.';

    throw new Error(errorMessage);
  }

  return responseData;
}

// This function wires up the gist form and handles success and error states.
function initializeGistPage() {
  const gistForm = document.getElementById('gist-form');

  if (!gistForm) {
    return;
  }

  gistForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    console.log('Gist form submission prevented so JavaScript can send the API request.');

    const savedData = window.getTaskDataFromStorage();

    if (!savedData) {
      showGistMessage(
        'No session data was found. Go back and add or edit a task first.',
        'warning'
      );
      return;
    }

    const gistIdInput = document.getElementById('gist-id');
    const tokenInput = document.getElementById('github-token');
    const gistId = normalizeGistId(gistIdInput.value);
    const token = tokenInput.value.trim();

    if (!gistId) {
      showGistMessage(
        'Please paste an existing gist ID before submitting JSON.',
        'warning'
      );
      return;
    }

    if (!token) {
      showGistMessage(
        'Please paste a GitHub personal access token before posting a comment.',
        'warning'
      );
      return;
    }

    const payload = buildGistCommentPayload(savedData);
    console.log('Gist comment payload:', payload);

    showGistMessage('Posting comment to gist... please wait.', 'info');

    try {
      const gistCommentResponse =
        await createGistComment(token, gistId, payload);

      const commentUrl = gistCommentResponse.html_url;
      const gistUrl = `https://gist.github.com/${gistId}`;

      showGistMessage(
        `Success! JSON was added as a comment: <a href="${commentUrl}" target="_blank" rel="noopener noreferrer">${commentUrl}</a><br />View gist: <a href="${gistUrl}" target="_blank" rel="noopener noreferrer">${gistUrl}</a>`,
        'success'
      );
    } catch (error) {
      console.log('Gist comment creation failed:', error);
      showGistMessage(
        `Error posting gist comment: ${error.message}`,
        'danger'
      );
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeGistPage);