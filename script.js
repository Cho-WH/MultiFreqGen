let leftOscillator, rightOscillator;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let leftGainNode = audioContext.createGain();
let rightGainNode = audioContext.createGain();

// PannerNode를 사용하여 좌우 소리 분리
let leftPanner = audioContext.createStereoPanner();
let rightPanner = audioContext.createStereoPanner();

document.getElementById("playButton").addEventListener("click", function() {
    // 빈칸일 경우 기본값을 설정
    let leftFreq = validateInput("leftFreq", 20, 21000, "Left Frequency", 440);
    let leftVolume = validateInput("leftVolume", 0, 100, "Left Volume", 100) / 100;
    let leftPhase = validateInput("leftPhase", 0, 360, "Left Phase", 0);

    let rightFreq = validateInput("rightFreq", 20, 21000, "Right Frequency", 440);
    let rightVolume = validateInput("rightVolume", 0, 100, "Right Volume", 100) / 100;
    let rightPhase = validateInput("rightPhase", 0, 360, "Right Phase", 0);

    if (leftFreq && rightFreq && leftVolume !== null && rightVolume !== null && leftPhase !== null && rightPhase !== null) {
        playSound(leftFreq, leftVolume, leftPhase, rightFreq, rightVolume, rightPhase);
        document.getElementById("stopButton").disabled = false;
        document.getElementById("playButton").disabled = true;
    }
});

document.getElementById("stopButton").addEventListener("click", function() {
    stopSound();
    document.getElementById("stopButton").disabled = true;
    document.getElementById("playButton").disabled = false;
});

// 입력이 공백일 경우 기본값을 적용하도록 수정
function validateInput(id, min, max, label, defaultValue) {
    let value = document.getElementById(id).value;
    if (value === "" || isNaN(value)) {
        return defaultValue;  // 빈칸이거나 유효하지 않으면 기본값을 반환
    }
    value = parseFloat(value);
    if (value < min || value > max) {
        alert(`${label} 값을 올바르게 입력하세요. (${min} ~ ${max})`);
        return null;
    }
    return value;
}

function playSound(leftFreq, leftVolume, leftPhase, rightFreq, rightVolume, rightPhase) {
    let phaseOffsetLeft = (leftPhase / 360) * (2 * Math.PI);
    let phaseOffsetRight = (rightPhase / 360) * (2 * Math.PI);

    // 좌측 채널 오실레이터 설정
    leftOscillator = audioContext.createOscillator();
    leftOscillator.type = 'sine';
    leftOscillator.frequency.setValueAtTime(leftFreq, audioContext.currentTime);

    leftGainNode.gain.setValueAtTime(leftVolume, audioContext.currentTime);
    leftPanner.pan.setValueAtTime(-1, audioContext.currentTime);  // 좌측 채널로 소리 분리

    leftOscillator.connect(leftGainNode).connect(leftPanner).connect(audioContext.destination);
    leftOscillator.start(audioContext.currentTime + phaseOffsetLeft / leftFreq);

    // 우측 채널 오실레이터 설정
    rightOscillator = audioContext.createOscillator();
    rightOscillator.type = 'sine';
    rightOscillator.frequency.setValueAtTime(rightFreq, audioContext.currentTime);

    rightGainNode.gain.setValueAtTime(rightVolume, audioContext.currentTime);
    rightPanner.pan.setValueAtTime(1, audioContext.currentTime);  // 우측 채널로 소리 분리

    rightOscillator.connect(rightGainNode).connect(rightPanner).connect(audioContext.destination);
    rightOscillator.start(audioContext.currentTime + phaseOffsetRight / rightFreq);
}

function stopSound() {
    if (leftOscillator) leftOscillator.stop();
    if (rightOscillator) rightOscillator.stop();
}