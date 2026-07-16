// ==========================================
// Background Particles
// ==========================================

const particles = document.getElementById("particles");

for(let i = 0; i < 35; i++){

    const particle = document.createElement("span");

    particle.className = "particle";

    particle.style.left = Math.random() * 100 + "%";

    particle.style.top = Math.random() * 100 + "%";

    particle.style.animationDelay = Math.random() * 8 + "s";

    particle.style.animationDuration = 6 + Math.random() * 6 + "s";

    particles.appendChild(particle);

}
