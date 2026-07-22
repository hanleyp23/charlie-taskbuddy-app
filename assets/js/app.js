// This key name is shared across TaskBuddy so every page reads the same session value.
const TASK_DATA_KEY = 'savedTaskData';

// This helper reads the saved JSON string from sessionStorage and converts it back into an object.
function getTaskDataFromStorage() {
  console.log('Reading task data from sessionStorage...');

  const savedJson = sessionStorage.getItem(TASK_DATA_KEY);

  if (!savedJson) {
    console.log('No task data found in sessionStorage.');
    return null;
  }

  try {
    const parsedData = JSON.parse(savedJson);
    console.log('Parsed task data:', parsedData);
    return parsedData;
  } catch (error) {
    console.log('Could not parse saved JSON from sessionStorage.', error);
    return null;
  }
}

// This helper prints JSON into a <pre> block so users can see the formatted data.
function renderJson(targetId, data, fallbackMessage) {
  const targetElement = document.getElementById(targetId);

  if (!targetElement) {
    return;
  }

  if (!data) {
    targetElement.textContent = fallbackMessage;
    return;
  }

  targetElement.textContent = JSON.stringify(data, null, 2);
}

// This function fills the gist page preview with the saved JSON or a fallback message.
function initializeGistPreview() {
  const output = document.getElementById('gist-data-output');

  if (!output) {
    return;
  }

  const taskData = getTaskDataFromStorage();

  renderJson(
    'gist-data-output',
    taskData,
    'No session data was found. Go back and add or edit a task first.'
  );
}

// This startup function checks which page is open and runs the matching setup code.
function initializePage() {
  console.log('Initializing page scripts...');
  initializeGistPreview();
}

window.getTaskDataFromStorage = getTaskDataFromStorage;
document.addEventListener('DOMContentLoaded', initializePage);