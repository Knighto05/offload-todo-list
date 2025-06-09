class ZenTasks {
  constructor() {
      this.tasks = this.loadTasks();
      this.currentFilter = 'all';
      this.currentProject = '';
      this.initializeElements();
      this.bindEvents();
      this.render();
  }

  initializeElements() {
      this.taskInput = document.getElementById('taskInput');
      this.projectInput = document.getElementById('projectInput');
      this.tagsInput = document.getElementById('tagsInput');
      this.addBtn = document.getElementById('addBtn');
      this.tasksContainer = document.getElementById('tasksContainer');
      this.projectFilter = document.getElementById('projectFilter');
      this.filterButtons = document.querySelectorAll('.filter-btn');
  }

  bindEvents() {
      this.addBtn.addEventListener('click', () => this.addTask());
      this.taskInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.addTask();
      });

      this.filterButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
              this.filterButtons.forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              this.currentFilter = e.target.dataset.filter;
              this.render();
          });
      });

      this.projectFilter.addEventListener('change', (e) => {
          this.currentProject = e.target.value;
          this.render();
      });
  }

  addTask() {
      const text = this.taskInput.value.trim();
      if (!text) return;

      const project = this.projectInput.value.trim() || 'General';
      const tags = this.tagsInput.value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);

      const task = {
          id: Date.now(),
          text,
          project,
          tags,
          completed: false,
          createdAt: new Date().toISOString()
      };

      this.tasks.push(task);
      this.saveTasks();
      this.render();
      this.clearInputs();
  }

  clearInputs() {
      this.taskInput.value = '';
      this.projectInput.value = '';
      this.tagsInput.value = '';
      this.taskInput.focus();
  }

  toggleTask(id) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
          task.completed = !task.completed;
          this.saveTasks();
          this.render();
      }
  }

  deleteTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveTasks();
      this.render();
  }

  getFilteredTasks() {
      let filtered = this.tasks;

      // Filter by completion status
      if (this.currentFilter === 'active') {
          filtered = filtered.filter(t => !t.completed);
      } else if (this.currentFilter === 'completed') {
          filtered = filtered.filter(t => t.completed);
      }

      // Filter by project
      if (this.currentProject) {
          filtered = filtered.filter(t => t.project === this.currentProject);
      }

      return filtered;
  }

  groupTasksByProject(tasks) {
      const groups = {};
      tasks.forEach(task => {
          if (!groups[task.project]) {
              groups[task.project] = [];
          }
          groups[task.project].push(task);
      });
      return groups;
  }

  render() {
      const filteredTasks = this.getFilteredTasks();
      const groupedTasks = this.groupTasksByProject(filteredTasks);
      
      this.updateProjectFilter();
      this.updateStats();

      if (filteredTasks.length === 0) {
          this.tasksContainer.innerHTML = `
              <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <h3>No tasks found</h3>
                  <p>Try adjusting your filters or add a new task.</p>
              </div>
          `;
          return;
      }

      const html = Object.entries(groupedTasks)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([project, tasks]) => {
              const taskHtml = tasks.map(task => this.renderTask(task)).join('');
              return `
                  <div class="project-section">
                      <div class="project-header">
                          <div class="project-title">
                              📁 ${project}
                              <span class="project-count">${tasks.length}</span>
                          </div>
                      </div>
                      ${taskHtml}
                  </div>
              `;
          }).join('');

      this.tasksContainer.innerHTML = html;
      this.bindTaskEvents();
  }

  renderTask(task) {
      const tagsHtml = task.tags.map(tag => 
          `<span class="tag">#${tag}</span>`
      ).join('');

      return `
          <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
              <div class="task-content">
                  <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                       data-task-id="${task.id}"></div>
                  <div class="task-details">
                      <div class="task-text">${task.text}</div>
                      <div class="task-meta">
                          ${tagsHtml}
                      </div>
                  </div>
              </div>
              <button class="delete-btn" data-task-id="${task.id}">×</button>
          </div>
      `;
  }

  bindTaskEvents() {
      // Bind checkbox toggle events
      document.querySelectorAll('.task-checkbox').forEach(checkbox => {
          checkbox.addEventListener('click', (e) => {
              const taskId = parseInt(e.target.dataset.taskId);
              this.toggleTask(taskId);
          });
      });

      // Bind delete button events
      document.querySelectorAll('.delete-btn').forEach(deleteBtn => {
          deleteBtn.addEventListener('click', (e) => {
              const taskId = parseInt(e.target.dataset.taskId);
              this.deleteTask(taskId);
          });
      });
  }

  updateProjectFilter() {
      const projects = [...new Set(this.tasks.map(t => t.project))].sort();
      const currentValue = this.projectFilter.value;
      
      this.projectFilter.innerHTML = '<option value="">All Projects</option>' +
          projects.map(project => 
              `<option value="${project}" ${project === currentValue ? 'selected' : ''}>${project}</option>`
          ).join('');
  }

  updateStats() {
      const total = this.tasks.length;
      const completed = this.tasks.filter(t => t.completed).length;
      const active = total - completed;

      document.getElementById('totalTasks').textContent = total;
      document.getElementById('activeTasks').textContent = active;
      document.getElementById('completedTasks').textContent = completed;
  }

  saveTasks() {
      try {
          localStorage.setItem('zenTasks', JSON.stringify(this.tasks));
      } catch (e) {
          console.warn('Could not save tasks:', e);
      }
  }

  loadTasks() {
      try {
          const data = localStorage.getItem('zenTasks');
          return data ? JSON.parse(data) : [];
      } catch (e) {
          console.warn('Could not load tasks:', e);
          return [];
      }
  }
}

// Initialize the app
const app = new ZenTasks();