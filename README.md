# Nihongo Revision Hub

> An interactive web application designed for Junior High students to revise Japanese vocabulary and grammar through fun activities like flashcards and quizzes across 12 learning units.

This application provides a simple, clean, and effective way for students to engage with their learning material, select specific units of study, and test their knowledge in different ways.

## ✨ Features

- **Dynamic Content Loading:** Loads study materials from local JSON files based on user selection.
- **Unit Selection:** Allows users to select one or multiple units to study at a time.
- **Activity Selection:** Users can choose between two revision modes:
  - **Flashcards:** An interactive flashcard system with a smooth 3D flip animation to reveal answers.
  - **Quiz:** A multiple-choice quiz that dynamically generates questions and distractors from the selected content.
- **Responsive Design:** The user interface is fully responsive and works seamlessly on devices of all sizes, from mobile phones to desktops.
- **Light & Dark Mode:** A theme toggle allows users to switch between a light and dark visual theme for comfortable viewing in any lighting condition.

## 🛠️ Tech Stack

- **Frontend:** React.js, TypeScript
- **Styling:** Tailwind CSS (via CDN)
- **Data:** Static JSON files for learning content.

## 📂 Project Structure

The project is organized to keep concerns separated and maintain a clean codebase.

```
/
├── public/
│   └── data/               # Contains JSON files for each learning unit
├── src/
│   ├── components/         # Reusable React components (Flashcards, Quiz, etc.)
│   ├── hooks/              # Custom React hooks (e.g., useContentLoader)
│   ├── App.tsx             # Main application component, handles view routing and state
│   ├── index.tsx           # React application entry point
│   └── types.ts            # TypeScript type definitions
├── index.html              # The main HTML file
└── README.md               # Project documentation (this file)
```

## 📈 Development History

This section logs the key milestones and fixes implemented during the development process.

### 1. Initial Setup & Core Functionality
- The basic project structure was created with React and TypeScript.
- The `useContentLoader` hook was implemented to dynamically fetch and combine data from multiple unit-specific JSON files.
- Core components for selecting units (`UnitSelector`), choosing an activity (`ActivitySelector`), and the activities themselves (`Flashcards`, `Quiz`) were built.

### 2. Flashcard Animation Fix
- **Issue:** The CSS transform classes from Tailwind CSS were not consistently applying the 3D flip effect on the flashcards.
- **Solution:** Replaced the Tailwind transform classes with inline `style` attributes for `perspective`, `transform-style`, `transform`, and `backface-visibility`. This provided a more direct and robust way to control the animation, ensuring cross-browser compatibility.

### 3. Light/Dark Mode Implementation
- **Feature Request:** Add a theme toggle to switch between light and dark modes for better UX.
- **Implementation:**
    1. Added state management for the theme in `App.tsx`.
    2. A `useEffect` hook was added to toggle the `dark` class on the root `<html>` element.
    3. A theme switcher button with `SunIcon` and `MoonIcon` was added to the header.
    4. All components were refactored to use Tailwind's `dark:` utility classes (e.g., `bg-white dark:bg-slate-800`) instead of hardcoded colors.
- **Bug Fix #1:** The toggle was not working because the Tailwind CDN requires explicit configuration for the `class`-based dark mode strategy.
- **Solution #1:** Added a `tailwind.config` script block to `index.html` to set `darkMode: 'class'`.
- **Bug Fix #2:** A `ReferenceError: tailwind is not defined` occurred because the configuration script was running before the main Tailwind library had loaded.
- **Solution #2:** Corrected the script order in `index.html`, ensuring the Tailwind library is loaded *before* the configuration script is executed.

### 4. Standardized Learning Direction & Display
- **Enhancement:** To create a more consistent and pedagogically sound learning experience, all activities (`Flashcards`, `Quiz`, `Category Sort`) were updated to follow a "Japanese to English" flow.
- **Details:** The prompt now consistently displays the Japanese term, its Hiragana reading (if applicable), and its Romaji transcription. The user is then tested on their knowledge of the English equivalent. This change reinforces reading and recognition of Japanese characters first.

