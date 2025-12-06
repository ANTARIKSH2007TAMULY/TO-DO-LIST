


// const b = document.getElementById('b'); 
// const d = document.getElementById('d'); 
// const e = document.getElementById('e'); 

// const a = new Audio('ding.mpeg'); 

// function h() {
//     const j = JSON.parse(localStorage.getItem('tasks')) || [];
//     j.forEach(k => l(k.text, k.done));
// }


// function i() {
//     const j = [];
//     e.querySelectorAll('li').forEach(k => {
//         // Exclude the delete button's text ('x') from the task text
//         // assuming the delete button is always the last child
//         const taskText = k.firstChild.textContent; 
        
//         j.push({
//             text: taskText,
//             done: k.classList.contains('f')
//         });
//     });
//     localStorage.setItem('tasks', JSON.stringify(j));
// }


// function l(m, n = false) {
//     if (!m) return;

//     const o = document.createElement('li');
//     o.textContent = m;

//     const p = document.createElement('button');
//     p.textContent = 'x';
//     p.className = 'g';
    
//     if (n) {
//         o.classList.add('f');
//     }

//     o.appendChild(p);
//     e.appendChild(o);

//     o.addEventListener('click', function(q) {
        
//         if (q.target !== p) { 
//             o.classList.toggle('f'); 
//             // Removed: a.play() moved to delete button listener
//             i();
//         }
//     });

//     p.addEventListener('click', function() {
//         e.removeChild(o);
//         // ⭐ ADDED: Play the audio when the delete button is clicked
//         a.play();
//         i();
//     });

//     i(); 
// }

// d.addEventListener('click', function() {
//     const m = b.value.trim();
//     if (m) {
//         l(m);
//         b.value = '';
//     }
// });

// b.addEventListener('keypress', function(r) {
//     if (r.key === 'Enter') {
//         d.click(); 
//     }
// });

// h();








const b = document.getElementById('b'); 
const d = document.getElementById('d'); 
const e = document.getElementById('e'); 

const a = new Audio('ding.mpeg'); 

// Function to refresh numbering and save to localStorage
function i() {
    const j = [];
    let counter = 1;
    e.querySelectorAll('li').forEach(k => {
        // Extract the original task text (excluding the number and the delete button 'x')
        // We find the text by removing the counter prefix and the trailing 'x'
        const rawText = k.firstChild.nodeValue.trim();
        
        j.push({
            // Save only the actual task text without the number prefix
            text: rawText.substring(rawText.indexOf('.') + 1).trim(),
            done: k.classList.contains('f')
        });
        
        // ⭐ Update the displayed task number
        k.firstChild.nodeValue = `${counter}. ${j[j.length - 1].text}`;
        counter++;
    });
    localStorage.setItem('tasks', JSON.stringify(j));
}

// Function to load tasks on startup
function h() {
    const j = JSON.parse(localStorage.getItem('tasks')) || [];
    j.forEach(k => l(k.text, k.done));
    i(); // Call i() to ensure numbering is correct on load
}


function l(m, n = false) {
    if (!m) return;

    const o = document.createElement('li');
    // We add the text without the number here, as i() will handle the numbering
    o.textContent = m;

    const p = document.createElement('button');
    p.textContent = 'x';
    p.className = 'g';
    
    if (n) {
        o.classList.add('f');
    }

    o.appendChild(p);
    e.appendChild(o);

    o.addEventListener('click', function(q) {
        
        if (q.target !== p) { 
            o.classList.toggle('f'); 
            // We still need to call i() here to save the 'done' state
            i();
        }
    });

    p.addEventListener('click', function() {
        e.removeChild(o);
        a.play();
        // ⭐ Crucial: Re-run i() to update localStorage AND renumber all tasks
        i();
    });

    // ⭐ Crucial: Re-run i() after adding a new task to number it
    i(); 
}

d.addEventListener('click', function() {
    const m = b.value.trim();
    if (m) {
        l(m);
        b.value = '';
    }
});

b.addEventListener('keypress', function(r) {
    if (r.key === 'Enter') {
        d.click(); 
    }
});

h();
