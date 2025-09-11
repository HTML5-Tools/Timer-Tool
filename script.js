// DOM要素の取得
const repeating = document.getElementById("repeating");
const time = document.getElementById("time");
const repeat = document.getElementById("repeat");
const interval = document.getElementById("interval");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const reset = document.getElementById("reset");
const timerContainer = document.getElementById("timer");
const timeleftDisplay = document.getElementById("timeleft");
const sound = document.getElementById("sound");
const saveSettingsButton = document.getElementById("saveSettings");

// グローバル変数
let timerId = null;
let intervalTimerId = null;
let timeLeft;
let intervalLeft;
let repeatCount;
let isPaused = false;

// --- UI管理関数 ---

function toggleInputs(isDisabled) {
    time.disabled = isDisabled;
    repeating.disabled = isDisabled;
    if (isDisabled) {
        repeat.disabled = true;
        interval.disabled = true;
    } else {
        repeatingCheck();
    }
}

function repeatingCheck() {
    if (repeating.checked) {
        repeat.disabled = false;
        interval.disabled = false;
    } else {
        repeat.disabled = true;
        interval.disabled = true;
    }
}

function updateUIForState(state) {
    switch (state) {
        case 'running':
            toggleInputs(true);
            start.disabled = true;
            stop.disabled = false;
            break;
        case 'paused':
            toggleInputs(true);
            start.disabled = false;
            stop.disabled = true;
            break;
        case 'ready':
            toggleInputs(false);
            return;
        case 'end':
        default:
            start.disabled = false;
            stop.disabled = true;
            break;
    }
}

// --- サウンド管理関数 ---
function stopSound() {
    sound.pause();
    sound.currentTime = 0;
    sound.loop = false;
}

// --- LocalStorage関連の関数 ---
// 設定値のみ保存
function saveSettings() {
    localStorage.setItem('time', time.value);
    localStorage.setItem('repeating', repeating.checked);
    localStorage.setItem('repeat', repeat.value);
    localStorage.setItem('interval', interval.value);
    window.alert("設定を保存しました。");
}

// 設定値のみ復元
function loadSettings() {
    if (localStorage.getItem("notFirstTime") === null) {
        localStorage.setItem("notFirstTime", "true");
        repeating.checked = true;
    } else {
        const storedTime = localStorage.getItem("time");
        if (storedTime !== null) time.value = storedTime;

        const storedRepeat = localStorage.getItem("repeat");
        if (storedRepeat !== null) repeat.value = storedRepeat;

        const storedInterval = localStorage.getItem("interval");
        if (storedInterval !== null) interval.value = storedInterval;

        const storedRepeating = localStorage.getItem("repeating");
        if (storedRepeating !== null) repeating.checked = (storedRepeating === "true");
    }
}

// --- タイマーのコアロジック ---
// 進行状況の保存・復元は削除

function startInterval() {
    intervalLeft = parseInt(interval.value);
    timerContainer.setAttribute('timerColor', 'interval');
    timeleftDisplay.textContent = `次の開始まであと ${intervalLeft} 秒`;
    intervalTimerId = setInterval(updateInterval, 1000);
}

function updateInterval() {
    intervalLeft--;
    if (intervalLeft > 0) {
        timeleftDisplay.textContent = `次の開始まであと ${intervalLeft} 秒`;
    } else {
        clearInterval(intervalTimerId);
        intervalTimerId = null;
        timeLeft = parseInt(time.value);
        timeleftDisplay.textContent = timeLeft;
        timerContainer.setAttribute('timerColor', 'normal');
        timerId = setInterval(updateTimer, 1000);
    }
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timerId);
        timerId = null;

        if (repeating.checked && repeatCount > 1) {
            sound.currentTime = 0;
            sound.play();
            repeatCount--;
            const intervalValue = parseInt(interval.value, 10);
            if (intervalValue > 0) {
                startInterval();
            } else {
                timeLeft = parseInt(time.value);
                timeleftDisplay.textContent = timeLeft;
                timerContainer.setAttribute('timerColor', 'normal');
                timerId = setInterval(updateTimer, 1000);
            }
        } else {
            timerContainer.setAttribute('timerColor', 'end');
            sound.currentTime = 0;
            sound.loop = true;
            sound.play();
            isPaused = false;
            updateUIForState('end');
        }
    } else {
        timeLeft--;
        timeleftDisplay.textContent = timeLeft;
    }
}