### 5. Data Refactoring & Category Cleanup
- **Enhancement:** A comprehensive review of all unit data was conducted to improve logical consistency and remove ambiguity in vocabulary categorization.
- **Details:**
    - In **Unit 3**, the confusing "Place (Japan)" and "Place (City)" subcategories were replaced with the more distinct "Japanese City" and "World City".
    - In **Unit 9**, the "Places" subcategory was refined to only include actual locations. Activity-based nouns (like "movie" and "shopping") were moved to a new, more appropriate "Activity/Event" category.
- **Impact:** These changes significantly improve the quality and precision of the learning data, making the "Category Sort" activity a more effective and less confusing exercise for students.

## 🚀 Future Enhancements & Ideas

Based on the existing data structure, here are some potential new activities to further enhance the learning experience:

### Recognition & Matching Activities

*   **Kana Karuta (Card Matching):** A matching game where students pair Hiragana/Katakana cards with their corresponding Romaji. This is excellent for reinforcing Kana recognition.
*   **Kanji Connect:** Match Kanji characters with their Hiragana readings to build reading fluency.
*   **Category Sorting:** Drag and drop vocabulary words into their correct categories (e.g., "Food", "Hobby", "Family") to reinforce contextual understanding.

### Production & Recall Activities

*   **Fill-in-the-Blanks:** Focus on grammar by presenting sentences with missing particles, requiring students to select the correct ones.
*   **Sentence Scramble:** Shuffle the words of a Japanese sentence and have students reorder them correctly to teach sentence structure.
*   **Typing Practice:** Prompt students with an English word and have them type the corresponding Romaji or Hiragana, encouraging active recall and familiarity with a Japanese IME.

### Listening Comprehension Activities

*(Requires integration with a Text-to-Speech API, like Gemini's TTS model)*

*   **Listen & Pick:** Play the audio of a Japanese word and have the student select the correct English translation from multiple choices.
*   **Dictation Drill:** Play a word or phrase and require the student to type what they heard, combining listening and writing skills.

### Gamification

*   **Timed Trials:** Add a countdown timer to quizzes and matching games to challenge speed and accuracy.
*   **Category Conquest:** Introduce a mastery system where students earn badges for achieving a high score in a specific sub-category.
*   **Survival Mode:** A quiz mode where a single incorrect answer ends the game, encouraging a focus on precision.

### Implementation Complexity Ranking

Here is a ranked list of the proposed activities, from easiest to most complex, to help guide future development efforts.

#### Tier 1: Low Complexity (Straightforward UI/Logic, No New Dependencies)

1.  **Category Sorting:** Easiest to implement. Requires a simple UI and a direct check against the `item.Category` property.
2.  **Kana Karuta & Kanji Connect (Matching Games):** Slightly more complex due to the need to manage the state of selected cards, but still uses basic UI elements and logic.

#### Tier 2: Medium Complexity (More Involved Logic or UI, No New Dependencies)

3.  **Typing Practice:** Introduces a text input field and requires logic for real-time validation.
4.  **Fill-in-the-Blanks (Particle Practice):** The main challenge is the data preparation—writing a function to parse sentences and identify particles.
5.  **Sentence Scramble:** The most complex of this tier. It requires both the parsing logic from "Fill-in-the-Blanks" and a more complex drag-and-drop UI.

#### Tier 3: High Complexity (Requires External API Integration)

*This tier represents a major jump in complexity because it introduces an external dependency for Text-to-Speech (TTS).*

6.  **Listen & Pick:** The core challenge is the entire lifecycle of an API call to a TTS service and the subsequent audio playback in the browser.
7.  **Dictation Drill:** Combines the complexity of both **Listen & Pick** (API calls, audio) and **Typing Practice** (text input validation).

#### Tier 4: Architectural Complexity (Affects the Whole App)

8.  **Gamification (Timed Trials, Badges, etc.):** This is the most complex as it's an architectural change, not just a new component. It would require new systems for timers, scoring, and **state persistence** (e.g., using `localStorage`) to track progress between sessions, which the app currently does not do.