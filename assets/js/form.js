(() => {
  if (!window.taskBuddyAuth || !window.taskBuddyAuth.requireAuth()) {
    return;
  }

  const STORAGE_KEY = 'taskRecords';
  const SESSION_KEY = 'savedTaskData';
  const DATA_PATH = 'assets/data/tasks.json';

  const taskForm = document.getElementById('taskForm');
  const formHeading = document.getElementById('formHeading');
  const submitButton = document.getElementById('submitButton');
  const titleBox = document.getElementById('taskTitle');
  const descriptionBox = document.getElementById('taskDescription');
  const dateBox = document.getElementById('taskDate');
  const categoryBox = document.getElementById('taskCategory');
  const priorityBox = document.getElementById('taskPriority');
  const tagsBox = document.getElementById('taskTags');
  const linksBox = document.getElementById('taskLinks');
  const favoriteBox = document.getElementById('taskFavorite');
  const profileName = document.getElementById('profileName');
  const logoutButton = document.getElementById('logoutBtn');

  const queryParams = new URLSearchParams(window.location.search);
  const editId = queryParams.get('editId');

  if (
    !taskForm ||
    !formHeading ||
    !submitButton ||
    !titleBox ||
    !descriptionBox ||
    !dateBox ||
    !categoryBox ||
    !priorityBox ||
    !tagsBox ||
    !linksBox ||
    !favoriteBox
  ) {
    return;
  }

  let tasks = [];

  if (profileName) {
    profileName.textContent = window.taskBuddyAuth.getSessionUser() || 'User';
  }

  $('#taskDate').datepicker({
    dateFormat: 'yy-mm-dd',
  });

  // Reads saved tasks
  function readSavedTasks() {
    const savedData =
      localStorage.getItem(STORAGE_KEY) ||
      sessionStorage.getItem(SESSION_KEY);

    if (!savedData) {
      return [];
    }

    try {
      const parsedData = JSON.parse(savedData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Saved tasks could not be read');
      return [];
    }
  }

  // Saves all tasks
  function saveTasks() {
    const taskData = JSON.stringify(tasks);

    localStorage.setItem(STORAGE_KEY, taskData);
    sessionStorage.setItem(SESSION_KEY, taskData);
  }

  // Loads starting tasks
  async function loadTasks() {
    const savedTasks = readSavedTasks();

    if (savedTasks.length) {
      tasks = savedTasks;
      fillEditForm();
      return;
    }

    try {
      const dataUrl = window.taskBuddyAuth.buildAppUrl(DATA_PATH);
      const response = await fetch(dataUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Tasks could not be loaded');
      }

      const taskData = await response.json();

      if (!Array.isArray(taskData)) {
        throw new Error('Task data is invalid');
      }

      tasks = taskData;
      saveTasks();
      fillEditForm();
    } catch (error) {
      console.error(error);
    }
  }

  // Reads the tags
  function getTags() {
    return tagsBox.value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
  }

  // Reads links
  function getLinks() {
    return linksBox.value
      .split('\n')
      .map((line) => {
        const parts = line.split('|');

        return {
          label: parts[0] ? parts[0].trim() : '',
          url: parts[1] ? parts[1].trim() : '',
        };
      })
      .filter((link) => link.url.length > 0);
  }

  // Fills edit form
  function fillEditForm() {
    if (!editId) {
      return;
    }

    const task = tasks.find((item) => String(item.id) === String(editId));

    if (!task) {
      return;
    }

    formHeading.textContent = 'Edit Task';
    submitButton.textContent = 'Save Changes';

    titleBox.value = task.title || '';
    descriptionBox.value = task.description || '';
    dateBox.value = task.date || '';
    categoryBox.value = task.category || '';
    priorityBox.value = task.priority || '';
    tagsBox.value = Array.isArray(task.tags) ? task.tags.join(', ') : '';
    favoriteBox.checked = Boolean(task.favorite);

    const links = Array.isArray(task.links) ? task.links : [];

    linksBox.value = links
      .map((link) => `${link.label || ''} | ${link.url || ''}`)
      .join('\n');
  }

  // Saves form
  function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!taskForm.checkValidity()) {
      taskForm.classList.add('was-validated');
      return;
    }

    const taskData = {
      id: editId || `task-${Date.now()}`,
      title: titleBox.value.trim(),
      description: descriptionBox.value.trim(),
      date: dateBox.value,
      category: categoryBox.value,
      priority: priorityBox.value,
      tags: getTags(),
      favorite: favoriteBox.checked,
      links: getLinks(),
    };

    if (editId) {
      tasks = tasks.map((task) => {
        return String(task.id) === String(editId) ? taskData : task;
      });
    } else {
      tasks.unshift(taskData);
    }

    saveTasks();

    window.location.assign(
      window.taskBuddyAuth.buildAppUrl('index.html')
    );
  }

  // Signs user out
  function handleLogout() {
    window.taskBuddyAuth.clearSession();

    window.location.assign(
      window.taskBuddyAuth.buildAppUrl('pages/auth.html')
    );
  }

  taskForm.addEventListener('submit', handleSubmit);

  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  loadTasks();
})();