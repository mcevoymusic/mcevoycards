document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startGameButton = document.getElementById('startGameButton');
    const replayGameButton = document.getElementById('replayGameButton');
    const cardAmountDropdown = document.getElementById('cardAmountDropdown');
    const difficultyDropdown = document.getElementById('difficultyDropdown');

    let bpm;
    let beatDuration;
    let countValue;

    let images = {};
    let notes = [];
    let currentCard = 0;
    let drumBeatInterval;
    let playCardInterval;
    let countInInterval;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const imageSources = {
        'beginner': [
            { src: '1.png', counts: 8 },
            { src: '12.png', counts: 4 },
            { src: '14.png', counts: 2 },
            { src: '18x2.png', counts: 1, repeat: 2 }
        ],
        'beginnerRests': [
            { src: '1.png', counts: 8 },
            { src: '12.png', counts: 4 },
            { src: '14.png', counts: 2 },
            { src: '18x2.png', counts: 1, repeat: 2 },
            { src: 'Rest1.png', counts: 8, silence: true },
            { src: 'Rest12.png', counts: 4, silence: true },
            { src: 'Rest14.png', counts: 2, silence: true }
        ],
        'allNotes': [
            { src: '1.png', counts: 8 },
            { src: '12.png', counts: 4 },
            { src: '14.png', counts: 2 },
            { src: '18x2.png', counts: 1, repeat: 2 },
            { src: '14D.png', counts: 3 },
            { src: '18.png', counts: 1 }
        ],
        'allNotesRests': [
            { src: '1.png', counts: 8 },
            { src: '12.png', counts: 4 },
            { src: '14.png', counts: 2 },
            { src: '18x2.png', counts: 1, repeat: 2 },
            { src: '14D.png', counts: 3 },
            { src: '18.png', counts: 1 },
            { src: 'Rest1.png', counts: 8, silence: true },
            { src: 'Rest12.png', counts: 4, silence: true },
            { src: 'Rest14.png', counts: 2, silence: true },
            { src: 'Rest14D.png', counts: 3, silence: true },
            { src: 'Rest18.png', counts: 1, silence: true }
        ],
        'beginnerNoNumbers': [
            { src: 'Nono1.png', counts: 8 },
            { src: 'Nono12.png', counts: 4 },
            { src: 'Nono14.png', counts: 2 },
            { src: 'Nono18x2.png', counts: 1, repeat: 2 }
        ],
        'beginnerRestsNoNumbers': [
            { src: 'Nono1.png', counts: 8 },
            { src: 'Nono12.png', counts: 4 },
            { src: 'Nono14.png', counts: 2 },
            { src: 'Nono18x2.png', counts: 1, repeat: 2 },
            { src: 'NonoRest1.png', counts: 8, silence: true },
            { src: 'NonoRest12.png', counts: 4, silence: true },
            { src: 'NonoRest14.png', counts: 2, silence: true }
        ],
        'allNotesNoNumbers': [
            { src: 'Nono1.png', counts: 8 },
            { src: 'Nono12.png', counts: 4 },
            { src: 'Nono14.png', counts: 2 },
            { src: 'Nono18x2.png', counts: 1, repeat: 2 },
            { src: 'Nono14D.png', counts: 3 },
            { src: 'Nono18.png', counts: 1 }
        ],
        'allNotesRestsNoNumbers': [
            { src: 'Nono1.png', counts: 8 },
            { src: 'Nono12.png', counts: 4 },
            { src: 'Nono14.png', counts: 2 },
            { src: 'Nono18x2.png', counts: 1, repeat: 2 },
            { src: 'Nono14D.png', counts: 3 },
            { src: 'Nono18.png', counts: 1 },
            { src: 'NonoRest1.png', counts: 8, silence: true },
            { src: 'NonoRest12.png', counts: 4, silence: true },
            { src: 'NonoRest14.png', counts: 2, silence: true },
            { src: 'NonoRest14D.png', counts: 3, silence: true },
            { src: 'NonoRest18.png', counts: 1, silence: true }
        ]
    };

    function preloadImages(difficulty, callback) {
        let loaded = 0;
        const total = imageSources[difficulty].length;
        imageSources[difficulty].forEach(card => {
            let img = new Image();
            img.src = `C:/Users/alist/Google Drive/Online Stuff/McEvoy Method/Html/Cards with sounds/Playing cards/${card.src}`;
            img.onload = () => {
                images[card.src] = img;
                if (++loaded >= total) {
                    console.log('All images loaded');
                    callback();
                }
            };
        });
    }

    function setTempo(difficulty) {
        switch (difficulty) {
            case 'beginner':
            case 'beginnerRests':
            case 'beginnerNoNumbers':
            case 'beginnerRestsNoNumbers':
                bpm = Math.floor(Math.random() * 41) + 40; // 40-80 BPM
                break;
            case 'allNotes':
            case 'allNotesRests':
            case 'allNotesNoNumbers':
            case 'allNotesRestsNoNumbers':
                bpm = Math.floor(Math.random() * 121) + 80; // 80-200 BPM
                break;
            default:
                bpm = Math.floor(Math.random() * 61) + 60; // 60-120 BPM for other levels
        }
        beatDuration = 60000 / bpm;
    }

    function startGame() {
        stopPlayback();

        const difficulty = difficultyDropdown.value;
        setTempo(difficulty);

        countValue = bpm * 2;

        const numberOfCards = parseInt(cardAmountDropdown.value, 10);
        preloadImages(difficulty, () => {
            notes = [];
            const cardWidth = 80;
            const cardHeight = 120;
            const totalWidth = numberOfCards * cardWidth;
            const startX = (canvas.width - totalWidth) / 2;

            for (let i = 0; i < numberOfCards; i++) {
                let card = imageSources[difficulty][Math.floor(Math.random() * imageSources[difficulty].length)];
                notes.push({
                    image: card.src,
                    startX: canvas.width + 200,
                    startY: 20, // Changed to 20
                    endX: startX + i * cardWidth,
                    endY: 20, // Changed to 20
                    currentX: canvas.width + 200,
                    currentY: 20, // Changed to 20
                    width: cardWidth,
                    height: cardHeight,
                    duration: card.counts * beatDuration,
                    counts: card.counts,
                    repeat: card.repeat || 1,
                    silence: card.silence || false
                });
            }
            currentCard = 0;
            requestAnimationFrame(animateDealing);
        });
    }

    function replayGame() {
        stopPlayback();
        currentCard = 0;
        requestAnimationFrame(animateDealing);
    }

    function stopPlayback() {
        clearInterval(drumBeatInterval);
        clearTimeout(playCardInterval);
        clearTimeout(countInInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function animateDealing() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let anyCardMoving = false;
        notes.forEach((note) => {
            if (note.currentX > note.endX) {
                note.currentX -= 20;
                anyCardMoving = true;
            }
            ctx.drawImage(images[note.image], note.currentX, note.currentY, note.width, note.height);
        });

        if (anyCardMoving) {
            requestAnimationFrame(animateDealing);
        } else {
            performCountIn();
        }
    }

    function generateMajor7thChordFrequencies(rootFrequency) {
        const octave = 2;
        const majorThird = rootFrequency * Math.pow(2, (4 / 12)) * octave;
        const perfectFifth = rootFrequency * Math.pow(2, (7 / 12)) * octave;
        const majorSeventh = rootFrequency * Math.pow(2, (11 / 12)) * octave;
        return [majorThird, perfectFifth, majorSeventh];
    }

    function generateMinor9thChordFrequencies(rootFrequency) {
        const octave = 2;
        const minorThird = rootFrequency * Math.pow(2, (3 / 12)) * octave;
        const perfectFifth = rootFrequency * Math.pow(2, (7 / 12)) * octave;
        const minorSeventh = rootFrequency * Math.pow(2, (10 / 12)) * octave;
        const ninth = rootFrequency * Math.pow(2, (14 / 12)) * octave;
        return [minorThird, perfectFifth, minorSeventh, ninth];
    }

    function getRandomBassNoteFrequency() {
        const notes = [
            82.41,
            87.31,
            92.50,
            98.00,
            103.83,
            110.00,
            116.54,
            123.47,
            130.81,
            138.59,
            146.83,
            155.56,
            164.81,
            174.61
        ];
        const randomIndex = Math.floor(Math.random() * notes.length);
        return Math.max(notes[randomIndex], 98.00); // Ensure frequency is at least 98Hz
    }

    function generate808Bass(frequency, duration, volume = 1) {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now);
        osc.frequency.exponentialRampToValueAtTime(frequency / 2, now + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // Gain envelope with attack time
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.05); // Attack time of 50ms
        gain.gain.exponentialRampToValueAtTime(0.5, now + duration * 0.5); // Longer sustain
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    function generateChordSound(frequencies, duration, volume = 1) {
        const now = audioCtx.currentTime;
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = volume * 0.25; // Reduce chord volume by 75%
        masterGain.connect(audioCtx.destination);

        frequencies.forEach(frequency => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(masterGain);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, now);

            // Apply tremolo effect
            const tremolo = audioCtx.createOscillator();
            tremolo.frequency.setValueAtTime(5, now); // 5 Hz tremolo
            const tremoloGain = audioCtx.createGain();
            tremoloGain.gain.setValueAtTime(0.5, now); // Tremolo depth

            tremolo.connect(tremoloGain.gain);
            gainNode.connect(tremoloGain);
            tremoloGain.connect(masterGain);

            // Gain envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.25, now + 0.05); // Slightly longer attack (50ms)
            gainNode.gain.linearRampToValueAtTime(volume * 0.2, now + duration * 0.5); // Sustain
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

            oscillator.start(now);
            tremolo.start(now);
            oscillator.stop(now + duration);
            tremolo.stop(now + duration);
        });
    }

    function performCountIn() {
        const messages = ["OK", "", "Ready", "", "Set", "", "Go!", ""];
        const kickPattern = [1, 0, 1, 0, 1, 0, 1, 0];
        const hihatPattern = [1, 1, 1, 1, 1, 1, 1, 1];
        const clickPattern = [1, 1, 1, 1, 1, 1, 1, 1];
        let index = 0;

        countInInterval = setInterval(() => {
            if (index < messages.length) {
                ctx.clearRect(0, canvas.height - 50, canvas.width, 50);
                ctx.font = "48px 'Lexend Zetta'";
                ctx.fillStyle = "yellow";
                ctx.textAlign = "center";
                ctx.fillText(messages[index], canvas.width / 2, canvas.height - 10);
                if (kickPattern[index]) playDrumSound('kick');
                if (hihatPattern[index]) playDrumSound('hihat');
                if (clickPattern[index]) playDrumSound('rim', 0.5); // Increase click volume
                index++;
            } else {
                clearInterval(countInInterval);
                ctx.clearRect(0, canvas.height - 50, canvas.width, 50);
                startDrumBeatAndPlayCards();
            }
        }, beatDuration);
    }

    function startDrumBeatAndPlayCards() {
        const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0];
        const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0];
        const hihatPattern = [1, 1, 1, 1, 1, 1, 1, 1];
        const clickPattern = [1, 1, 1, 1, 1, 1, 1, 1];
        let beatIndex = 0;

        function playNextBeat() {
            if (kickPattern[beatIndex]) playDrumSound('kick');
            if (snarePattern[beatIndex]) playDrumSound('snare');
            if (hihatPattern[beatIndex]) playDrumSound('hihat');
            if (clickPattern[beatIndex]) playDrumSound('rim', 0.5); // Increase click volume

            beatIndex = (beatIndex + 1) % kickPattern.length;
        }

        playNextBeat();
        playCards();

        drumBeatInterval = setInterval(playNextBeat, beatDuration);
    }

    function stopDrumBeat() {
        clearInterval(drumBeatInterval);
    }

    function playCards() {
        if (currentCard < notes.length) {
            const note = notes[currentCard];
            highlightCard(currentCard);
            let repeatCount = 0;

            function playNote() {
                if (repeatCount < note.repeat) {
                    if (!note.silence) {
                        const bassNoteFrequency = getRandomBassNoteFrequency();
                        const chordFrequencies = Math.random() > 0.5 ? generateMajor7thChordFrequencies(bassNoteFrequency) : generateMinor9thChordFrequencies(bassNoteFrequency);

                        // Play the 808 bass note
                        generate808Bass(bassNoteFrequency, note.duration / 1000, 1.0); // Louder bass

                        // Play the chord
                        generateChordSound(chordFrequencies, note.duration / 1000, 0.4);
                    }
                    repeatCount++;
                    setTimeout(playNote, note.duration);
                } else {
                    clearHighlight(currentCard);
                    currentCard++;
                    if (currentCard < notes.length) {
                        playCards();
                    } else {
                        stopDrumBeat();
                    }
                }
            }

            playNote();
        }
    }

    function highlightCard(index) {
        const note = notes[index];
        ctx.drawImage(images[note.image], note.endX, note.endY, note.width, note.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.strokeRect(note.endX, note.endY, note.width, note.height);
    }

    function clearHighlight(index) {
        const note = notes[index];
        ctx.clearRect(note.endX - 5, note.endY - 5, note.width + 10, note.height + 10);
        ctx.drawImage(images[note.image], note.endX, note.endY, note.width, note.height);
    }

    function playDrumSound(type, volume = 1) {
        const now = audioCtx.currentTime;
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(audioCtx.destination);

        switch (type) {
            case 'kick':
                const kickOscillator = audioCtx.createOscillator();
                const kickGain = audioCtx.createGain();
                kickOscillator.connect(kickGain);
                kickGain.connect(masterGain);

                kickOscillator.type = 'sine';
                kickOscillator.frequency.setValueAtTime(150, now);
                kickOscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                kickGain.gain.setValueAtTime(volume, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                kickOscillator.start(now);
                kickOscillator.stop(now + 0.5);
                break;

            case 'snare':
                const snareNoise = audioCtx.createBufferSource();
                const bufferSize = audioCtx.sampleRate;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                snareNoise.buffer = buffer;

                const snareGain = audioCtx.createGain();
                snareNoise.connect(snareGain);
                snareGain.connect(masterGain);

                snareGain.gain.setValueAtTime(volume, now);
                snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

                const snareOscillator = audioCtx.createOscillator();
                snareOscillator.type = 'triangle';
                snareOscillator.frequency.setValueAtTime(200, now);
                snareOscillator.connect(snareGain);
                snareGain.gain.setValueAtTime(volume, now);
                snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                snareNoise.start(now);
                snareNoise.stop(now + 0.2);
                snareOscillator.start(now);
                snareOscillator.stop(now + 0.1);
                break;

            case 'hihat':
                const hiHatNoise = audioCtx.createBufferSource();
                const hiHatBufferSize = audioCtx.sampleRate;
                const hiHatBuffer = audioCtx.createBuffer(1, hiHatBufferSize, audioCtx.sampleRate);
                const hiHatData = hiHatBuffer.getChannelData(0);
                for (let i = 0; i < hiHatBufferSize; i++) {
                    hiHatData[i] = Math.random() * 2 - 1;
                }
                hiHatNoise.buffer = hiHatBuffer;

                const hiHatFilter = audioCtx.createBiquadFilter();
                hiHatFilter.type = 'highpass';
                hiHatFilter.frequency.setValueAtTime(10000, now);
                hiHatFilter.Q.setValueAtTime(1, now);

                const hiHatGain = audioCtx.createGain();
                hiHatNoise.connect(hiHatFilter);
                hiHatFilter.connect(hiHatGain);
                hiHatGain.connect(masterGain);

                hiHatGain.gain.setValueAtTime(volume * 0.3, now);
                hiHatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                hiHatNoise.start(now);
                hiHatNoise.stop(now + 0.1);
                break;

            case 'rim':
                const rimOscillator = audioCtx.createOscillator();
                const rimGain = audioCtx.createGain();
                rimOscillator.connect(rimGain);
                rimGain.connect(masterGain);

                rimOscillator.type = 'square';
                rimOscillator.frequency.setValueAtTime(2000, now);
                rimGain.gain.setValueAtTime(volume * 0.5, now);
                rimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                rimOscillator.start(now);
                rimOscillator.stop(now + 0.1);
                break;
        }
    }

    startGameButton.addEventListener('click', startGame);
    replayGameButton.addEventListener('click', replayGame);
});
