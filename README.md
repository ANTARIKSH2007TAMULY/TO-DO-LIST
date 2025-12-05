
# **Project 6: The Task-Master To-Do List (Web Audio API)**

A simple browser-based To-Do List app built using **HTML**, **CSS**, and **vanilla JavaScript**.
A small **“ding”** sound plays whenever a user marks a task as complete using the **Web Audio API**.

---

## 🌟 Features

### ✔️ Task Management

* Add tasks
* Mark tasks as done
* Delete tasks

### 🔊 Audio Feedback

* Uses JavaScript’s `Audio()` constructor to play a quick ding when a task is completed.

### 💾 Optional Task Persistence

* Saves tasks using **localStorage**, so they remain after closing or refreshing the browser.

---

## 💻 Technology Used

* **HTML5** – Structure
* **CSS3** – Styling
* **JavaScript (Vanilla)** – Core logic
* **Web Audio API** – For sound feedback

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone [your-repo-link]
cd the-task-master
```

### 2. Add the Sound File

Add a short sound clip (like a bell or ding) to the root folder.
Name it exactly:

```
ding.mp3
```

### 3. Open the Project

Open:

```
index.html
```

in your browser.

---

## 📂 File Structure

| File Name    | Description           |
| ------------ | --------------------- |
| `index.html` | Main HTML structure   |
| `a.css`      | App styling           |
| `b.js`       | Core JavaScript logic |
| `ding.mp3`   | Feedback sound file   |

---

## 💡 Key Learning Points

### 🧩 DOM Manipulation

Creating, appending, and deleting `<li>` elements dynamically.

### ✏️ Handling User Input

Collecting text input and responding to button clicks.

### 🖱️ Event Handling

Managing multiple event actions (e.g., complete vs. delete).

### 🔊 Audio Integration

Using the built-in `Audio()` API to play feedback sounds.

### 📦 Local Storage

Saving and retrieving data using:

* `localStorage.setItem()`
* `localStorage.getItem()`

---

