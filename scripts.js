const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');
let isGhosting = false;
let activeFilter = 0;
let rgbModifiers = [0, 0.25, 2];
let rgbDirection = [true, true, true];
const filters = [
    rainbowFilter,
    noFilter,
    redEffect,
    greenEffect,
    blueEffect,
    rgbSplit,
    greenScreen
];

function getVideo() {
    navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
    }).then(localMediaStream => {
        video.srcObject = localMediaStream;
        video.play();
    }).catch(err => console.error('Something went wrong', err));
}

function paintToCanvas() {
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    return setInterval(() => {
        ctx.drawImage(video, 0, 0, width, height);
        let pixels = ctx.getImageData(0, 0, width, height);

        pixels = filters[activeFilter](pixels);

        if (isGhosting) {
            ctx.globalAlpha = 0.1;
        } else {
            ctx.globalAlpha = 1;
        }

        ctx.putImageData(pixels, 0, 0);
    }, 10);
}

function takePhoto() {
    snap.currentTime = 0;
    snap.play();

    const data = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = data;
    link.setAttribute('download', 'portrait');
    link.innerHTML = `<img src="${data}" alt="It me!" />`;
    strip.insertBefore(link, strip.firstChild);
}

function toggleFilter() {
    activeFilter++;
    if (activeFilter >= filters.length) activeFilter = 0;
    console.log(activeFilter);
}

function ghosting() {
    isGhosting = !isGhosting;
    console.log(isGhosting);
}

function noFilter(pixels) {
    return pixels;
}

function redEffect(pixels) {
    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] *= 2;  // red
        pixels.data[i + 1] *= 0.5; // green
        pixels.data[i + 2] *= 0.5; // blue
    }
    return pixels;
}

function greenEffect(pixels) {
    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] *= 0.5;  // red
        pixels.data[i + 1] *= 2; // green
        pixels.data[i + 2] *= 0.5; // blue
    }
    return pixels;
}

function blueEffect(pixels) {
    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] *= 0.5;  // red
        pixels.data[i + 1] *= 0.5; // green
        pixels.data[i + 2] *= 2; // blue
    }
    return pixels;
}

function rainbowFilter(pixels) {
    for (let j = 0; j < rgbModifiers.length; j++) {
        if (rgbDirection[j]) rgbModifiers[j] += 0.1 * Math.random();
        else rgbModifiers[j] -= 0.1 * Math.random();

        if (rgbModifiers[j] >= 2) {
            rgbDirection[j] = false;
        }

        if (rgbModifiers[j] <= 0) {
            rgbDirection[j] = true;
        }
    }

    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i + 0] *= rgbModifiers[0];
        pixels.data[i + 1] *= rgbModifiers[1];
        pixels.data[i + 2] *= rgbModifiers[2];
    }

    return pixels;
}

function rgbSplit(pixels) {
    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i - 500] = pixels.data[i];  // red
        pixels.data[i + 350] = pixels.data[i + 1];  // green
        pixels.data[i - 150] = pixels.data[i + 2];  // blue
    }
    return pixels;
}

function greenScreen(pixels) {
    const levels = {};

    document.querySelectorAll('.rgb input').forEach(input => {
        levels[input.name] = input.value;
    });

    for (let i = 0; i < pixels.data.length; i += 4) {
        let red = pixels.data[i];
        let green = pixels.data[i + 1];
        let blue = pixels.data[i + 2];
        let alpha = pixels.data[i + 3];

        if (red >= levels.rmin && red <= levels.rmax &&
            green >= levels.gmin && green <= levels.gmax &&
            blue >= levels.bmin && blue <= levels.bmax) {
            pixels.data[i + 3] = 0;
        }
    }

    return pixels;
}

getVideo();
video.addEventListener('canplay', paintToCanvas);
