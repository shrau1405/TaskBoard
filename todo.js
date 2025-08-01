// Load tasks and sticky notes from localStorage, or initialize as empty arrays if none exist
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let stickyNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];

// Load active filter view (e.g., 'home', 'today', etc.) from localStorage, or default to 'home'
let activeFilter = { view: localStorage.getItem('activeView') || 'home' };

// Save updated task list to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Save updated sticky note list to localStorage
function saveStickyNotes() {
  localStorage.setItem('stickyNotes', JSON.stringify(stickyNotes));
}

// Save the current active view (filter) to localStorage
function saveActiveView(view) {
  localStorage.setItem('activeView', view);
}

// Add a new task when the form is submitted
// Add a new task when the form is submitted
function addTask() {
  // Get task description and due date input values
  const textInput = document.getElementById('taskInput');
  const dateInput = document.getElementById('dueDateInput');

  // Get selected time and list category from radio buttons
  const time = document.querySelector('input[name="taskTime"]:checked')?.value;
  const list = document.querySelector('input[name="taskList"]:checked')?.value;

  // Get the error message display element
  const errorMsg = document.getElementById('errorMessage');

  // Clear any previous error
  errorMsg.style.display = 'none';
  errorMsg.textContent = '';

  // Validate: if task description is empty
  if (!textInput.value.trim()) {
    errorMsg.textContent = "Please enter a task";
    errorMsg.style.display = 'block';
    return;
  }

  // Validate: if time or list category is not selected
  if (!time || !list) {
    errorMsg.textContent = "Please select all categories";
    errorMsg.style.display = 'block';
    return;
  }

  // Add new task to the task list
  tasks.push({
    id: Date.now(),                   // Unique identifier based on timestamp
    text: textInput.value.trim(),    // Trimmed task text
    completed: false,                // Default status
    time,                            // Selected time category (e.g., Today, Upcoming)
    list,                            // Selected list (e.g., Personal, Work)
    dueDate: dateInput.value || ''   // Optional due date
  });

  // Clear input fields and uncheck radio buttons
  textInput.value = '';
  dateInput.value = '';
  document.querySelectorAll('input[name="taskTime"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="taskList"]').forEach(r => r.checked = false);

  // Save updated task list and re-render the UI
  saveTasks();
  renderTasks(); // Function that displays tasks on the page
}

// Toggle task completion status by ID
function toggleComplete(id) {
  // Flip the 'completed' status of the task with matching ID
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);

  // Save updated tasks and re-render the list
  saveTasks();
  renderTasks();
}

// Delete a task by ID
function deleteTask(id) {
  // Filter out the task with the given ID
  tasks = tasks.filter(t => t.id !== id);

  // Save updated tasks and re-render the list
  saveTasks();
  renderTasks();
}

// Switch a task into edit mode by ID
function editTask(id) {
  // Find the <li> element associated with this task
  const li = document.querySelector(`li[data-id="${id}"]`);

  // Find the actual task object in the task array
  const task = tasks.find(t => t.id === id);

  // Exit if task or list item is not found
  if (!task || !li) return;

  // Replace the task's HTML content with input fields and Save/Cancel buttons
  li.innerHTML = `
    <input type="text" value="${task.text}" class="edit-text"/>
    <input type="text" value="${task.dueDate || ''}" class="edit-date" placeholder="Enter due date"/>
    <div class="task-buttons">
      <button onclick="saveEdit(${id})">Save</button>
      <button onclick="renderTasks()">Cancel</button>
    </div>
  `;
}

// Save edited task content by ID
function saveEdit(id) {
  // Get the edited list item
  const li = document.querySelector(`li[data-id="${id}"]`);

  // Get new values from input fields
  const newText = li.querySelector('.edit-text').value.trim();
  const newDate = li.querySelector('.edit-date').value;

  // Prevent saving if the text is empty
  if (!newText) {
    alert("Task text cannot be empty.");
    return;
  }

  // Update the matching task with new values
  tasks = tasks.map(t => t.id === id ? { ...t, text: newText, dueDate: newDate } : t);

  // Save updated tasks and refresh the view
  saveTasks();
  renderTasks();
}

// Set the current view/filter (e.g. home, today, upcoming, personal, work, sticky)
function setFilter(filter) {
  // Save active view in memory and localStorage
  activeFilter.view = filter;
  saveActiveView(filter);

  // Make sure the main section is visible
  const main = document.querySelector('.main');
  main.style.display = 'block';

  // Update main heading text based on selected filter
  document.getElementById('main-heading').textContent =
    filter === 'home' ? 'Home' :
    filter === 'sticky' ? 'Sticky Wall' :
    filter.charAt(0).toUpperCase() + filter.slice(1); // Capitalize first letter

  // Hide all sections initially
  document.getElementById('taskInputSection').style.display = 'none';
  document.getElementById('taskList').style.display = 'none';
  document.getElementById('stickyWall').style.display = 'none';

  if (filter === 'sticky') {
    // Show sticky notes section
    showStickyWall();
  } else {
    // Reset filter selections and show tasks
    resetRadioSelection(filter);
    renderTasks();
  }
}

