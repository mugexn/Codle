# 🟩 CODLE

A **Wordle-style word game with clues** 🧩. Instead of guessing a random word, players read a list of clues and figure out the hidden word in **6 tries**. Teachers and students can create their own activities, which makes it great for reviewing lessons like programming, science, or vocabulary 📚.

---

## ✨ Features

- 🎮 **Play mode:** pick an activity, read the clues, and guess the hidden word
- 🛠️ **Create mode:** make your own activities with custom words and clues
- 🔢 **Any word length:** hidden words can be 3 to 12 letters long
- 💡 **Multiple clues per word:** add as many clues as you like
- ⌨️ **Device keyboard:** type with your phone's, tablet's, or computer's own keyboard (no on-screen keyboard)
- ⬅️ ➡️ **Word navigation:** move between words in an activity with the arrow buttons or the keyboard arrow keys
- 🎨 **Color feedback:** 🟩 correct spot, 🟨 wrong spot, ⬛ not in the word
- 🌗 **Light and dark themes:** follows your device's setting automatically
- 💾 **Auto-save:** activities are stored in your browser's `localStorage`
- 📤 **Download and import:** share activities as `.json` files

---

## 🕹️ How to Play

1. 📋 Choose an activity from the dropdown.
2. 🔍 Read the **clues** to figure out the hidden word.
3. 👆 Tap or click the board to open your keyboard.
4. ⌨️ Type your guess. The number of boxes matches the number of letters.
5. ↩️ Press **Enter** to submit.
6. 🎨 Check the colors:

| Color | Meaning |
| ----- | ------- |
| 🟩 Green | Right letter, right spot |
| 🟨 Yellow | Right letter, wrong spot |
| ⬛ Gray | Letter is not in the word |

7. ➡️ Solve the word (or run out of 6 tries) and move on to the next one.

### ⌨️ Controls

| Key | Action |
| --- | ------ |
| `A–Z` | Type a letter |
| `Backspace` | Delete a letter |
| `Enter` | Submit your guess |
| `←` / `→` | Previous / next word |

---

## 🛠️ Creating an Activity

1. Go to the **Create** tab.
2. 📝 Enter an **activity name or number** (for example, `Activity 1` or `Python OOP`).
3. ➕ Add a hidden word (letters only, 3–12) and its clues, one per line.
4. 🔁 Repeat for every word you want in the activity.
5. 💾 Click **Save activity**.

You can also ✏️ **edit**, 🗑️ **delete**, or ⬇️ **download** any activity later.

---

## 📦 Import / Export Format

Activities are saved as simple JSON files 🧾:

```json
{
  "codle": 2,
  "activities": [
    {
      "name": "Python OOP",
      "words": [
        {
          "word": "INHERITANCE",
          "clues": [
            "A child class gets the attributes and methods of another class",
            "It promotes code reuse",
            "A Dog class that builds on an Animal class is an example"
          ]
        }
      ]
    }
  ]
}
```

📌 **Rules for words:**
- Letters `A–Z` only (no spaces, numbers, or symbols)
- Between **3 and 12** letters
- At least **1 clue** per word

When importing a file, Codle asks whether to 🔄 **replace** your current activities or ➕ **add** to them.

---

## 🧰 Built With

- 🟧 **HTML5**
- 🟦 **CSS3** (Grid, Flexbox, CSS variables, animations)
- 🟨 **Vanilla JavaScript** (no frameworks or libraries)

---

## 👨‍💻 Credits

Developed by **MUGEXN** 💚

Happy guessing! 🎉
