let isPlaying = [false, false, false]; // حالة التشغيل لكل إذاعة
let startTime = [0, 0, 0];  // حفظ وقت البداية لكل إذاعة
let timerInterval = [null, null, null];  // مؤقتات لكل إذاعة

// إعدادات الإذاعات
const radios = [
    {
        toggleButton: document.getElementById("toggleButton"),
        audio: document.getElementById("quranAudio"),
        seekBar: document.getElementById("seekBar"),
        currentTimeDisplay: document.getElementById("currentTime"),
        volumeControl: document.getElementById("volumeControl"),
        volumeIcon: document.getElementById("volumeIcon"),
    },
    {
        toggleButton: document.getElementById("toggleButtonSaudi"),
        audio: document.getElementById("quranAudioSaudi"),
        seekBar: document.getElementById("seekBarSaudi"),
        currentTimeDisplay: document.getElementById("currentTimeSaudi"),
        volumeControl: document.getElementById("volumeControlSaudi"),
        volumeIcon: document.getElementById("volumeIconSaudi"),
    },
    {
        toggleButton: document.getElementById("toggleButtonSaudiYear"),
        audio: document.getElementById("quranAudioSaudiYear"),
        seekBar: document.getElementById("seekBarSaudiYear"),
        currentTimeDisplay: document.getElementById("currentTimeSaudiYear"),
        volumeControl: document.getElementById("volumeControlSaudiYear"),
        volumeIcon: document.getElementById("volumeIconSaudiYear"),
    }
];

// عند تعديل مستوى الصوت من الشريط
function setVolumeControl(audio, volumeControl, volumeIcon) {
    volumeControl.addEventListener("input", (e) => {
        const volume = e.target.value / 1;
        audio.contentWindow.postMessage(
            `{"event":"command","func":"setVolume","args":[${volume}]}`,
            "*"
        );

        // تحديث الأيقونة بناءً على مستوى الصوت
        if (volume === 0) {
            volumeIcon.textContent = "🔇";  // أيقونة الصمت
        } else if (volume <= 0.5) {
            volumeIcon.textContent = "🔉";  // أيقونة الصوت المنخفض
        } else {
            volumeIcon.textContent = "🔊";  // أيقونة الصوت العالي
        }
    });
}

// تشغيل/إيقاف الراديو
function toggleRadio(index) {
    radios[index].toggleButton.addEventListener("click", () => {
        if (!isPlaying[index]) {
            radios[index].audio.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            radios[index].toggleButton.textContent = "إيقاف";
            isPlaying[index] = true;
            startTime[index] = Date.now();
            startTimer(index);
        } else {
            radios[index].audio.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            radios[index].toggleButton.textContent = "تشغيل";
            isPlaying[index] = false;
            stopTimer(index);
        }
    });
}

// بدأ المؤقت
function startTimer(index) {
    timerInterval[index] = setInterval(() => {
        if (isPlaying[index]) {
            const elapsed = Math.floor((Date.now() - startTime[index]) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;

            radios[index].currentTimeDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
    }, 1000);
}

// إيقاف المؤقت
function stopTimer(index) {
    clearInterval(timerInterval[index]);
}

// تحديث شريط الوقت
function updateSeekBar(audio, seekBar) {
    setInterval(() => {
        audio.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*');
        audio.contentWindow.postMessage('{"event":"command","func":"getDuration","args":""}', '*');
    }, 1000);

    window.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        if (data.info) {
            if (data.info.currentTime) {
                const current = Math.floor(data.info.currentTime);
                seekBar.value = current;
            }

            if (data.info.duration) {
                const duration = Math.floor(data.info.duration);
                seekBar.max = duration;
            }
        }
    });
}

// تعيين الإعدادات لكل راديو
radios.forEach((radio, index) => {
    setVolumeControl(radio.audio, radio.volumeControl, radio.volumeIcon);
    toggleRadio(index);
    updateSeekBar(radio.audio, radio.seekBar);
});

// لتحديد مستوى الصوت عند تحميل الصفحة
function setInitialVolume(audio, volumeControl) {
    audio.contentWindow.postMessage('{"event":"command","func":"getVolume","args":""}', '*');

    window.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.info && data.info.volume !== undefined) {
            const volume = data.info.volume;  // القيمة بين 0 و 1
            volumeControl.value = volume * 100;  // تحديث الشريط
        }
    });

    // تأكد من أن الصوت عند تحميل الصفحة يكون مضبوط
    audio.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[1]}', '*');
}

// تعيين الصوت عند تحميل الصفحة لجميع الإذاعات
radios.forEach((radio) => {
    setInitialVolume(radio.audio, radio.volumeControl);
});

