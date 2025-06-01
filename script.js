// --- Hilfsfunktionen für Cache ---
function getCacheKey(sheetUrl) {
    return `flashcardsCache_${encodeURIComponent(sheetUrl)}`;
}

function loadCachedFlashcards(sheetUrl) {
    const cacheKey = getCacheKey(sheetUrl);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
}

function saveFlashcardsToCache(sheetUrl, flashcards) {
    const cacheKey = getCacheKey(sheetUrl);
    localStorage.setItem(cacheKey, JSON.stringify(flashcards));
}

function clearFlashcardCache() {
    if (!currentSheetHtmlUrl) return;
    const cacheKey = getCacheKey(currentSheetHtmlUrl);
    localStorage.removeItem(cacheKey);
    alert("Cache gelöscht. Die Antworten werden beim nächsten Laden neu geladen.");
}

// --- DOM Elemente ---
const answerElement = document.getElementById('answer');
const cardCounterBackElement = document.getElementById('card-counter-back');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const sourceSelectElement = document.getElementById('source-select');
const flashcardElement = document.querySelector('.flashcard');
const flashcardContainer = document.querySelector('.flashcard-container');

let flashcardsData = [];
let currentCardIndex = 0;
let currentSheetHtmlUrl = '';

// --- Konfiguration ---
const dataSources = [
    { name: "Entrepreneurship", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1764148411&single=true' },
    { name: "Innovationsmanagement", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=328742291&single=true' },
    { name: "Interkulturelle Kompetenz", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=434252636&single=true' },
    { name: "Investitionen Finanzierung", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1125457266&single=true' },
    { name: "Marketing", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1971809043&single=true' },
    { name: "Operations Management", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1687257786&single=true' },
    { name: "Organisationsentwicklung", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1879967826&single=true' },
    { name: "Personalmanagement", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=865858526&single=true' },
    { name: "REWE 1", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=2014850060&single=true' },
    { name: "REWE 2", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=602206923&single=true' },
    { name: "Strategisches Management", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1974491094&single=true' },
    { name: "Vertrieb", url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzeyfSRzXbvjoocf1LvBYL8XU2iiqQBD60zmAP1VHCMx_3mT3zs5gaVVOmtx-ICkbPpvVfBIy0GHRl/pubhtml?gid=1596326148&single=true' }
];

// --- Daten laden ---
async function loadAnswersOnly() {
    if (!currentSheetHtmlUrl) return;

    const cached = loadCachedFlashcards(currentSheetHtmlUrl);
    if (cached && Array.isArray(cached) && cached.length > 0) {
        flashcardsData = cached;
        initializeApp();
        return;
    }

    flashcardsData = [];
    answerElement.innerHTML = "Lade Antworten...";

    try {
        const response = await fetch(currentSheetHtmlUrl);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const rows = [...doc.querySelectorAll('table.waffle tbody tr')].slice(1);
        const answersHtml = rows.flatMap(row =>
            [...row.querySelectorAll('td')].map(td => td.innerHTML.trim()).filter(t => t.length > 0)
        );

        flashcardsData = answersHtml.map(answer => ({ answer }));
        saveFlashcardsToCache(currentSheetHtmlUrl, flashcardsData);
        initializeApp();
    } catch (e) {
        console.error("Fehler beim Laden:", e);
        answerElement.innerHTML = "<p>Fehler beim Laden.</p>";
        disableButtons(true);
    }
}

// --- Initialisierung ---
function initializeApp() {
    if (flashcardsData.length === 0) {
        answerElement.innerHTML = "<p>Keine Daten vorhanden.</p>";
        disableButtons(true);
        return;
    }

    currentCardIndex = 0;
    showCard();
    disableButtons(false);
}

function disableButtons(disabled) {
    prevButton.disabled = disabled;
    nextButton.disabled = disabled;
}

// --- Kartenanzeige ---
function showCard() {
    const card = flashcardsData[currentCardIndex];
    answerElement.innerHTML = card.answer;
    const counter = `${currentCardIndex + 1} / ${flashcardsData.length}`;
    cardCounterBackElement.textContent = counter;
}

function nextCard() {
    if (flashcardsData.length === 0) return;
    currentCardIndex = (currentCardIndex + 1) % flashcardsData.length;
    showCard();
}

function prevCard() {
    if (flashcardsData.length === 0) return;
    currentCardIndex = (currentCardIndex - 1 + flashcardsData.length) % flashcardsData.length;
    showCard();
}

// --- Quelle wählen ---
function populateSourceDropdown() {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '– Bitte Lernset wählen –';
    placeholder.disabled = true;
    placeholder.selected = true;
    sourceSelectElement.appendChild(placeholder);

    dataSources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.url;
        option.textContent = source.name;
        sourceSelectElement.appendChild(option);
    });
}

function handleSourceChange() {
    currentSheetHtmlUrl = sourceSelectElement.value;
    flashcardsData = [];
    currentCardIndex = 0;
    answerElement.innerHTML = "Lade neues Lernset...";
    cardCounterBackElement.textContent = "";
    loadAnswersOnly();
}

// --- Drag & Swipe-Gesten ---
let dragStartX = 0;
let dragStartY = 0;
let currentTranslateX = 0;
let isDragging = false;

flashcardElement.addEventListener('touchstart', startDrag, { passive: true });
flashcardElement.addEventListener('touchmove', dragCard, { passive: false });
flashcardElement.addEventListener('touchend', endDrag);

function startDrag(e) {
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    isDragging = true;
    flashcardElement.classList.add('dragging');
}

function dragCard(e) {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - dragStartX;
    const deltaY = Math.abs(currentY - dragStartY);

    if (Math.abs(deltaX) > deltaY) {
        currentTranslateX = deltaX;
        flashcardElement.style.transform = `translateX(${currentTranslateX}px)`;
        e.preventDefault();
    }
}

function endDrag() {
    isDragging = false;
    flashcardElement.classList.remove('dragging');

    const threshold = 100;
    if (currentTranslateX > threshold) {
        flashcardElement.style.transform = 'translateX(100vw)';
        setTimeout(() => {
            flashcardElement.style.transition = 'none';
            flashcardElement.style.transform = 'translateX(-100vw)';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    flashcardElement.style.transition = '';
                    prevCard();
                    flashcardElement.style.transform = 'translateX(0)';
                });
            });
        }, 300);
    } else if (currentTranslateX < -threshold) {
        flashcardElement.style.transform = 'translateX(-100vw)';
        setTimeout(() => {
            flashcardElement.style.transition = 'none';
            flashcardElement.style.transform = 'translateX(100vw)';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    flashcardElement.style.transition = '';
                    nextCard();
                    flashcardElement.style.transform = 'translateX(0)';
                });
            });
        }, 300);
    } else {
        flashcardElement.style.transform = 'translateX(0)';
    }

    currentTranslateX = 0;
}

// --- Event Listener ---
nextButton.addEventListener('click', nextCard);
prevButton.addEventListener('click', prevCard);
sourceSelectElement.addEventListener('change', handleSourceChange);

// --- Start ---
populateSourceDropdown();
answerElement.innerHTML = "<p>Bitte Lernset oben auswählen.</p>";
disableButtons(true);
