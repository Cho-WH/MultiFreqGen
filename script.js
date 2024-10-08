et leftOscillator, rightOscillator;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let leftGainNode = audioContext.createGain();
let rightGainNode = audioContext.createGain();

// PannerNode를 사용하여 좌우 소리 분리
let leftPanner = audioContext.createStereoPanner();
let rightPanner = audioContext.createStereoPanner();

// 파형 그리기
let canvas = document.getElementById("waveformCanvas");
let ctx = canvas.getContext("2d");

// 캔버스 해상도 조정
function adjustCanvasResolution() {
    const ratio = window.devicePixelRatio || 1; // 디바이스 픽셀 밀도 비율 가져오기
    canvas.width = 600 * ratio;  // 실제 렌더링 해상도 설정
    canvas.height = 200 * ratio;
    ctx.scale(ratio, ratio); // 스케일을 적용하여 해상도 조정
}

adjustCanvasResolution();  // 페이지 로드 시 캔버스 해상도 조정

function drawWaveform(leftFreq, leftPhase, leftVolume, rightFreq, rightPhase, rightVolume) {
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1)); // 이전 파형을 지움

    let baseAmplitude = 90; // 기본 진폭 값
    let referenceFreq = 110; // 기준 주파수 (110Hz)
    let scaleFactor = canvas.width * referenceFreq / (window.devicePixelRatio || 1);  // 440Hz가 한 파장으로 표현되도록 조정

    // 좌측 파형 그리기
    let leftAmplitude = baseAmplitude * leftVolume;
    let leftAngularFreq = 2 * Math.PI * leftFreq;
    const centerY = (canvas.height / 2) / (window.devicePixelRatio || 1);  // 스케일링에 맞춘 중앙 y 좌표

    ctx.beginPath();
    for (let x = 0; x < canvas.width / (window.devicePixelRatio || 1); x++) {
        let t = x / scaleFactor;
        let y = leftAmplitude * Math.sin(leftAngularFreq * t + (leftPhase * Math.PI / 180));
        ctx.lineTo(x, centerY - y);  // 중앙을 기준으로 파형을 그리기
    }
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
    ctx.stroke();

    // 우측 파형 그리기
    let rightAmplitude = baseAmplitude * rightVolume;
    let rightAngularFreq = 2 * Math.PI * rightFreq;

    ctx.beginPath();
    for (let x = 0; x < canvas.width / (window.devicePixelRatio || 1); x++) {
        let t = x / scaleFactor;
        let y = rightAmplitude * Math.sin(rightAngularFreq * t + (rightPhase * Math.PI / 180));
        ctx.lineTo(x, centerY - y);  // 중앙을 기준으로 파형을 그리기
    }
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.stroke();
}

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
    drawWaveform(leftFreq, leftPhase, leftVolume, rightFreq, rightPhase, rightVolume); // 파형 그리기
    let phaseOffsetLeft = (leftPhase / 360) * (2 * Math.PI);
    let phaseOffsetRight = (rightPhase / 360) * (2 * Math.PI);

    // 좌측 채널 맞춤형 파형 생성
    let leftReal = new Float32Array([0, Math.cos(phaseOffsetLeft)]);
    let leftImag = new Float32Array([0, Math.sin(phaseOffsetLeft)]);
    let leftWave = audioContext.createPeriodicWave(leftReal, leftImag);

    // 좌측 채널 오실레이터 설정
    leftOscillator = audioContext.createOscillator();
    leftOscillator.frequency.setValueAtTime(leftFreq, audioContext.currentTime);
    leftOscillator.setPeriodicWave(leftWave);

    leftGainNode.gain.setValueAtTime(leftVolume, audioContext.currentTime);
    leftPanner.pan.setValueAtTime(-1, audioContext.currentTime);  // 좌측 채널로 소리 분리

    leftOscillator.connect(leftGainNode).connect(leftPanner).connect(audioContext.destination);
    leftOscillator.start();

    // 우측 채널 맞춤형 파형 생성
    let rightReal = new Float32Array([0, Math.cos(phaseOffsetRight)]);
    let rightImag = new Float32Array([0, Math.sin(phaseOffsetRight)]);
    let rightWave = audioContext.createPeriodicWave(rightReal, rightImag);

    // 우측 채널 오실레이터 설정
    rightOscillator = audioContext.createOscillator();
    rightOscillator.frequency.setValueAtTime(rightFreq, audioContext.currentTime);
    rightOscillator.setPeriodicWave(rightWave);

    rightGainNode.gain.setValueAtTime(rightVolume, audioContext.currentTime);
    rightPanner.pan.setValueAtTime(1, audioContext.currentTime);  // 우측 채널로 소리 분리

    rightOscillator.connect(rightGainNode).connect(rightPanner).connect(audioContext.destination);
    rightOscillator.start();
}

function stopSound() {
    if (leftOscillator) leftOscillator.stop();
    if (rightOscillator) rightOscillator.stop();
}
