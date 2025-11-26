function computePresenceRate(attendanceList) {
  if (!attendanceList.length) return "0 %";
  const presentCount = attendanceList.filter((entry) => entry.status === "P").length;
  return `${Math.round((presentCount / attendanceList.length) * 100)} %`;
}

function updateDashboard() {
  const { members, departments, events, attendances } = window.appState;
  document.getElementById("stat-members").textContent = members.length;
  document.getElementById("stat-depts").textContent = departments.length;
  document.getElementById("stat-events").textContent = events.length;
  document.getElementById("stat-attendance").textContent = computePresenceRate(attendances);
  const container = document.getElementById("attendanceByDepartment");
  container.innerHTML = "";
  departments.forEach((dept) => {
    const deptMemberIds = members.filter((member) => member.dept === dept).map((member) => member.id);
    const deptAttendances = attendances.filter((att) => deptMemberIds.includes(att.memberId));
    const rate = computePresenceRate(deptAttendances);
    const line = document.createElement("p");
    line.innerHTML = `<strong>${dept}</strong> : ${rate}`;
    container.appendChild(line);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  auth.initRoleControls({
    roleSelectId: "roleSelect",
    deptSelectId: "responsableDeptSelect",
    deptContainerSelector: ".role-extra",
    navSelector: ".nav a",
    notificationId: "notifications"
  });
  updateDashboard();
  auth.registerRoleListener(() => {
    updateDashboard();
  });
});

