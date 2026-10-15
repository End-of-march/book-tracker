const STORAGE_KEY = "book-tracker-books";
const STATUSES = ["To read", "Reading", "Finished"];

const form = document.getElementById("book-form");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const statusInput = document.getElementById("status");
const searchInput = document.getElementById("search");
const list = document.getElementById("book-list");
const emptyMsg = document.getElementById("empty");
const counts = document.createElement("p");
counts.id = "book-counts";
counts.className = "counts";
counts.setAttribute("role", "status");
searchInput.before(counts);

let books = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function setError(input, message) {
  document.getElementById(input.id + "-error").textContent = message;
  input.classList.toggle("invalid", Boolean(message));
}

function closeAllMenus() {
  list.querySelectorAll("li.menu-open").forEach((li) =>
    li.classList.remove("menu-open")
  );
}

function labeledField(labelText, element) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const label = document.createElement("label");
  label.textContent = labelText;
  label.htmlFor = element.id;
  wrap.append(label, element);
  return wrap;
}

function makeMenuButton(text, onClick, extraClass) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  if (extraClass) b.classList.add(extraClass);
  b.addEventListener("click", onClick);
  return b;
}

function buildPanelActions(li, panel, onSubmit) {
  const actions = document.createElement("div");
  actions.className = "panel-actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.className = "cancel";
  cancel.addEventListener("click", () => {
    li.classList.remove("panel-open");
    panel.hidden = true;
  });
  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = "Save";
  actions.append(cancel, saveBtn);
  panel.appendChild(actions);
  panel.addEventListener("submit", (e) => {
    e.preventDefault();
    onSubmit();
  });
}

function buildEditPanel(li, book) {
  const panel = document.createElement("form");
  panel.className = "panel";
  panel.hidden = true;

  const title = document.createElement("input");
  title.type = "text";
  title.id = "edit-title-" + book.id;
  title.value = book.title;
  const titleError = document.createElement("p");
  titleError.className = "error";
  titleError.id = title.id + "-error";

  const author = document.createElement("input");
  author.type = "text";
  author.id = "edit-author-" + book.id;
  author.value = book.author;
  const authorError = document.createElement("p");
  authorError.className = "error";
  authorError.id = author.id + "-error";

  panel.append(
    labeledField("Title", title),
    titleError,
    labeledField("Author", author),
    authorError
  );

  buildPanelActions(li, panel, () => {
    const t = title.value.trim();
    const a = author.value.trim();
    setError(title, t ? "" : "Please enter a title.");
    setError(author, a ? "" : "Please enter an author.");
    if (!t || !a) return;
    book.title = t;
    book.author = a;
    save();
    render();
  });

  [title, author].forEach((input) =>
    input.addEventListener("input", () => {
      if (input.value.trim()) setError(input, "");
    })
  );

  return panel;
}

function buildDetailsPanel(li, book) {
  const panel = document.createElement("form");
  panel.className = "panel";
  panel.hidden = true;

  const genre = document.createElement("input");
  genre.type = "text";
  genre.id = "details-genre-" + book.id;
  genre.value = book.genre || "";
  genre.placeholder = "e.g. Science fiction";

  const rating = document.createElement("select");
  rating.id = "details-rating-" + book.id;
  ["", "1", "2", "3", "4", "5"].forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v ? v + " / 5" : "No rating";
    rating.appendChild(o);
  });
  if (book.rating) rating.value = String(book.rating);

  const start = document.createElement("input");
  start.type = "date";
  start.id = "details-start-" + book.id;
  start.value = book.startDate || "";

  const finish = document.createElement("input");
  finish.type = "date";
  finish.id = "details-finish-" + book.id;
  finish.value = book.finishDate || "";

  const notes = document.createElement("textarea");
  notes.id = "details-notes-" + book.id;
  notes.rows = 3;
  notes.placeholder = "Notes";
  notes.value = book.notes || "";

  panel.append(
    labeledField("Genre", genre),
    labeledField("Rating", rating),
    labeledField("Start date", start),
    labeledField("Finish date", finish),
    labeledField("Notes", notes)
  );

  buildPanelActions(li, panel, () => {
    book.genre = genre.value.trim();
    book.rating = rating.value;
    book.startDate = start.value;
    book.finishDate = finish.value;
    book.notes = notes.value.trim();
    save();
    render();
  });

  return panel;
}

