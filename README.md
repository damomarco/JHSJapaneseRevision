# Nihongo Revision Hub

> An interactive web application designed for Junior High students to revise Japanese vocabulary and grammar through fun activities like flashcards and quizzes across 12 learning units.

This application provides a simple, clean, and effective way for students to engage with their learning material, select specific units of study, and test their knowledge in different ways.

## ✨ Features

- **Dynamic Content Loading:** Loads study materials from local JSON files based on user selection.
- **Unit Selection:** Allows users to select one or multiple units to study at a time.
- **Activity Selection:** Users can choose between multiple revision modes:
  - **Flashcards:** An interactive flashcard system with a smooth 3D flip animation to reveal answers.
  - **Quiz:** A multiple-choice quiz that dynamically generates questions and distractors from the selected content.
  - **Category Sort:** A drag-and-drop game to sort vocabulary into the correct categories.
  - **Matching Game:** A classic memory game to match Japanese terms to their Romaji.
  - **Kanji Connect:** A matching game to connect Japanese words written in Kanji with their Hiragana readings.
  - **Listening Game:** An audio-based quiz where students listen to Japanese pronunciation and select the correct English translation, powered by Google's Gemini API.
  - **Sentence Scramble:** A game where students unscramble Japanese words to form a correct sentence based on an English prompt.
  - **Fill-in-the-Blanks:** A grammar-focused game where students choose the correct particle to complete a sentence.
- **Responsive Design:** The user interface is fully responsive and works seamlessly on devices of all sizes, from mobile phones to desktops.
- **Light & Dark Mode:** A theme toggle allows users to switch between a light and dark visual theme for comfortable viewing in any lighting condition.

## 🛠️ Tech Stack

- **Frontend:** React.js, TypeScript
- **AI/ML:** Google Gemini API (Text-to-Speech, Text Generation)
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

### 6. New Activity: Matching Game
- **Feature:** Added a new "Matching Game" activity based on the "Kana Karuta" concept from the roadmap.
- **Gameplay:** Users flip cards to match Japanese terms with their Romaji counterparts. This reinforces character and word recognition in a fun, interactive way.
- **Implementation:**
    - Created a new `MatchingGame.tsx` component to handle the game logic, including card shuffling, state management (flipped, matched), and win conditions.
    - The card flip animation re-uses the robust inline-style technique from the Flashcards component.
    - The activity is seamlessly integrated into the existing view routing in `App.tsx`.

### 7. Visual Polish: Matching Game
- **Issue:** Based on user feedback, the face-down cards in the Matching Game were too dark and lacked contrast with the background, making them difficult to see.
- **Solution:** The styling for the card backs was updated to use a lighter color (`bg-slate-300 dark:bg-slate-600`). The question mark icon was also given a lighter, more distinct color (`text-slate-500 dark:text-slate-400`). This significantly improves the visual clarity and accessibility of the game board.

### 8. New Activity: Listening Game (Gemini API Integration)
- **Feature:** Added a "Listening Game" to test comprehension of spoken Japanese.
- **Gameplay:** Users hear a Japanese word or phrase, synthesized by the Gemini Text-to-Speech model, and must select the correct English translation from four options.
- **Implementation Details & Technical Deep Dive:**
    - **API Integration:** Integrated the `@google/genai` library to make calls to the `gemini-2.5-flash-preview-tts` model. The `responseModalities` config is set to `[Modality.AUDIO]` to request audio output.
    - **Handling Raw Audio Data:** A key technical challenge with the Gemini TTS API is that it does not return a standard audio file (like `.mp3` or `.wav`). Instead, it provides a Base64-encoded string representing raw, headerless PCM audio data. Attempting to use this data directly in an `<audio>` tag or with the browser's default decoders will fail and can crash the application.
    - **Two-Step Audio Decoding:** A robust, two-step process was implemented in `ListeningGame.tsx` to handle this data:
        1.  **Base64 to Bytes:** A helper function (`decode`) first decodes the Base64 string back into its raw binary form (`Uint8Array`).
        2.  **Bytes to Playable Buffer:** A second, more complex async function (`decodeAudioData`) uses the Web Audio API to manually construct a playable `AudioBuffer`. It creates an empty buffer and explicitly provides the necessary metadata that a file header would normally contain: a sample rate of **24000 Hz** (required for this model) and **1** audio channel (mono). The raw audio bytes are then copied into this buffer.
    - **Audio Playback:** Once the data is in a proper `AudioBuffer`, it is played using a standard `AudioContext` and `BufferSourceNode`. The component also manages the `AudioContext` lifecycle, ensuring it is resumed after user interaction to comply with browser autoplay policies.
    - **Component Stability:** The new `ListeningGame.tsx` component includes full game logic, question generation, scoring, and robust UI states for loading and errors. This ensures a smooth user experience and isolates the complex audio logic, preventing it from causing app-wide failures as seen in previous attempts.