function valueCheck() {
    const timeValue = parseInt(time.value, 10);
    if (isNaN(timeValue)) {
        alert("時間が入力されていない、もしくは形式が不正です。");
        return;
    }
    if (timeValue <= 0){
        alert("時間は1以上の値を入力してください。");
        return;
    }

    if (repeating.checked) {
        const repeatValue = parseInt(repeat.value, 10);
        const intervalValue = parseInt(interval.value, 10);
        if (isNaN(repeatValue)) {
            alert("繰り返し回数が入力されていない、もしくは形式が不正です。");
            return;
        }
        if (isNaN(intervalValue)) {
            alert("１回ごとに開ける間隔が入力されていない、もしくは形式が不正です。");
            return;
        }
        if (intervalValue < 0) {
            alert("１回ごとに開ける間隔は0以上の値を入力してください。");
            return;
        }
    }
    startTimer();
}

function startTimer() {
    stopSound();
    if (timerId !== null || intervalTimerId !== null) return;

    updateUIForState('running');

    if (isPaused) {
        isPaused = false;
        if (intervalLeft > 0) {
            timerContainer.setAttribute('timerColor', 'interval');
            intervalTimerId = setInterval(updateInterval, 1000);
            saveTimerState();
        } else {
            timerContainer.setAttribute('timerColor', 'normal');
            timerId = setInterval(updateTimer, 1000);
            saveTimerState();
        }
    } else {
        timerContainer.setAttribute('timerColor', 'normal');
        timeLeft = parseInt(time.value);
        repeatCount = repeating.checked ? parseInt(repeat.value) : 1;
        timeleftDisplay.textContent = timeLeft;
        timerId = setInterval(updateTimer, 1000);
        saveTimerState();
    }
    timerContainer.scrollIntoView({
        behavior: "smooth"
    });
}

function stopTimer() {
    clearInterval(timerId);
    clearInterval(intervalTimerId);
    timerId = null;
    intervalTimerId = null;
    isPaused = true;
    updateUIForState('paused');
    saveTimerState(); // 停止状態を保存
}

function resetTimer() {
    stopSound();
    clearInterval(timerId);
    clearInterval(intervalTimerId);
    timerId = null;
    intervalTimerId = null;
    isPaused = false;
    const timeValue = parseInt(time.value, 10);
    if (isNaN(timeValue)) {
        timeLeft = 0;
        timeleftDisplay.textContent = 0;
    } else {
        timeLeft = timeValue;
        timeleftDisplay.textContent = timeLeft;
    }
    timerContainer.setAttribute('timerColor', 'ready');
    updateUIForState('ready');
}

function checkTimeVal(){
    if (time.value > 0 && time.value !== "" && !isNaN(time.value)) {
        timeleftDisplay.textContent = parseInt(time.value);
    }
}

// --- 初期化処理 ---

function initialize() {
    // 設定値のみ復元
    loadSettings();
    repeatingCheck();

    // タイマー状態はリセット
    resetTimer();
}

// --- イベントリスナーの設定 ---
// // 入力値変更時に設定を保存
// time.addEventListener("change", saveSettings);
// repeat.addEventListener("change", saveSettings);
// interval.addEventListener("change", saveSettings);
// repeating.addEventListener("change", saveSettings);
saveSettingsButton.addEventListener("click", saveSettings);
start.addEventListener("click", valueCheck);
stop.addEventListener("click", stopTimer);
reset.addEventListener("click", resetTimer);
repeating.addEventListener("change", repeatingCheck);
time.addEventListener("change", () => {
    if (time.value < 1 || time.value == "" || isNaN(time.value)){
        time.value = 1;
    }
    timeleftDisplay.textContent = parseInt(time.value);
    checkTimeVal();
});
repeat.addEventListener("change", () => {
    if (repeat.value < 1 || repeat.value == "" || isNaN(repeat.value)){
        repeat.value = 1;
    }
});
interval.addEventListener("change", () => {
    if (interval.value < 0 || interval.value == "" || isNaN(interval.value)){
        interval.value = 0;
    }
});

// 初期化処理の実行
initialize();