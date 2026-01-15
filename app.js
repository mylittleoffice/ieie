// Uygulama durumu
let currentDay = 0;
let learnedWords = JSON.parse(localStorage.getItem('learnedWords')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// DOM elementleri
const todayWordsContainer = document.getElementById('todayWords');
const learnedWordsList = document.getElementById('learnedWordsList');
const currentDateElement = document.getElementById('currentDate');
const progressBar = document.getElementById('progress');
const totalWordsElement = document.getElementById('totalWords');
const prevDayButton = document.getElementById('prevDay');
const nextDayButton = document.getElementById('nextDay');
const themeToggleButton = document.getElementById('themeToggle');
const statsElement = document.getElementById('stats');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Tema ayarı
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i> Aydınlık Tema';
    }
    
    // Günü localStorage'dan yükle veya varsayılan olarak 0 (gün 1) yap
    currentDay = parseInt(localStorage.getItem('currentDay')) || 0;
    if (currentDay >= wordsDatabase.length) {
        currentDay = wordsDatabase.length - 1;
    }
    
    // İlerlemeyi güncelle
    updateProgress();
    
    // Bugünün kelimelerini yükle
    loadTodayWords();
    
    // Öğrenilen kelimeleri yükle
    loadLearnedWords();
    
    // Event listener'ları ekle
    prevDayButton.addEventListener('click', goToPreviousDay);
    nextDayButton.addEventListener('click', goToNextDay);
    themeToggleButton.addEventListener('click', toggleTheme);
    
    // Sayfaya sıfırlama butonu ekle
    addResetButton();
});

// Bugünün kelimelerini yükle
function loadTodayWords() {
    // Gün başlığını güncelle
    currentDateElement.textContent = `Gün ${currentDay + 1}`;
    
    // Kelime kartlarını temizle
    todayWordsContainer.innerHTML = '';
    
    // Mevcut günün kelimelerini al
    const todayWords = wordsDatabase[currentDay] || [];
    
    // Her kelime için bir kart oluştur
    todayWords.forEach((word, index) => {
        const isLearned = learnedWords.some(w => 
            w.arabic === word.arabic && w.day === currentDay
        );
        
        const wordCard = document.createElement('div');
        wordCard.className = `word-card ${isLearned ? 'learned' : ''}`;
        wordCard.innerHTML = `
            <div class="arabic-word">${word.arabic}</div>
            <div class="transcription">${word.transcription}</div>
            <div class="meaning ${isLearned ? 'show' : ''}">${word.meaning}</div>
            <div class="word-actions">
                <button class="action-btn ${isLearned ? 'learned' : ''}" onclick="toggleLearned(${currentDay}, ${index}, this)">
                    <i class="fas ${isLearned ? 'fa-check-circle' : 'fa-circle'}"></i>
                    ${isLearned ? 'Öğrenildi' : 'Öğrenildi olarak işaretle'}
                </button>
                <button class="action-btn" onclick="speakWord('${word.arabic}')">
                    <i class="fas fa-volume-up"></i> Dinle
                </button>
            </div>
        `;
        
        // Kelime kartına tıklayınca anlamını göster/gizle
        wordCard.addEventListener('click', function(e) {
            // Eğer tıklanan element bir buton değilse
            if (!e.target.closest('.action-btn')) {
                const meaningElement = this.querySelector('.meaning');
                meaningElement.classList.toggle('show');
            }
        });
        
        todayWordsContainer.appendChild(wordCard);
    });
    
    // Navigasyon butonlarını güncelle
    updateNavigationButtons();
}

