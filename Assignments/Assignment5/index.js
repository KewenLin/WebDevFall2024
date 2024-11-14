const wDrum = document.querySelector(".w.drum");
wDrum.innerHTML = '<img src="images/crash.png" alt="Button Image" style="width: 30px; height: 60px;"> w ';

const aDrum = document.querySelector(".a.drum");
aDrum.innerHTML = '<img src="images/kick.png" alt="Button Image" style="width: 50px; height: 50px;"> a ';

const sDrum = document.querySelector(".s.drum");
sDrum.innerHTML = '<img src="images/snare.png" alt="Button Image" style="width: 50px; height: 50px;"> s ';

const dDrum = document.querySelector(".d.drum");
dDrum.innerHTML = '<img src="images/tom1.png" alt="Button Image" style="width: 50px; height: 50px;"> d ';

const jDrum = document.querySelector(".j.drum");
jDrum.innerHTML = '<img src="images/tom2.png" alt="Button Image" style="width: 50px; height: 50px;"> j ';

const kDrum = document.querySelector(".k.drum");
kDrum.innerHTML = '<img src="images/tom3.png" alt="Button Image" style="width: 50px; height: 50px;"> k ';

const lDrum = document.querySelector(".l.drum");
lDrum.innerHTML = '<img src="images/tom4.png" alt="Button Image" style="width: 50px; height: 50px;"> l ';


const sounds = {
    w: new Audio("sounds/crash.mp3"),
    a: new Audio("sounds/kick-bass.mp3"),
    s: new Audio("sounds/snare.mp3"),
    d: new Audio("sounds/tom-1.mp3"),
    j: new Audio("sounds/tom-2.mp3"),
    k: new Audio("sounds/tom-3.mp3"),
    l: new Audio("sounds/tom-4.mp3")
};
  
function playSound(key) {
    if (key in sounds){
        const audio = sounds[key];
        audio.currentTime = 0; 
        audio.play();
    }
}

document.querySelectorAll(".drum").forEach((drum) => {
    drum.addEventListener("click", () => {
        const key = drum.classList[0];
        playSound(key);
    });
});

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    playSound(key);
});