### 9. Sentence Scramble Chunking Logic
- **Enhancement:** The "Sentence Scramble" game relies on splitting Japanese sentences into logical words and particles. The initial implementation used a simple regex to split based on a list of particles, which sometimes incorrectly broke apart compound words or common phrases (e.g., "ありがとう" being split into "ありが" and "と").
- **Solution:** A more robust tokenizer was implemented in `components/SentenceScramble.tsx`. It now recognizes common greetings (like `こんにちは`), verb endings (like `ます` and `ました`), and particles as distinct grammatical units.
- **Impact:** This ensures that sentences are broken into their core components in a much more logical way, making the game more intuitive and educationally effective for students learning sentence structure.

### 10. New Activity: Kanji Connect
- **Feature:** Added the "Kanji Connect" activity, as proposed in the future enhancements roadmap.
- **Gameplay:** This is a matching game where students flip cards to pair Japanese words written with Kanji characters to their corresponding Hiragana readings. It reinforces a critical skill for learners of Japanese.
- **Implementation:**
    - Created a new `KanjiConnect.tsx` component, adapting the core logic from the existing `MatchingGame` for a different data pairing (Kanji to Hiragana).
    - Added a new icon for the activity and integrated it into the `ActivitySelector` and main app router.
    - The game includes logic to only be available if there are enough vocabulary items with distinct Kanji and Hiragana forms in the selected units.

### 11. New Activity: Fill-in-the-Blanks
- **Feature:** Added a grammar-focused "Fill-in-the-Blanks" activity.
- **Gameplay:** Students are presented with a Japanese sentence that has a grammatical particle missing. They must choose the correct particle from a set of options to complete the sentence.
- **Implementation:**
    - Created a new `FillInTheBlanks.tsx` component.
    - Implemented logic to scan the selected units for grammar-based sentences.
    - The component identifies common particles (は, が, を, に, etc.), randomly removes one to create a blank, and generates distractor options for the quiz.
    - The UI follows the established pattern of other quiz-like activities, providing clear feedback and a final score.

## 📝 Content Guidelines

### Sentence Scramble Chunking

The "Sentence Scramble" activity automatically splits Japanese sentences into words and particles. While we have significantly improved this logic to handle many common phrases and verb endings correctly, the system is rule-based and may not be perfect for every possible sentence.

If you are adding new grammar content and notice a sentence is being split into illogical chunks in the game, please notify the development team. The problematic word or phrase can be easily added to the tokenizer's "exception list" in `components/SentenceScramble.tsx` to resolve the issue. Please do not attempt to modify the JSON data with special characters to fix chunking, as this keeps the source data clean and portable.

## 🚀 Future Enhancements & Ideas

Based on the existing data structure, here are some potential new activities to further enhance the learning experience:

### Recognition & Matching Activities

*   **Kana Karuta (Card Matching):** A matching game where students pair Hiragana/Katakana cards with their corresponding Romaji. This is excellent for reinforcing Kana recognition. (✓ **Implemented as Matching Game!**)
*   **Kanji Connect:** Match Kanji characters with their Hiragana readings to build reading fluency. (✓ **Implemented!**)
*   **Category Sorting:** Drag and drop vocabulary words into their correct categories (e.g., "Food", "Hobby", "Family") to reinforce contextual understanding. (✓ **Implemented!**)

### Production & Recall Activities

*   **Fill-in-the-Blanks:** Focus on grammar by presenting sentences with missing particles, requiring students to select the correct ones. (✓ **Implemented!**)
*   **Sentence Scramble:** Shuffle the words of a Japanese sentence and have students reorder them correctly to teach sentence structure. (✓ **Implemented!**)
*   **Typing Practice:** Prompt students with an English word and have them type the corresponding Romaji or Hiragana, encouraging active recall and familiarity with a Japanese IME.

### Listening Comprehension Activities

*   **Listen & Pick:** Play the audio of a Japanese word and have the student select the correct English translation from multiple choices. (✓ **Implemented!**)
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