// Öğrenilen kelimeleri yükle
function loadLearnedWords() {
    // Öğrenilen kelimeleri günlere göre grupla
    const wordsByDay = {};
    
    learnedWords.forEach(word => {
        if (!wordsByDay[word.day]) {
            wordsByDay[word.day] = [];
        }
        wordsByDay[word.day].push(word);
    });
    
    // Günleri sırala (büyükten küçüğe)
    const sortedDays = Object.keys(wordsByDay).sort((a, b) => b - a);
    
    // HTML oluştur
    learnedWordsList.innerHTML = '';
    
    if (sortedDays.length === 0) {
        learnedWordsList.innerHTML = '<p style="text-align: center; color: var(--apple-gray);">Henüz öğrenilen kelime yok. İlk kelimeleri öğrenmeye başlayın!</p>';
        return;
    }
    
    sortedDays.forEach(day => {
        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        
        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.innerHTML = `<span>Gün ${parseInt(day) + 1}</span><span>${wordsByDay[day].length} kelime</span>`;
        
        const dayWordsContainer = document.createElement('div');
        dayWordsContainer.className = 'day-words';
        
        wordsByDay[day].forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'learned-word-item';
            wordItem.innerHTML = `
                <div class="learned-arabic">${word.arabic}</div>
                <div class="learned-meaning">${word.meaning}</div>
            `;
            dayWordsContainer.appendChild(wordItem);
        });
        
        daySection.appendChild(dayTitle);
        daySection.appendChild(dayWordsContainer);
        learnedWordsList.appendChild(daySection);
    });
    
    // Toplam kelime sayısını güncelle
    totalWordsElement.textContent = learnedWords.length;
    
    // İstatistikleri güncelle
    const totalDays = Object.keys(wordsByDay).length;
    const totalPercent = ((learnedWords.length / (wordsDatabase.length * 5)) * 100).toFixed(1);
    statsElement.textContent = `${totalDays} günde toplam ${learnedWords.length} kelime öğrenildi (${totalPercent}%)`;
}

// İlerlemeyi güncelle
function updateProgress() {
    // Toplam kelime sayısı
    const totalWordsCount = wordsDatabase.length * 5;
    
    // Öğrenilen kelime yüzdesi
    const progressPercentage = (learnedWords.length / totalWordsCount) * 100;
    
    // İlerleme çubuğunu güncelle
    progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
}

// Kelimeyi öğrenildi olarak işaretle/kaldır
function toggleLearned(day, wordIndex, button) {
    const word = wordsDatabase[day][wordIndex];
    const wordCard = button.closest('.word-card');
    
    // Kelimeyi öğrenilenler listesinde ara
    const wordIndexInLearned = learnedWords.findIndex(w => 
        w.arabic === word.arabic && w.day === day
    );
    
    if (wordIndexInLearned === -1) {
        // Kelimeyi öğrenilenlere ekle
        learnedWords.push({
            arabic: word.arabic,
            transcription: word.transcription,
            meaning: word.meaning,
            day: day
        });
        
        // Butonu ve kartı güncelle
        button.classList.add('learned');
        button.innerHTML = '<i class="fas fa-check-circle"></i> Öğrenildi';
        wordCard.classList.add('learned');
        
        // Anlamı göster
        wordCard.querySelector('.meaning').classList.add('show');
    } else {
        // Kelimeyi öğrenilenlerden çıkar
        learnedWords.splice(wordIndexInLearned, 1);
        
        // Butonu ve kartı güncelle
        button.classList.remove('learned');
        button.innerHTML = '<i class="fas fa-circle"></i> Öğrenildi olarak işaretle';
        wordCard.classList.remove('learned');
    }
    
    // LocalStorage'a kaydet
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
    
    // Öğrenilen kelimeler listesini ve ilerlemeyi güncelle
    loadLearnedWords();
    updateProgress();
}

// Kelimeyi sesli oku (tarayıcı desteği varsa)
function speakWord(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA'; // Arapça (Suudi Arabistan) aksanı
        utterance.rate = 0.8; // Okuma hızı
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Tarayıcınız ses sentezini desteklemiyor.");
    }
}

// Navigasyon butonlarını güncelle
function updateNavigationButtons() {
    nextDayButton.disabled = currentDay >= wordsDatabase.length - 1;
    prevDayButton.disabled = currentDay <= 0;
}