// Reset task category radio buttons and show/hide input area accordingly
function resetRadioSelection(filter) {
  // Show input section only for 'home' view
  document.getElementById('taskInputSection').style.display = filter === 'home' ? 'block' : 'none';

  // Show task list section
  document.getElementById('taskList').style.display = 'block';

  // Uncheck all category radio buttons
  document.querySelectorAll('input[name="taskTime"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="taskList"]').forEach(r => r.checked = false);
}

// Render tasks based on current view, category filters, and search query
function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = ''; // Clear existing tasks

  const query = document.getElementById('searchBar').value.trim().toLowerCase(); // Get search query

  const taskInputSection = document.getElementById('taskInputSection');

  // Hide input section if searching; otherwise, show only for 'home'
  taskInputSection.style.display = query ? 'none' : (activeFilter.view === 'home' ? 'block' : 'none');

  list.style.display = 'block';

  // Filter tasks by view and search
  tasks
    .filter(t => {
      if (activeFilter.view === 'today' && t.time !== 'today') return false;
      if (activeFilter.view === 'upcoming' && t.time !== 'upcoming') return false;
      if (activeFilter.view === 'personal' && t.list !== 'personal') return false;
      if (activeFilter.view === 'work' && t.list !== 'work') return false;
      if (query && !t.text.toLowerCase().includes(query)) return false;
      return true;
    })
    .forEach(task => {
      // Create task list item
      const li = document.createElement('li');
      li.setAttribute('data-id', task.id);
      li.className = 'task ' + task.list + (task.completed ? ' completed' : '');

      // Show manual due date if provided
      const dateDisplay = task.dueDate
        ? `<span class="due-date">Due: ${task.dueDate}</span>`
        : '';

      // Set inner HTML for the task item
      li.innerHTML = `
        <label><input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})"/></label>
        <span>${task.text}</span>
        ${dateDisplay}
        <div class="task-buttons">
          <button onclick="editTask(${task.id})">Edit</button>
          <button onclick="deleteTask(${task.id})">Delete</button>
        </div>
      `;

      // Append task to the list
      list.appendChild(li);
    });
}


// Format date from YYYY-MM-DD to DD-MM-YYYY
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
}

// Re-render tasks as user types in the search bar
document.getElementById('searchBar').addEventListener('input', renderTasks);

// Define an array of rotating background colors for sticky notes
const stickyColors = ['#FFF9AE', '#D3F8E2', '#FFD3D3', '#D0E1FF'];

// Render all sticky notes on the sticky wall
function showStickyWall() {
  const wall = document.getElementById('stickyWall'); // Sticky wall container
  const container = document.getElementById('stickyNotesContainer'); // Inner notes holder

  wall.style.display = 'block'; // Make sticky wall visible
  container.innerHTML = '';     // Clear previous notes

  stickyNotes.forEach((note) => {
    // Create wrapper for each sticky note
    const noteWrapper = document.createElement('div');
    noteWrapper.className = 'sticky-wrapper';

    // Create textarea for note content
    const textarea = document.createElement('textarea');
    textarea.className = 'sticky-note';
    textarea.placeholder = 'Write something...';
    textarea.value = note.text;
    textarea.style.backgroundColor = note.color;

    // Save changes on typing
    textarea.addEventListener('input', () => {
      const targetNote = stickyNotes.find(n => n.id === note.id);
      if (targetNote) {
        targetNote.text = textarea.value;
        saveStickyNotes();
      }
    });

    // Create delete button with trash icon
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sticky-delete';
    deleteBtn.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/3096/3096673.png" alt="delete">`;

    // Delete note on click
    deleteBtn.onclick = () => {
      stickyNotes = stickyNotes.filter(n => n.id !== note.id);
      saveStickyNotes();
      showStickyWall(); // Refresh UI
    };

    // Add textarea and delete button to wrapper
    noteWrapper.appendChild(textarea);
    noteWrapper.appendChild(deleteBtn);

    // Add note wrapper to container
    container.appendChild(noteWrapper);
  });
}

// Setup the sticky wall by binding click to Add Note button
function setupStickyWall() {
  document.getElementById('addStickyBtn').addEventListener('click', () => {
    // Cycle through predefined colors for each new note
    const nextColor = stickyColors[stickyNotes.length % stickyColors.length];

    // Add new empty note
    stickyNotes.push({ id: Date.now(), text: '', color: nextColor });

    saveStickyNotes();
    showStickyWall(); // Re-render wall
  });
}

// Run on page load
window.onload = () => {
  setupStickyWall(); // Set up sticky note add functionality

  // Restore and set the last active view (e.g., home, sticky, today)
  const savedView = localStorage.getItem('activeView') || 'home';
  setFilter(savedView);
};
function openDatePicker() {
  const dateInput = document.getElementById('dueDateInput');
  dateInput.focus();
  dateInput.click(); // Triggers the native date picker
}

