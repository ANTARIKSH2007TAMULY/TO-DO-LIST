

const b = document.getElementById('b'); 
const d = document.getElementById('d'); 
const e = document.getElementById('e'); 

const a = new Audio('ding.mpeg'); 

function i() {
    const j = [];
    let counter = 1;
    e.querySelectorAll('li').forEach(k => {
        const rawText = k.firstChild.nodeValue.trim();
        
        j.push({
            text: rawText.substring(rawText.indexOf('.') + 1).trim(),
            done: k.classList.contains('f')
        });
        
        k.firstChild.nodeValue = `${counter}. ${j[j.length - 1].text}`;
        counter++;
    });
    localStorage.setItem('tasks', JSON.stringify(j));
}
function h() {
    const j = JSON.parse(localStorage.getItem('tasks')) || [];
    j.forEach(k => l(k.text, k.done));
    i(); 
}


function l(m, n = false) {
    if (!m) return;

    const o = document.createElement('li');

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
           
            i();
        }
    });

    p.addEventListener('click', function() {
        e.removeChild(o);
        a.play();
                i();
    });

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
