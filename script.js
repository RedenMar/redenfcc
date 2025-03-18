document.addEventListener('DOMContentLoaded', () => {
    const setsContainer = document.getElementById("sets-container");
    const searchInput = document.getElementById("search"); 
    const addSetButton = document.getElementById("add-set");
    const importButton = document.getElementById("import");
    const exportButton = document.getElementById("export");
    const homeBtn = document.getElementById("home");

    let flashcardSets = JSON.parse(localStorage.getItem("flashcardSets")) || [];

   

    function saveToLocalStorage() {
        localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));
    }
    function renderSets(filter = "") {
        setsContainer.innerHTML = "";
        flashcardSets.forEach((set, index) => {
            if (set.title.toLowerCase().includes(filter.toLowerCase())) {
                const setElement = document.createElement("div");
                setElement.classList.add("flashcard-set");
                setElement.dataset.index = index;
    
                setElement.innerHTML = `
                    <button class="delete-set" data-index="${index}">Delete</button>
                    <button class="edit-set" data-index="${index}">Edit</button>
                    <img src="greenbook.png" alt="Set Icon" class="set-image">
                    <h3 class="set-title">${set.title}</h3>
                `;
    
                setsContainer.appendChild(setElement);
    
                setElement.querySelector(".edit-set").addEventListener("click", (event) => {
                    event.stopPropagation();
                    editSetTitle(index, setElement);
                });
    
                setElement.querySelector(".delete-set").addEventListener("click", (event) => {
                    event.stopPropagation();
                    deleteSet(index);
                });
    
                setElement.addEventListener("click", () => openSet(index));
            }
        });
    }
    function deleteSet(index) {
        showConfirmationDialog("Are you sure you want to delete this set?", () => {
            flashcardSets.splice(index, 1); 
            saveToLocalStorage(); 
            renderSets(); 
        });
    }
    function editSetTitle(index, setElement) {
        const titleElement = setElement.querySelector(".set-title");
    
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.value = flashcardSets[index].title;
        inputField.classList.add("edit-input");
    
        setElement.replaceChild(inputField, titleElement);
        inputField.focus();
    
        inputField.addEventListener("blur", saveTitle);
        inputField.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                saveTitle();
            }
        });
    
        function saveTitle() {
            let newTitle = inputField.value.trim();
            if (newTitle !== "") {
                flashcardSets[index].title = newTitle;
                saveToLocalStorage();
                renderSets(); 
            }
        }
    }
    homeBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    searchInput.addEventListener("input", () => {
        renderSets(searchInput.value);
    });
    searchInput.addEventListener("focus", () => {
        searchInput.placeholder = ""; 
    });
    
    searchInput.addEventListener("blur", () => {
        searchInput.placeholder = "🔍| Search";
    });
let draggedSet = null;
let placeholder = null;
let pressTimer;
let originalIndex = null;

document.addEventListener("mousedown", (event) => {
    const setElement = event.target.closest(".flashcard-set");
    if (!setElement) return;

    pressTimer = setTimeout(() => {
        setElement.classList.add("grabbable");
        startDragging(setElement);
    }, 300);
});

document.addEventListener("mouseup", () => {
    clearTimeout(pressTimer);
    if (draggedSet) stopDragging();
    
    document.querySelectorAll(".flashcard-set").forEach(set => {
        set.classList.remove("grabbable"); 
    });
});
function startDragging(setElement) {
    draggedSet = setElement;
    draggedSet.classList.add("dragging");
    originalIndex = [...setsContainer.children].indexOf(draggedSet);

    placeholder = document.createElement("div");
    placeholder.classList.add("flashcard-set", "placeholder");
    setsContainer.insertBefore(placeholder, draggedSet.nextSibling);

    document.addEventListener("mousemove", onDragMove);
}

function onDragMove(event) {
    event.preventDefault();
    if (!draggedSet) return;

    draggedSet.style.position = "absolute";
    draggedSet.style.zIndex = "1000";
    draggedSet.style.left = `${event.pageX - draggedSet.offsetWidth / 2}px`;
    draggedSet.style.top = `${event.pageY - draggedSet.offsetHeight / 2}px`;

    const sets = [...setsContainer.children].filter(set => set !== draggedSet && set !== placeholder);
    let closestSet = null;
    let minDistance = Infinity;

    sets.forEach(set => {
        const rect = set.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));

        if (distance < minDistance) {
            minDistance = distance;
            closestSet = set;
        }
    });

    if (closestSet && closestSet !== placeholder) {
        setsContainer.insertBefore(placeholder, closestSet);
    } 

   
    if (event.clientY > setsContainer.lastElementChild.getBoundingClientRect().bottom) {
        setsContainer.appendChild(placeholder);
    }

    //animateSetMovement();
}
function animateSetMovement() {
    document.querySelectorAll(".flashcard-set:not(.dragging)").forEach(set => {
        const rect = set.getBoundingClientRect();
        set.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
        set.style.transform = `translate(${rect.left - set.offsetLeft}px, ${rect.top - set.offsetTop}px)`;
    });

    setTimeout(() => {
        document.querySelectorAll(".flashcard-set").forEach(set => {
            set.style.transition = "";
            set.style.transform = "";
        });
    }, 300);
}

