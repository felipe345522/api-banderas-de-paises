import { auth, db } from '../firebaseConfig.js';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-:\'. '.split('');
const MAX_ATTEMPTS = 5;

let countryName = '';
let countryFlag = '';
let guessedLetters = [];
let wrongGuesses = 0;
let gameOver = false;
let gameWon = false;
let userWin = 0;
let userLose = 0;
let uid = null;

const app = document.getElementById('app');

function createElement(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (key === 'className') el.className = value;
        else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    }
    for (const child of children) {
        if (typeof child === 'string')
            el.appendChild(document.createTextNode(child));
        else if (child instanceof Node) el.appendChild(child);
    }
    return el;
}

function render() {
    app.innerHTML = '';

    const title = createElement('h2', {}, 'Adivina el País');
    const stats = createElement('p', {}, `Ganados: ${userWin} | Perdidos: ${userLose}`);
    app.appendChild(title);
    app.appendChild(stats);

    if (!countryName) {
        app.appendChild(createElement('p', {}, 'Cargando país...'));
        return;
    }

    const img = createElement('img', { src: countryFlag, alt: countryName, style: 'width:150px;height:100px;' });
    app.appendChild(img);

    // Mostrar palabra con guiones o letras
    const wordDiv = createElement('div');
    for (const letter of countryName) {
        const displayLetter = (guessedLetters.includes(letter) || gameOver || gameWon) ? letter : '_';
        const span = createElement('span', { style: 'margin-right: 6px;' }, displayLetter);
        wordDiv.appendChild(span);
    }
    app.appendChild(wordDiv);

    // Teclado
    const keyboardDiv = createElement('div', { style: 'display:flex; flex-wrap:wrap; max-width: 400px; gap:6px; margin:10px 0;' });

    ALPHABET.forEach(letter => {
        const disabled = guessedLetters.includes(letter) || gameOver || gameWon;

        const btn = createElement('button', {
            style: `width: 35px; height:35px; cursor:${disabled ? 'not-allowed' : 'pointer'}; opacity: ${disabled ? 0.5 : 1}`,
            onclick: () => handleLetterClick(letter)
        }, letter);
        keyboardDiv.appendChild(btn);
    });

    app.appendChild(keyboardDiv);

    // Fallos
    app.appendChild(createElement('p', {}, `Fallos: ${wrongGuesses} / ${MAX_ATTEMPTS}`));

    if (gameOver) {
        app.appendChild(createElement('p', { style: 'color: red;font-weight: bold;' }, `💀 ¡Perdiste! Era: ${countryName}`));
    }
    if (gameWon) {
        app.appendChild(createElement('p', { style: 'color: green;font-weight: bold;' }, `🎉 ¡Ganaste!`));
    }

    if (gameOver || gameWon) {
        const restartBtn = createElement('button', {
            onclick: restartGame,
            style: 'margin-top: 10px; padding: 8px 16px; font-weight: bold;'
        }, 'Jugar otra vez');
        app.appendChild(restartBtn);
    }
}

async function handleLetterClick(letter) {
    if (guessedLetters.includes(letter) || gameOver || gameWon) return;

    guessedLetters.push(letter);

    if (!countryName.includes(letter)) {
        wrongGuesses++;
        if (wrongGuesses >= MAX_ATTEMPTS) {
            gameOver = true;
            userLose++;
            await guardarResultado(false);
        }
    } else {
        // Verificar si ganó
        const allCorrect = [...countryName].every(l => guessedLetters.includes(l));
        if (allCorrect) {
            gameWon = true;
            userWin++;
            await guardarResultado(true);
        }
    }
    render();
}

async function guardarResultado(acierto) {
    if (!uid) return;

    const fecha = new Date().toISOString();

    const resultado = {
        uid,
        country: countryName,
        aciertos: acierto ? 1 : 0,
        errores: acierto ? 0 : 1,
        fecha,
    };

    try {
        await setDoc(doc(db, 'resultados', `${uid}_${fecha}`), resultado);
        const docRef = doc(db, 'usuarios', uid);
        await updateDoc(docRef, {
            ganados: acierto ? userWin : userWin,
            perdidos: !acierto ? userLose : userLose,
        });
    } catch (e) {
        console.error('Error al guardar resultado:', e);
    }
}

async function fetchRandomCountry() {
    app.innerHTML = '<p>Cargando país...</p>';
    const id = Math.floor(Math.random() * 250); // Cambia el rango según el número de países disponibles
    try {
        const res = await fetch(`https://restcountries.com/v3.1/all`);
        const data = await res.json();
        const randomCountry = data[id];
        countryName = randomCountry.name.common.toUpperCase();
        countryFlag = randomCountry.flags.svg;
    } catch (error) {
        console.error('Error al obtener el país:', error);
    }
}

async function restartGame() {
    guessedLetters = [];
    wrongGuesses = 0;
    gameOver = false;
    gameWon = false;
    countryName = '';
    countryFlag = '';

    await fetchRandomCountry();
    render();
}

async function cargarDatosUsuario() {
    if (!uid) return;

    const docRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        userWin = data.ganados || 0;
        userLose = data.perdidos || 0;
    } else {
        await setDoc(docRef, { ganados: 0, perdidos: 0 });
        userWin = 0;
        userLose = 0;
    }
}

export default function mostrarOriginal() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            uid = user.uid;
            await cargarDatosUsuario();
            await fetchRandomCountry();
            render();
        } else {
            app.innerHTML = '<p>Por favor inicia sesión para jugar.</p>';
        }
    });
}
