const defaultDepartments = [
  "Chorale",
  "Intercession",
  "Accueil",
  "Médias",
  "DLB",
  "DCC",
  "DFF"
];

const appState = {
  members: [],
  departments: [],
  events: [],
  attendances: []
};

function loadArray(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveData() {
  localStorage.setItem("members", JSON.stringify(appState.members));
  localStorage.setItem("departments", JSON.stringify(appState.departments));
  localStorage.setItem("events", JSON.stringify(appState.events));
  localStorage.setItem("attendances", JSON.stringify(appState.attendances));
}

function initializeData() {
  appState.members = loadArray("members").map((member) => ({
    ...member,
    role: member.role || "user"
  }));
  appState.departments = loadArray("departments");
  appState.events = loadArray("events");
  appState.attendances = loadArray("attendances");
  if (!appState.departments.length) {
    appState.departments = [...defaultDepartments];
  }
  saveData();
}

function generateId(collection) {
  if (!collection.length) return 1;
  return Math.max(...collection.map((item) => item.id)) + 1;
}

initializeData();

window.appState = appState;
window.defaultDepartments = defaultDepartments;
window.saveData = saveData;
window.generateId = generateId;
window.initializeData = initializeData;