function stopDragging() {
    draggedSet.classList.remove("dragging");
    draggedSet.style.position = "";
    draggedSet.style.zIndex = "";
    draggedSet.style.left = "";
    draggedSet.style.top = "";

    if (placeholder) {
        setsContainer.insertBefore(draggedSet, placeholder);
        placeholder.remove();
    }

    draggedSet = null;
    saveSetOrder(); 
    document.removeEventListener("mousemove", onDragMove);
}

function getClosestSet(x, y) {
    return [...setsContainer.querySelectorAll(".flashcard-set:not(.dragging)")].reduce((closest, set) => {
        const box = set.getBoundingClientRect();
        const offset = Math.abs(y - box.top) + Math.abs(x - box.left);
        return offset < closest.offset ? { offset, element: set } : closest;
    }, { offset: Number.POSITIVE_INFINITY }).element;
}
    function addSet() {
        showInputForm("Enter set name:", (title) => {
            if (title.trim() !== "") {
                flashcardSets.unshift({ title, flashcards: [] });
                saveToLocalStorage();
                renderSets(searchInput.value);
            }
        });
    }
    let lastScrollTop = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    let scrollTop = window.scrollY;

    if (scrollTop > lastScrollTop) {
        header.style.top = "-60px";
    } else {
        header.style.top = "0";
    }

    lastScrollTop = scrollTop;
});
function showInputForm(title, callback) {
    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.classList.add("modal-overlay");
    modal.innerHTML = `
        <div class="set-input-form">
            <h3>${title}</h3>
            <input type="text" id="input-value" placeholder="Enter set name..." autocomplete="off">
            <div class="form-buttons">
                <button id="submit-input">Save</button>
                <button id="cancel-input">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const inputField = document.getElementById("input-value");
    const submitButton = document.getElementById("submit-input");

    
    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); 
            submitButton.click(); 
        }
    });

    submitButton.addEventListener("click", () => {
        const value = inputField.value.trim();
        if (value) {
            callback(value);
            modal.remove();
        }
    });

    document.getElementById("cancel-input").addEventListener("click", () => {
        modal.remove();
    });

    inputField.focus();
}
    
    function showConfirmationDialog(message, onConfirm) {
        const existingModal = document.querySelector(".modal-overlay");
        if (existingModal) existingModal.remove();
    
        const modal = document.createElement("div");
        modal.classList.add("modal-overlay");
        modal.innerHTML = `
            <div class="confirmation-box">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button id="confirm-delete">Yes, Delete</button>
                    <button id="cancel-delete">Cancel</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
    
        document.getElementById("confirm-delete").addEventListener("click", () => {
            onConfirm();
            modal.remove();
        });
    
        document.getElementById("cancel-delete").addEventListener("click", () => {
            modal.remove();
        });
    }
    function openSet(index) {
        localStorage.setItem("currentSetIndex", index);
        window.location.href = "flashcards.html";
    }

    addSetButton.addEventListener("click", addSet);

exportButton.addEventListener("click", () => {
    if (flashcardSets.length === 0) {
        alert("No sets available to export.");
        return;
    }

    alert("Click on a set to export it. You can scroll to find the set you want.");

    document.body.style.overflow = "auto"; 

    document.querySelectorAll(".flashcard-set").forEach((setElement, index) => {
        setElement.classList.add("export-mode"); 

        setElement.addEventListener("click", function exportHandler() {
            exportSet(index); 
            setElement.classList.remove("export-mode"); 

            document.querySelectorAll(".flashcard-set").forEach(set => 
                set.removeEventListener("click", exportHandler)
            );
        }, { once: true }); 
    });
});

function exportSet(index) {
    const setToExport = flashcardSets[index];

   
    const blob = new Blob([JSON.stringify(setToExport, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${setToExport.title.replace(/\s+/g, "_")}.json`;

    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link); 
}
  const importFileInput = document.getElementById("import-file");

importButton.addEventListener("click", () => {
    importFileInput.click(); 
});

importFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedSet = JSON.parse(e.target.result);

            if (!importedSet.title || !Array.isArray(importedSet.flashcards)) {
                alert("Invalid file format. Make sure you're importing a valid flashcard set.");
                return;
            }
            flashcardSets.unshift(importedSet);
            saveToLocalStorage();
            renderSets();
        } catch (error) {
            alert("Error reading file. Please try again.");
        }
    };
    reader.readAsText(file);
});

    renderSets();
});