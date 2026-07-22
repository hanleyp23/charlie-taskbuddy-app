(() => {
  const STORAGE_KEY = 'taskRecords';
  const SESSION_KEY = 'savedTaskData';
  const DATA_PATH = 'assets/data/tasks.json';

  if (!window.taskBuddyAuth.requireAuth()) {
    return;
  }

  const taskList = document.getElementById('taskList');
  const taskTemplate = document.getElementById('taskCardTemplate');
  const taskSearch = document.getElementById('taskSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const sortTasks = document.getElementById('sortTasks');
  const favoritesButton = document.getElementById('favoritesOnlyBtn');
  const profileName = document.getElementById('profileName');
  const logoutButton = document.getElementById('logoutBtn');

  let tasks = [];
  let favoritesOnly = false;

  profileName.textContent =
    window.taskBuddyAuth.getSessionUser() || 'User';

  // Reads saved tasks
  function readSavedTasks() {
    const savedData =
      localStorage.getItem(STORAGE_KEY) ||
      sessionStorage.getItem(SESSION_KEY);

    if (!savedData) {
      return null;
    }

    try {
      const parsedData = JSON.parse(savedData);
      return Array.isArray(parsedData) ? parsedData : null;
    } catch (error) {
      console.error('Saved tasks could not be read');
      return null;
    }
  }

  // Saves tasks
  function saveTasks() {
    const taskData = JSON.stringify(tasks);

    localStorage.setItem(STORAGE_KEY, taskData);
    sessionStorage.setItem(SESSION_KEY, taskData);
  }

  // Loads tasks
  async function loadTasks() {
    const savedTasks = readSavedTasks();

    if (savedTasks) {
      tasks = savedTasks;
      showTasks();
      return;
    }

    try {
      const dataUrl =
        window.taskBuddyAuth.buildAppUrl(DATA_PATH);

      const response = await fetch(dataUrl, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Tasks could not be loaded');
      }

      const taskData = await response.json();

      if (!Array.isArray(taskData)) {
        throw new Error('Task data is invalid');
      }

      tasks = taskData;
      saveTasks();
      showTasks();
    } catch (error) {
      console.error(error);
    }
  }

  // Formats due date
  function formatDate(date) {
    return new Date(`${date}T00:00:00`).toLocaleDateString();
  }

  // Combines searchable text
  function getTaskText(task) {
    const tags = Array.isArray(task.tags)
      ? task.tags.join(' ')
      : '';

    const links = Array.isArray(task.links)
      ? task.links
          .map((link) => `${link.label || ''} ${link.url || ''}`)
          .join(' ')
      : '';

    return [
      task.title,
      task.description,
      task.date,
      task.category,
      task.priority,
      tags,
      links,
    ]
      .join(' ')
      .toLowerCase();
  }

  // Filters and sorts tasks
  function getVisibleTasks() {
    const searchText =
      taskSearch.value.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesSearch =
          !searchText ||
          getTaskText(task).includes(searchText);

        const matchesCategory =
          categoryFilter.value === 'all' ||
          task.category === categoryFilter.value;

        const matchesPriority =
          priorityFilter.value === 'all' ||
          task.priority === priorityFilter.value;

        const matchesFavorite =
          !favoritesOnly || task.favorite;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesPriority &&
          matchesFavorite
        );
      })
      .sort((firstTask, secondTask) => {
        if (firstTask.favorite !== secondTask.favorite) {
          return firstTask.favorite ? -1 : 1;
        }

        if (sortTasks.value === 'title') {
          return firstTask.title.localeCompare(secondTask.title);
        }

        return (
          new Date(firstTask.date) -
          new Date(secondTask.date)
        );
      });
  }

  // Adds task tags
  function addTags(tags, tagArea) {
    tagArea.innerHTML = '';

    if (!Array.isArray(tags)) {
      return;
    }

    tags.forEach((tag) => {
      const badge = document.createElement('span');

      badge.className = 'badge text-bg-light border';
      badge.textContent = tag;

      tagArea.appendChild(badge);
    });
  }

  // Adds task links
  function addLinks(links, linkArea) {
    linkArea.innerHTML = '';

    if (!Array.isArray(links)) {
      return;
    }

    links.forEach((link) => {
      if (!link.url) {
        return;
      }

      const taskLink = document.createElement('a');

      taskLink.className =
        'btn btn-sm btn-outline-secondary me-2 mt-2';

      taskLink.href = link.url;
      taskLink.target = '_blank';
      taskLink.rel = 'noopener noreferrer';
      taskLink.textContent = link.label || 'Open Link';

      linkArea.appendChild(taskLink);
    });
  }

  // Displays task cards
  function showTasks() {
    const visibleTasks = getVisibleTasks();

    taskList.innerHTML = '';

    if (!visibleTasks.length) {
      taskList.innerHTML =
        '<p class="text-center">No tasks found</p>';
      return;
    }

    visibleTasks.forEach((task) => {
      const taskCard =
        taskTemplate.content.cloneNode(true);

      const card =
        taskCard.querySelector('.task-card');

      card.dataset.taskId = task.id;
      card.classList.toggle(
        'is-favorite',
        task.favorite
      );

      taskCard.querySelector(
        '[data-field="title"]'
      ).textContent = task.title;

      taskCard.querySelector(
        '[data-field="description"]'
      ).textContent = task.description;

      taskCard.querySelector(
        '[data-field="category"]'
      ).textContent = task.category;

      taskCard.querySelector(
        '[data-field="priority"]'
      ).textContent = task.priority;

      taskCard.querySelector(
        '[data-field="date"]'
      ).textContent = `Due ${formatDate(task.date)}`;

      taskCard.querySelector(
        '[data-field="favorite-icon"]'
      ).className = task.favorite
        ? 'bi bi-star-fill'
        : 'bi bi-star';

      taskCard.querySelector(
        '[data-field="edit-link"]'
      ).href =
        `pages/form.html?editId=${encodeURIComponent(task.id)}`;

      addTags(
        task.tags,
        taskCard.querySelector('[data-field="tags"]')
      );

      addLinks(
        task.links,
        taskCard.querySelector('[data-field="links"]')
      );

      taskList.appendChild(taskCard);
    });
  }

  // Updates favorites and edits
  function handleTaskClick(event) {
    const button =
      event.target.closest('[data-action]');

    if (!button) {
      return;
    }

    const card =
      button.closest('[data-task-id]');

    const task = tasks.find((item) => {
      return item.id === card.dataset.taskId;
    });

    if (!task) {
      return;
    }

    if (button.dataset.action === 'favorite') {
      task.favorite = !task.favorite;
    }

    if (button.dataset.action === 'save-edit') {
      task.title = card
        .querySelector('[data-field="title"]')
        .textContent.trim();

      task.description = card
        .querySelector('[data-field="description"]')
        .textContent.trim();
    }

    saveTasks();
    showTasks();
  }

  $('#taskSearch').on('input', showTasks);

  categoryFilter.addEventListener('change', showTasks);
  priorityFilter.addEventListener('change', showTasks);
  sortTasks.addEventListener('change', showTasks);
  taskList.addEventListener('click', handleTaskClick);

  favoritesButton.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;

    favoritesButton.classList.toggle(
      'is-active',
      favoritesOnly
    );

    showTasks();
  });

  logoutButton.addEventListener('click', () => {
    window.taskBuddyAuth.clearSession();

    window.location.assign(
      window.taskBuddyAuth.buildAppUrl('pages/auth.html')
    );
  });

  loadTasks();
})();
