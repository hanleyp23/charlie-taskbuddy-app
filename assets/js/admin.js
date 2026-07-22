(() => {
	if (!window.taskBuddyAuth || !window.taskBuddyAuth.requireAuth()) {
		return;
	}

	const STORAGE_KEY = 'taskRecords';
	const profileName = document.getElementById('profileName');
	const logoutButton = document.getElementById('logoutBtn');
	const localStorageData = document.getElementById('localStorageData');
	const sessionStorageData = document.getElementById('sessionStorageData');
	const savedTaskData = document.getElementById('savedTaskData');
	const currentDateTime = document.getElementById('currentDateTime');
	const browserInfo = document.getElementById('browserInfo');
	const ipAddress = document.getElementById('ipAddress');

	if (!localStorageData || !sessionStorageData || !savedTaskData || !currentDateTime || !browserInfo || !ipAddress) {
		return;
	}

	if (profileName) {
		profileName.textContent = window.taskBuddyAuth.getSessionUser() || 'User';
	}

	// Reads browser storage
	function readStorage(storageArea) {
		const data = {};

		for (let index = 0; index < storageArea.length; index += 1) {
			const key = storageArea.key(index);
			data[key] = storageArea.getItem(key);
		}

		return data;
	}

	// Displays admin data
	function renderAdminData() {
		const savedTasks = localStorage.getItem(STORAGE_KEY);

		localStorageData.textContent = JSON.stringify(readStorage(localStorage), null, 2);
		sessionStorageData.textContent = JSON.stringify(readStorage(sessionStorage), null, 2);
		browserInfo.textContent = navigator.userAgent;

		try {
			savedTaskData.textContent = savedTasks
				? JSON.stringify(JSON.parse(savedTasks), null, 2)
				: 'No saved tasks';
		} catch (error) {
			savedTaskData.textContent = savedTasks || 'No saved tasks';
		}
	}

	// Updates date and time
	function updateDateTime() {
		currentDateTime.textContent = new Date().toLocaleString();
	}

	// Loads IP address
	async function loadIpAddress() {
		try {
			const response = await fetch('https://api64.ipify.org?format=json');

			if (!response.ok) {
				return;
			}

			const data = await response.json();
			ipAddress.textContent = data.ip;
		} catch (error) {
			ipAddress.textContent = 'Unavailable';
		}
	}

	// Signs user out
	function handleLogout() {
		window.taskBuddyAuth.clearSession();
		window.location.assign(window.taskBuddyAuth.buildAppUrl('pages/auth.html'));
	}

	renderAdminData();
	updateDateTime();
	loadIpAddress();

	if (logoutButton) {
		logoutButton.addEventListener('click', handleLogout);
	}
})();