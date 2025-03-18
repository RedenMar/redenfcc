document.addEventListener("DOMContentLoaded", () => {
    const flashcardsContainer = document.getElementById("flashcards-container");
    const shuffleButton = document.getElementById("shuffle-cards");
    const setTitle = document.getElementById("set-title");
    const startQuizButton = document.getElementById("start-quiz");
    const quizModal = document.getElementById("quiz-modal");
    const quizCard = document.querySelector(".quiz-card");
    const quizQuestion = document.getElementById("quiz-question");
    const quizAnswerText = document.getElementById("quiz-answer-text");
    const quizInput = document.getElementById("quiz-input");
    const quizSubmit = document.getElementById("quiz-submit");
    const quizNext = document.getElementById("quiz-next");
    const quizClose = document.getElementById("quiz-close");
    const reverseToggle = document.getElementById("toggle-reverse");
    const highlightModeBtn = document.getElementById("highlight-mode-btn");
    
    let highlightMode = false; // Track highlight mode state
    let quizIndex = 0;
    let flashcardSets = JSON.parse(localStorage.getItem("flashcardSets")) || [];
    let setIndex = localStorage.getItem("currentSetIndex");

    if (setIndex === null) {
        alert("No set selected!");
        window.location.href = "FlashcardProj.html";
        return;
    }
    let draggedFlashcard = null;
    let pressTimer;

    document.addEventListener("mousedown", (event) => {
        const flashcard = event.target.closest(".flashcard");
        if (!flashcard) return;

        pressTimer = setTimeout(() => {
            draggedFlashcard = flashcard;
            draggedFlashcard.setAttribute("draggable", "true");
        }, 500);
    });

    document.addEventListener("mouseup", () => {
        clearTimeout(pressTimer);
        if (draggedFlashcard) {
            draggedFlashcard.removeAttribute("draggable");
            draggedFlashcard = null;
        }
    });

    flashcardsContainer.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    flashcardsContainer.addEventListener("drop", (event) => {
        event.preventDefault();
        if (draggedFlashcard) {
            const afterElement = getDragAfterElement(flashcardsContainer, event.clientY);
            if (afterElement == null) {
                flashcardsContainer.appendChild(draggedFlashcard);
            } else {
                flashcardsContainer.insertBefore(draggedFlashcard, afterElement);
            }
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".flashcard:not([draggable='true'])")];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    setIndex = parseInt(setIndex);
    setTitle.textContent = flashcardSets[setIndex].title;
    function renderFlashcards() {
        flashcardsContainer.innerHTML = "";
        
        flashcardSets[setIndex].flashcards.forEach((flashcard, i) => {
            const card = document.createElement("div");
            card.classList.add("flashcard");
            
            card.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <p>${flashcard.question}</p>
                    </div>
                    <div class="flashcard-back">
                        <p>${Array.isArray(flashcard.answer) ? flashcard.answer.join("<br>") : flashcard.answer}</p>
                    </div>
                </div>
                <button onclick="deleteFlashcard(${i})">🗑️ Delete</button>
            `;
            

            card.addEventListener("click", () => {
                document.querySelectorAll(".flashcard").forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove("flip");
                    }
                });
            
                card.classList.toggle("flip");
            });

            flashcardsContainer.appendChild(card);
        });
    }
    let reverseMode = JSON.parse(localStorage.getItem("reverseMode")) || false;

    function renderFlashcards() {
        flashcardsContainer.innerHTML = "";
        
        flashcardSets[setIndex].flashcards.forEach((flashcard, i) => {
            const card = document.createElement("div");
            card.classList.add("flashcard");
            
            let frontContent = reverseMode ? flashcard.answer : flashcard.question;
            let backContent = reverseMode ? flashcard.question : flashcard.answer;
            
            card.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <p>${Array.isArray(frontContent) ? frontContent.join("<br>") : frontContent}</p>
                    </div>
                    <div class="flashcard-back">
                        <p>${Array.isArray(backContent) ? backContent.join("<br>") : backContent}</p>
                    </div>
                </div>
                <button onclick="deleteFlashcard(${i})">🗑️ Delete</button>
            `;
    
            card.addEventListener("click", () => {
                card.classList.toggle("flip");
            });
    
            flashcardsContainer.appendChild(card);
        });
       
    }
    
    reverseToggle.addEventListener("click", () => {
        reverseMode = !reverseMode;
        localStorage.setItem("reverseMode", JSON.stringify(reverseMode));
        renderFlashcards();
    });
    function shuffleFlashcards() {
        for (let i = flashcardSets[setIndex].flashcards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [flashcardSets[setIndex].flashcards[i], flashcardSets[setIndex].flashcards[j]] =
            [flashcardSets[setIndex].flashcards[j], flashcardSets[setIndex].flashcards[i]];
        }
    
        saveToLocalStorage(); 
        renderFlashcards();
    }
    let correctAnswers = 0; 
    function startQuiz() {
        quizIndex = 0;
        quizModal.style.display = "flex";
        showNextQuestion();
    }
    
    function showNextQuestion() {
        if (quizIndex < flashcardSets[setIndex].flashcards.length) {
            quizQuestion.textContent = flashcardSets[setIndex].flashcards[quizIndex].question;
            quizAnswerText.textContent = "";
            quizInput.value = "";
            quizInput.style.display = "block"; 
            quizSubmit.style.display = "inline-block";
            quizNext.style.display = "none";
            quizCard.classList.remove("flip"); 
        } else {
            endQuiz();
        }
    }
    
    function checkAnswer() {
        console.log("Submit button clicked!"); 
    
        if (!flashcardSets[setIndex] || !flashcardSets[setIndex].flashcards[quizIndex]) {
            console.error("Error: Flashcard does not exist.");
            return;
        }
    
        let userInput = quizInput.value.trim().toLowerCase();
    
        // Check if user used commas; if not, split by spaces
        let userAnswers = userInput.includes(",") 
            ? userInput.split(",").map(a => normalizeAnswer(a)) 
            : userInput.split(" ").map(a => normalizeAnswer(a)).join(" "); // Normalize entire phrase
    
        let correctAnswersArray = Array.isArray(flashcardSets[setIndex].flashcards[quizIndex].answer) 
            ? flashcardSets[setIndex].flashcards[quizIndex].answer.map(a => normalizeAnswer(a)) 
            : [normalizeAnswer(flashcardSets[setIndex].flashcards[quizIndex].answer)];
    
        let allCorrect = correctAnswersArray.includes(userAnswers);
    
        if (allCorrect) {
            quizAnswerText.textContent = "✅ Correct!";
            quizAnswerText.style.color = "green";
            correctAnswers++;
        } else {
            quizAnswerText.textContent = `❌ Incorrect. The correct answers are: ${correctAnswersArray.join(", ")}`;
            quizAnswerText.style.color = "red";
        }
    
        quizCard.classList.add("flip");
        quizInput.style.display = "none"; 
        quizSubmit.style.display = "none";
        quizNext.style.display = "inline-block";
    }
    function normalizeAnswer(answer) {
        return answer
            .trim()
            .toLowerCase()
            .split(" ") // Split into individual words
            .map(word => word.replace(/s$/, "")) // Remove trailing "s" from each word
            .join(" "); // Rejoin into a phrase
    }
    function endQuiz() {
        quizQuestion.textContent = `🎉 Quiz Complete! You got ${correctAnswers} out of ${flashcardSets[setIndex].flashcards.length} correct!`;
        quizAnswerText.textContent = "";
        quizInput.style.display = "none";
        quizSubmit.style.display = "none";
        quizNext.textContent = "Close";
        quizNext.style.display = "inline-block";
    
        quizNext.addEventListener("click", closeQuiz);
    }
    function closeQuiz() {
        quizModal.style.display = "none";
    }
    
    startQuizButton.addEventListener("click", startQuiz);
    quizSubmit.addEventListener("click", checkAnswer);
    quizNext.addEventListener("click", () => {
    quizIndex++;
    showNextQuestion();
});
quizClose.addEventListener("click", closeQuiz);
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
    
    function showFlashcardForm(callback) {
        const formContainer = document.createElement("div");
        formContainer.classList.add("modal-overlay");
        document.body.classList.add("blurred-background");
        
        formContainer.innerHTML = `
            <div class="input-form">
                <textarea id="question" placeholder="Enter question..." autocomplete="off" rows="3"></textarea>
                <textarea id="answer" placeholder="Enter answers (separate with a comma)..."></textarea>
                <div class="form-buttons">
                    <button id="submit-flashcard">Save</button>
                    <button id="cancel-flashcard">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(formContainer);

        const questionInput = document.getElementById("question");
        const answerInput = document.getElementById("answer");
        const saveButton = document.getElementById("submit-flashcard");

        function saveFlashcard() {
            const question = document.getElementById("question").value.trim();
            const answer = document.getElementById("answer").value.trim();
            if (question && answer) {
                callback(question, answer.split(",").map(v => v.trim()));
                closeModal();
            }
        }

        saveButton.addEventListener("click", saveFlashcard);

       // Listen for Enter key on inputs
    questionInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevents form submission
            saveFlashcard();
        }
    });

    answerInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevents new line in textarea
            saveFlashcard();
        }
    });

    // Click event for Cancel button
    document.getElementById("cancel-flashcard").addEventListener("click", closeModal);
}

    function closeModal() {
        console.log("closeModal function called.");
        
        // Select only the modal created by showFlashcardForm()
        const modal = document.querySelector(".modal-overlay:not(#quiz-modal)");
    
        if (modal) {
            modal.remove();
            document.body.classList.remove("blurred-background");
            console.log("Flashcard form modal removed.");
        } else {
            console.log("No flashcard form modal found to remove.");
        }
    }
    function addFlashcard() {
        showFlashcardForm((question, answer) => {
            flashcardSets[setIndex].flashcards.unshift({ question, answer });
            saveToLocalStorage();
            renderFlashcards();
            console.log("addFlashcard() function triggered.");
        });
    }

    function deleteFlashcard(flashcardIndex) {
        // Show a confirmation dialog
        let confirmDelete = confirm("Are you sure you want to delete this flashcard?");
        
        if (confirmDelete) {
            flashcardSets[setIndex].flashcards.splice(flashcardIndex, 1);
            saveToLocalStorage();
            renderFlashcards();
            console.log("Flashcard deleted.");
        } else {
            console.log("Flashcard deletion canceled.");
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));
    }

    function goBack() {
        window.location.href = "FlashcardProj.html";
    }
    renderFlashcards();
    shuffleButton.addEventListener("click", shuffleFlashcards);
    startQuizButton.addEventListener("click", startQuiz);

    window.addFlashcard = addFlashcard;
    window.deleteFlashcard = deleteFlashcard;
    window.goBack = goBack;
    
        
    
    if (!highlightModeBtn || !flashcardsContainer) {
        console.error("Highlight Mode button or Flashcard Container not found!");
        return;
    }

    // ✅ Load highlights from local storage
    let highlightHistory = JSON.parse(localStorage.getItem("highlightHistory")) || {};

    function saveHighlightsToLocalStorage() {
        localStorage.setItem("highlightHistory", JSON.stringify(highlightHistory));
    }

    function applyStoredHighlights() {
        document.querySelectorAll(".flashcard").forEach((card, cardIndex) => {
            if (highlightHistory[cardIndex]) {
                highlightHistory[cardIndex].forEach((highlight) => {
                    highlightTextInCard(card, highlight);
                });
            }
        });
    }

    function highlightTextInCard(card, text) {
        let paragraphs = card.querySelectorAll(".flashcard-front p, .flashcard-back p");
        paragraphs.forEach((p) => {
            let regex = new RegExp(`(${text})`, "gi");
            p.innerHTML = p.innerHTML.replace(regex, `<mark>$1</mark>`);
        });
    }

    // ✅ Apply stored highlights when page loads
    applyStoredHighlights();

    // ✅ Toggle Highlight Mode ON/OFF
    highlightModeBtn.addEventListener("click", () => {
        highlightMode = !highlightMode;
        highlightModeBtn.style.backgroundColor = highlightMode ? "#ffeb3b" : "";
        highlightModeBtn.textContent = highlightMode ? "✅ Highlighting On" : "🖍️ Highlight Mode";
    });

    // ✅ Highlight selected text inside flashcards & Save to Local Storage
    flashcardsContainer.addEventListener("mouseup", (event) => {
        if (!highlightMode) return; // Only allow highlighting in highlight mode

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
            event.stopPropagation(); // Prevent flipping while highlighting

            const range = selection.getRangeAt(0);
            const span = document.createElement("mark");
            span.textContent = selectedText;
            span.style.backgroundColor = "yellow";

            range.deleteContents();
            range.insertNode(span);
            selection.removeAllRanges(); // Deselect text after highlighting

            // ✅ Store highlight in history & save to local storage
            let card = event.target.closest(".flashcard");
            if (card) {
                let cardIndex = [...flashcardsContainer.children].indexOf(card);
                if (!highlightHistory[cardIndex]) {
                    highlightHistory[cardIndex] = [];
                }
                highlightHistory[cardIndex].push(selectedText);
                saveHighlightsToLocalStorage();
            }
        }
    });

    // ✅ Manual Undo for Highlights with Local Storage
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key === "z") {
            let cardIndexes = Object.keys(highlightHistory);
            if (cardIndexes.length > 0) {
                let lastCardIndex = cardIndexes[cardIndexes.length - 1];
                let lastHighlight = highlightHistory[lastCardIndex].pop(); // Remove last highlight from history

                if (highlightHistory[lastCardIndex].length === 0) {
                    delete highlightHistory[lastCardIndex]; // Remove empty entries
                }

                saveHighlightsToLocalStorage(); // ✅ Update Local Storage

                let card = document.querySelectorAll(".flashcard")[lastCardIndex];

                if (card) {
                    let paragraphs = card.querySelectorAll(".flashcard-front p, .flashcard-back p");
                    paragraphs.forEach((p) => {
                        p.innerHTML = p.innerHTML.replace(
                            `<mark>${lastHighlight}</mark>`,
                            lastHighlight
                        );
                    });
                }

                console.log("Undo: Last highlight removed");
            }
            event.preventDefault();
        }
    });

    console.log("Highlight mode successfully initialized!");
});