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
        case 'end':
        default:
            toggleInputs(false);
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

function saveSettings() {
    localStorage.setItem('time', time.value);
    localStorage.setItem('repeating', repeating.checked);
    localStorage.setItem('repeat', repeat.value);
    localStorage.setItem('interval', interval.value);
}

function loadSettings() {
    if (localStorage.getItem("notFirstTime") === null) {
        localStorage.setItem("notFirstTime", "true");
        repeating.checked = false;
    } else {
        const storedTime = localStorage.getItem("time");
        if (storedTime !== null) time.value = storedTime;

        const storedRepeat = localStorage.getItem("repeat");
        if (storedRepeat !== null) repeat.value = storedRepeat;

        const storedInterval = localStorage.getItem("interval");
        if (storedInterval !== null) interval.value = storedInterval;

        const storedRepeating = localStorage.getItem("repeating");
        if (storedRepeating !== null) repeating.checked = storedRepeating === "true";
    }
}

function saveTimerState() {
    const state = {
        timeLeft: timeLeft,
        intervalLeft: intervalLeft,
        repeatCount: repeatCount,
        isPaused: isPaused,
        isRunning: timerId !== null || intervalTimerId !== null,
        timerColor: timerContainer.getAttribute('timerColor')
    };
    localStorage.setItem('timerState', JSON.stringify(state));
}

function clearTimerState() {
    localStorage.removeItem('timerState');
}

function loadTimerState() {
    const savedStateJSON = localStorage.getItem('timerState');
    if (!savedStateJSON) return null;

    const savedState = JSON.parse(savedStateJSON);
    if (savedState.isRunning || savedState.isPaused) {
        return savedState;
    }
    return null;
}

if(localStorage.getItem("notFirstTime")) {
    loadSettings();
    timeleftDisplay.textContent = time.value || 10; // 初回以降の表示設定
}; // 初回以降の設定読み込み

// --- タイマーのコアロジック ---

function startInterval() {
    intervalLeft = parseInt(interval.value);
    timerContainer.setAttribute('timerColor', 'interval');
    timeleftDisplay.textContent = `次の開始まであと ${intervalLeft} 秒`;
    intervalTimerId = setInterval(updateInterval, 1000);
    saveTimerState();
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
    if (timerId !== null || intervalTimerId !== null) {
        saveTimerState();
    }
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timerId);
        timerId = null;

        if (repeating.checked && repeatCount > 1) {
            // インターバル開始時に音を一度だけ再生
            sound.currentTime = 0;
            sound.play();
            repeatCount--;
            const intervalValue = parseInt(interval.value, 10);
            if (intervalValue > 0) {
                startInterval();
            } else {
                // 間隔が0秒の場合は、インターバルをスキップしてすぐに次のタイマーを開始
                timeLeft = parseInt(time.value);
                timeleftDisplay.textContent = timeLeft;
                timerContainer.setAttribute('timerColor', 'normal');
                timerId = setInterval(updateTimer, 1000);
            }
        } else {
            clearTimerState(); // 終了時に状態をクリア
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
    if (timerId !== null || intervalTimerId !== null) {
        saveTimerState(); // 1秒ごとに状態を保存
    }
}

function valueCheck() {
    const timeValue = parseInt(time.value, 10);
    if (isNaN(timeValue)) {
        alert("時間が入力されていない、もしくは形式が不正です。");
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

    saveSettings();

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
        } else {
            timerContainer.setAttribute('timerColor', 'normal');
            timerId = setInterval(updateTimer, 1000);
        }
    } else {
        timerContainer.setAttribute('timerColor', 'normal');
        timeLeft = parseInt(time.value);
        repeatCount = repeating.checked ? parseInt(repeat.value) : 1;
        timeleftDisplay.textContent = timeLeft;
        timerId = setInterval(updateTimer, 1000);
        saveTimerState();
    }
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
    clearTimerState(); // 状態をクリア
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

// --- 初期化処理 ---

function initialize() {
    // 1. まず設定値を読み込んで入力欄に反映させる
    loadSettings();
    repeatingCheck();

    // 2. 次に、保存されたタイマーの実行状態があるか確認する
    const savedState = loadTimerState();
    if (savedState) {
        // 状態があれば、タイマーを復元する
        timeLeft = savedState.timeLeft;
        intervalLeft = savedState.intervalLeft;
        repeatCount = savedState.repeatCount;
        isPaused = true; // 常に一時停止状態で復元
        timerContainer.setAttribute('timerColor', savedState.timerColor);
        timeleftDisplay.textContent = savedState.timerColor === 'interval' ? `次の開始まであと ${savedState.intervalLeft} 秒` : savedState.timeLeft;
        updateUIForState('paused');
    } else {
        // 状態がなければ、UIをリセットする
        resetTimer();
    }
}

// --- イベントリスナーの設定 ---

repeating.addEventListener("change", repeatingCheck);
start.addEventListener("click", valueCheck);
stop.addEventListener("click", stopTimer);
reset.addEventListener("click", resetTimer);

// タイトルクリックでトップへ移動するスクリプト
window.addEventListener('DOMContentLoaded', () => {
    const title_elem = document.getElementById('title');
    console.log('title_elem:', title_elem);
    if (title_elem) {
        title_elem.addEventListener('click', () => {
        window.location.href = 'https://html5tools.netlify.app/';
    });
    }
});