// Önceki güne git
function goToPreviousDay() {
    if (currentDay > 0) {
        currentDay--;
        localStorage.setItem('currentDay', currentDay);
        loadTodayWords();
    }
}

// Sonraki güne git
function goToNextDay() {
    if (currentDay < wordsDatabase.length - 1) {
        currentDay++;
        localStorage.setItem('currentDay', currentDay);
        loadTodayWords();
    }
}

// Tema değiştir
function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i> Aydınlık Tema';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-moon"></i> Koyu Tema';
    }
    
    localStorage.setItem('darkMode', isDarkMode);
}

// Sayfaya sıfırlama butonu ekle
function addResetButton() {
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-outline';
    resetButton.style.marginTop = '20px';
    resetButton.style.fontSize = '0.8rem';
    resetButton.innerHTML = '<i class="fas fa-redo"></i> İlerlemeyi Sıfırla';
    resetButton.onclick = resetProgress;
    document.querySelector('.controls').appendChild(resetButton);
}

// Sayfayı sıfırla
function resetProgress() {
    if (confirm("Tüm ilerlemeniz sıfırlanacak. Emin misiniz?")) {
        localStorage.removeItem('learnedWords');
        localStorage.removeItem('currentDay');
        localStorage.removeItem('darkMode');
        currentDay = 0;
        learnedWords = [];
        isDarkMode = false;
        document.body.classList.remove('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-moon"></i> Tema Değiştir';
        loadTodayWords();
        loadLearnedWords();
        updateProgress();
    }
}

// app.js'ye ekleyebileceğiniz ek fonksiyonlar

// Kur'an'daki geçiş sıklığını göster
function showWordFrequency(frequency) {
    if (frequency > 1000) {
        return `<span class="frequency high">(${frequency}+ geçiyor)</span>`;
    } else if (frequency > 500) {
        return `<span class="frequency medium">(${frequency}+ geçiyor)</span>`;
    } else {
        return `<span class="frequency low">(${frequency}+ geçiyor)</span>`;
    }
}

// Kelime kartına sıklık bilgisi eklemek için CSS
const style = document.createElement('style');
style.textContent = `
    .frequency {
        font-size: 0.8rem;
        margin-left: 8px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: normal;
    }
    .frequency.high {
        background-color: rgba(52, 199, 89, 0.2);
        color: #34c759;
    }
    .frequency.medium {
        background-color: rgba(0, 113, 227, 0.2);
        color: #0071e3;
    }
    .frequency.low {
        background-color: rgba(134, 134, 139, 0.2);
        color: #86868b;
    }
`;
document.head.appendChild(style);

// Gelişmiş istatistikler için
function showAdvancedStats() {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'advanced-stats';
    statsDiv.innerHTML = `
        <h3>Kur'an Kelime İstatistikleri</h3>
        <p>Öğrendiğiniz kelimeler Kur'an'ın %<span id="quranPercent">0</span>'ını kapsıyor</p>
        <p>En çok geçen 100 kelimeyi öğrenince Kur'an'ın %50'sini anlayabilirsiniz</p>
    `;
    
    // İstatistikleri hesapla
    const learnedCount = learnedWords.length;
    const quranCoverage = (learnedCount / 100 * 0.7).toFixed(1); // Basit bir hesaplama
    document.getElementById('quranPercent').textContent = quranCoverage;
    
    return statsDiv;
}

// Günlük hedef göster
function showDailyGoal() {
    const goalDiv = document.createElement('div');
    goalDiv.className = 'daily-goal';
    goalDiv.innerHTML = `
        <h4>📖 Bugünün Hedefi</h4>
        <p>5 Kur'an kelimesi öğren</p>
        <p><small>Bu kelimeler Kur'an'da toplam <span id="todayFrequency">0</span>+ kez geçiyor</small></p>
    `;
    return goalDiv;
}