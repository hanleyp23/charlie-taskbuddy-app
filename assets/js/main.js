(() => {
	if (!window.taskBuddyAuth || !window.taskBuddyAuth.requireAuth()) {
		return;
	}

	const STORAGE_KEY = 'taskRecords';
	const SESSION_KEY = 'savedTaskData';
	const DATA_PATH = 'assets/data/tasks.json';

	const profileName = document.getElementById('profileName');
	const logoutButton = document.getElementById('logoutBtn');
	const taskList = document.getElementById('taskList');
	const taskTemplate = document.getElementById('taskCardTemplate');
	const taskSearch = document.getElementById('taskSearch');
	const categoryFilter = document.getElementById('categoryFilter');
	const priorityFilter = document.getElementById('priorityFilter');
	const sortTasks = document.getElementById('sortTasks');
	const favoritesButton = document.getElementById('favoritesOnlyBtn');

	if (!taskList || !(taskTemplate instanceof HTMLTemplateElement) || !taskSearch || !categoryFilter || !priorityFilter || !sortTasks || !favoritesButton) {
		return;
	}

	let tasks = [];
	let favoritesOnly = false;

	if (profileName) {
		profileName.textContent = window.taskBuddyAuth.getSessionUser() || 'User';
	}

	// Reads saved tasks
	function readStoredTasks() {
		const savedData = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);

		if (!savedData) {
			return [];
		}

		try {
			const parsedData = JSON.parse(savedData);
			return Array.isArray(parsedData) ? parsedData : [];
		} catch (error) {
			return [];
		}
	}

	// Saves all tasks
	function saveAllTasks(taskData) {
		const savedData = JSON.stringify(taskData);

		localStorage.setItem(STORAGE_KEY, savedData);
		sessionStorage.setItem(SESSION_KEY, savedData);
	}

	// Loads starting tasks
	async function seedTasksFromInternalData() {
		const savedTasks = readStoredTasks();

		if (savedTasks.length) {
			return;
		}

		try {
			const dataUrl = window.taskBuddyAuth.buildAppUrl(DATA_PATH);
			const response = await fetch(dataUrl, { cache: 'no-store' });

			if (!response.ok) {
				return;
			}

			const taskData = await response.json();

			if (!Array.isArray(taskData) || !taskData.length) {
				return;
			}

			saveAllTasks(taskData);
		} catch (error) {
			console.error('Task data could not be loaded');
		}
	}

	// Adds missing task IDs
	function ensureTaskIds(taskData) {
		let didChange = false;

		taskData.forEach((task, index) => {
			if (!task.id) {
				task.id = `task-${Date.now()}-${index}`;
				didChange = true;
			}
		});

		if (didChange) {
			saveAllTasks(taskData);
		}
	}

	// Formats date
	function formatDate(date) {
		if (!date) {
			return 'No due date';
		}

		const parsedDate = new Date(`${date}T00:00:00`);

		if (Number.isNaN(parsedDate.getTime())) {
			return String(date);
		}

		return parsedDate.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	// Formats a label
	function formatLabel(value) {
		const text = String(value || '').trim();

		if (!text) {
			return '';
		}

		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	// Builds searchable text
	function buildTaskSearchText(task) {
		const tags = Array.isArray(task.tags) ? task.tags.join(' ') : '';
		const links = Array.isArray(task.links)
			? task.links.map((link) => `${link.label || ''} ${link.url || ''}`).join(' ')
			: '';

		return [
			task.title || '',
			task.description || '',
			task.date || '',
			task.category || '',
			task.priority || '',
			tags,
			links,
		]
			.join(' ')
			.toLowerCase();
	}

	// Filters and sorts tasks
	function getVisibleTasks() {
		const searchText = taskSearch.value.trim().toLowerCase();

		return tasks
			.filter((task) => {
				const matchesSearch = !searchText || buildTaskSearchText(task).includes(searchText);
				const matchesCategory = categoryFilter.value === 'all' || task.category === categoryFilter.value;
				const matchesPriority = priorityFilter.value === 'all' || task.priority === priorityFilter.value;
				const matchesFavorite = !favoritesOnly || task.favorite;

				return matchesSearch && matchesCategory && matchesPriority && matchesFavorite;
			})
			.sort((firstTask, secondTask) => {
				if (firstTask.favorite !== secondTask.favorite) {
					return firstTask.favorite ? -1 : 1;
				}

				if (sortTasks.value === 'title') {
					return String(firstTask.title).localeCompare(String(secondTask.title));
				}

				return String(firstTask.date).localeCompare(String(secondTask.date));
			});
	}

	// Shows an empty message
	function renderEmptyState() {
		taskList.innerHTML = `
			<div class="alert alert-light text-center" role="status">
				No tasks found
			</div>
		`;
	}

	// Adds task tags
	function renderTags(tags, tagArea) {
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
	function renderLinks(links, linkArea) {
		linkArea.innerHTML = '';

		if (!Array.isArray(links)) {
			return;
		}

		links.forEach((link) => {
			if (!link.url) {
				return;
			}

			const taskLink = document.createElement('a');
			taskLink.className = 'btn btn-sm btn-outline-secondary me-2 mt-2';
			taskLink.href = link.url;
			taskLink.target = '_blank';
			taskLink.rel = 'noopener noreferrer';
			taskLink.textContent = link.label || 'Open Link';
			linkArea.appendChild(taskLink);
		});
	}

	// Displays task cards
	function renderTasks() {
		const visibleTasks = getVisibleTasks();

		taskList.innerHTML = '';

		if (!visibleTasks.length) {
			renderEmptyState();
			return;
		}

		visibleTasks.forEach((task) => {
			const taskCard = taskTemplate.content.cloneNode(true);
			const card = taskCard.querySelector('.task-card');

			card.dataset.taskId = task.id;
			card.classList.toggle('is-favorite', Boolean(task.favorite));

			taskCard.querySelector('[data-field="title"]').textContent = task.title || 'Untitled Task';
			taskCard.querySelector('[data-field="description"]').textContent = task.description || '';
			taskCard.querySelector('[data-field="category"]').textContent = formatLabel(task.category);
			taskCard.querySelector('[data-field="priority"]').textContent = formatLabel(task.priority);
			taskCard.querySelector('[data-field="date"]').textContent = `Due ${formatDate(task.date)}`;

			taskCard.querySelector('[data-field="favorite-icon"]').className = task.favorite
				? 'bi bi-star-fill'
				: 'bi bi-star';

			taskCard.querySelector('[data-field="edit-link"]').href =
				`pages/form.html?editId=${encodeURIComponent(task.id)}`;

			renderTags(task.tags, taskCard.querySelector('[data-field="tags"]'));
			renderLinks(task.links, taskCard.querySelector('[data-field="links"]'));

			taskList.appendChild(taskCard);
		});
	}

	// Updates favorites and edits
	function handleTaskClick(event) {
		const button = event.target.closest('[data-action]');

		if (!button) {
			return;
		}

		const card = button.closest('[data-task-id]');

		if (!card) {
			return;
		}

		const task = tasks.find((item) => String(item.id) === String(card.dataset.taskId));

		if (!task) {
			return;
		}

		if (button.dataset.action === 'favorite') {
			task.favorite = !task.favorite;
		}

		if (button.dataset.action === 'save-edit') {
			task.title = card.querySelector('[data-field="title"]').textContent.trim();
			task.description = card.querySelector('[data-field="description"]').textContent.trim();
		}

		saveAllTasks(tasks);
		renderTasks();
	}

	// Signs user out
	function handleLogout() {
		window.taskBuddyAuth.clearSession();
		window.location.assign(window.taskBuddyAuth.buildAppUrl('pages/auth.html'));
	}

	// Creates command to show tasks in console
	window.showTaskData = function showTaskData() {
		console.table(readStoredTasks());
	};

	$('#taskSearch').on('input', renderTasks);

	categoryFilter.addEventListener('change', renderTasks);
	priorityFilter.addEventListener('change', renderTasks);
	sortTasks.addEventListener('change', renderTasks);
	taskList.addEventListener('click', handleTaskClick);

	favoritesButton.addEventListener('click', () => {
		favoritesOnly = !favoritesOnly;
		favoritesButton.classList.toggle('is-active', favoritesOnly);
		renderTasks();
	});

	if (logoutButton) {
		logoutButton.addEventListener('click', handleLogout);
	}

	seedTasksFromInternalData().finally(() => {
		tasks = readStoredTasks();
		ensureTaskIds(tasks);
		renderTasks();
	});
})();