function render() {
  const count = (status) => books.filter((book) => book.status === status).length;
  counts.textContent = `${count("Finished")} finished, ${count("To read")} to read, ${count("Reading")} reading`;
  const q = searchInput.value.trim().toLowerCase();
  const shown = books
    .filter((b) => (b.title + " " + b.author).toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);

  list.innerHTML = "";
  shown.forEach((book) => {
    const li = document.createElement("li");
    li.dataset.status = book.status;

    const body = document.createElement("div");
    body.className = "card-body";

    const info = document.createElement("div");
    info.className = "info";
    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    const t = document.createElement("div");
    t.className = "book-title";
    t.textContent = book.title;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = book.status;
    titleRow.append(t, badge);
    const a = document.createElement("div");
    a.className = "book-author";
    a.textContent = book.author;
    info.append(titleRow, a);

    const parts = [];
    if (book.genre) parts.push(book.genre);
    if (book.rating) parts.push("★ " + book.rating + " / 5");
    if (book.startDate) parts.push("Started " + book.startDate);
    if (book.finishDate) parts.push("Finished " + book.finishDate);
    if (parts.length) {
      const d = document.createElement("div");
      d.className = "details";
      d.textContent = parts.join(" · ");
      info.appendChild(d);
    }
    if (book.notes) {
      const n = document.createElement("div");
      n.className = "notes";
      n.textContent = book.notes;
      info.appendChild(n);
    }
    body.appendChild(info);

    const editPanel = buildEditPanel(li, book);
    const detailsPanel = buildDetailsPanel(li, book);
    body.append(editPanel, detailsPanel);

    const menu = document.createElement("div");
    menu.className = "menu";

    const statusOptions = document.createElement("div");
    statusOptions.className = "status-options";
    statusOptions.hidden = true;
    STATUSES.forEach((s) => {
      statusOptions.appendChild(
        makeMenuButton(
          s,
          () => {
            book.status = s;
            save();
            render();
          },
          s === book.status ? "current" : null
        )
      );
    });

    const openPanel = (panel) => {
      editPanel.hidden = panel !== editPanel;
      detailsPanel.hidden = panel !== detailsPanel;
      li.classList.add("panel-open");
      li.classList.remove("menu-open");
    };

    menu.append(
      makeMenuButton("Change status", () => {
        statusOptions.hidden = !statusOptions.hidden;
      }, "status-toggle"),
      statusOptions,
      makeMenuButton("Edit", () => openPanel(editPanel)),
      makeMenuButton("Add details", () => openPanel(detailsPanel)),
      makeMenuButton("Delete", () => {
        if (confirm('Delete "' + book.title + '"?')) {
          books = books.filter((b) => b.id !== book.id);
          save();
          render();
        }
      }, "danger")
    );

    li.append(body, menu);
    list.appendChild(li);

    // Long press opens the menu (phones); a quick touch does not.
    let pressTimer = null;
    li.addEventListener(
      "touchstart",
      () => {
        pressTimer = setTimeout(() => li.classList.add("menu-open"), 400);
      },
      { passive: true }
    );
    ["touchend", "touchmove", "touchcancel"].forEach((ev) =>
      li.addEventListener(ev, () => clearTimeout(pressTimer))
    );
    // A long touch also opens the browser's own menu; show ours instead.
    li.addEventListener("contextmenu", (e) => {
      if (window.matchMedia("(hover: none)").matches) {
        e.preventDefault();
        li.classList.add("menu-open");
      }
    });
  });

  emptyMsg.hidden = shown.length > 0;
  emptyMsg.textContent = books.length ? "No books match your search." : "No books yet.";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  setError(titleInput, title ? "" : "Please enter a title.");
  setError(authorInput, author ? "" : "Please enter an author.");
  if (!title || !author) return;

  books.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    title,
    author,
    status: statusInput.value,
    createdAt: Date.now(),
  });
  save();
  form.reset();
  render();
  titleInput.focus();
});

[titleInput, authorInput].forEach((input) =>
  input.addEventListener("input", () => {
    if (input.value.trim()) setError(input, "");
  })
);

searchInput.addEventListener("input", render);

// Tap or click anywhere outside a book closes its menu.
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest("#book-list li")) closeAllMenus();
});

render();
