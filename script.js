const hanziData = [
    { hanzi: '一', pinyin: 'yī', meaning: 'one' },
    { hanzi: '二', pinyin: 'èr', meaning: 'two' },
    { hanzi: '三', pinyin: 'sān', meaning: 'three' },
    { hanzi: '四', pinyin: 'sì', meaning: 'four' },
    { hanzi: '五', pinyin: 'wǔ', meaning: 'five' },
    { hanzi: '六', pinyin: 'liù', meaning: 'six' },
    { hanzi: '七', pinyin: 'qī', meaning: 'seven' },
    { hanzi: '八', pinyin: 'bā', meaning: 'eight' },
    { hanzi: '九', pinyin: 'jiǔ', meaning: 'nine' },
    { hanzi: '十', pinyin: 'shí', meaning: 'ten' }
];

// 全局变量
let currentCardIndex = 0;
let currentPractice = 0;
let practiceScores = [0, 0, 0, 0]; // 每个练习的得分
let practiceQuestions = [0, 0, 0, 0]; // 每个练习的题目数
let currentQuestion = 0;
let isAnswered = false;
let currentAudioHanzi = null; // 单题音频题当前正确汉字
let currentTypingAnswer = '';
let currentQuestionMeta = null; // 记录当前题元信息
let practiceDetails = [[], [], [], []]; // 记录每个练习的题目详情

// 页面切换函数
function showMain() {
    document.getElementById('main-page').classList.remove('hidden');
    document.getElementById('review-page').classList.add('hidden');
    document.getElementById('practice-page').classList.add('hidden');
    document.getElementById('summary-page').classList.add('hidden');
    document.getElementById('detail-page').classList.add('hidden');
}

function showReview() {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('review-page').classList.remove('hidden');
    currentCardIndex = 0;
    updateCard();
}

function showPractice() {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('practice-page').classList.remove('hidden');
    // 展示练习中心
    document.getElementById('practice-hub').classList.remove('hidden');
    document.getElementById('question-page').classList.add('hidden');
    // 确保所有题目相关元素在练习中心时隐藏
    document.getElementById('question-text').classList.add('hidden');
    document.getElementById('options-box').classList.add('hidden');
    document.getElementById('typing-input').classList.add('hidden');
    document.getElementById('typing-submit').classList.add('hidden');
    document.getElementById('audio-question-btn').classList.add('hidden');
    document.getElementById('next-practice-btn').classList.add('hidden');
    // 设置按钮为 Home，返回主页面
    const btn = document.getElementById('practice-header-btn');
    btn.textContent = 'Home';
    btn.onclick = showMain;
    updateHubLocks();
}

// 复习模块函数
function updateCard() {
    const data = hanziData[currentCardIndex];
    document.getElementById('hanzi-display').textContent = data.hanzi;
    document.getElementById('pinyin-display').textContent = data.pinyin;
    document.getElementById('meaning-display').textContent = data.meaning;
    document.getElementById('card-counter').textContent = `${currentCardIndex + 1} / 10`;
    
    // 重置卡片状态
    document.getElementById('flashcard').classList.remove('flipped');
    
    // 更新按钮状态
    document.getElementById('prev-btn').disabled = currentCardIndex === 0;
    document.getElementById('next-btn').disabled = currentCardIndex === 9;

    // 同步更新音频资源
    const reviewAudio = document.getElementById('review-audio');
    if (reviewAudio) {
        reviewAudio.src = getAudioSrcForHanzi(data.hanzi);
        // 预加载，失败时不会打断流程
        try { reviewAudio.load(); } catch (e) {}
    }
}

function flipCard() {
    document.getElementById('flashcard').classList.toggle('flipped');
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        updateCard();
    }
}

function nextCard() {
    if (currentCardIndex < 9) {
        currentCardIndex++;
        updateCard();
    }
}

// 练习中心：带解锁逻辑
let sessionTargets = []; // 本次练习的题目目标集（用于不重复）
const practiceCompleted = [false, false, false, false];
function updateHubLocks() {
    for (let i = 1; i < 4; i++) {
        const card = document.getElementById(`start-${i}`);
        const locked = !practiceCompleted[i - 1];
        card.classList.toggle('locked', locked);
    }
}

function startPractice(index) {
    // 若未解锁则不响应
    // 解锁限制：除练习1外，必须前一项完成
    if (index > 0 && !practiceCompleted[index - 1]) return;

    currentPractice = index;
    currentQuestion = 0;
    practiceScores[index] = 0;
    practiceQuestions[index] = 0;
    practiceDetails[index] = [];
    isAnswered = false;

    // 准备题目池
    if (index === 0) {
        sessionTargets = shuffleArray([4,5,6,7,8,9,10]).slice(0,4); // 练习1：数字4~10
    } else if (index === 1) {
        // 练习2：随机4个汉字
        sessionTargets = shuffleArray([...hanziData]).slice(0,4);
    } else if (index === 2) {
        // 练习3：随机生成4个1-99的数字（排除0）
        sessionTargets = shuffleArray(Array.from({length: 99}, (_, i) => i + 1)).slice(0, 4);
    } else if (index === 3) {
        // 练习4：随机4个汉字用于音频
        sessionTargets = shuffleArray([...hanziData]).slice(0,4);
    }

    document.getElementById('practice-hub').classList.add('hidden');
    document.getElementById('question-page').classList.remove('hidden');
    // 进入题目页时显示 Next 按钮
    document.getElementById('next-practice-btn').classList.remove('hidden');
    // 设置按钮为 Back，返回 practice-hub
    const btn = document.getElementById('practice-header-btn');
    btn.textContent = 'Back';
    btn.onclick = backToHub;
    
    // 为练习4添加特殊类名
    if (index === 3) {
        document.getElementById('question-page').classList.add('practice-4');
    } else {
        document.getElementById('question-page').classList.remove('practice-4');
    }
    
    generateQuestionNew();
}

function backToHub() {
    document.getElementById('question-page').classList.add('hidden');
    document.getElementById('practice-hub').classList.remove('hidden');
    // 确保所有题目相关元素在返回练习中心时隐藏
    document.getElementById('question-text').classList.add('hidden');
    document.getElementById('options-box').classList.add('hidden');
    document.getElementById('typing-input').classList.add('hidden');
    document.getElementById('typing-submit').classList.add('hidden');
    document.getElementById('audio-question-btn').classList.add('hidden');
    document.getElementById('next-practice-btn').classList.add('hidden');
    // 设置按钮为 Home，返回主页面
    const btn = document.getElementById('practice-header-btn');
    btn.textContent = 'Home';
    btn.onclick = showMain;
    updateHubLocks();
}

function generateQuestionNew() {
    isAnswered = false;
    document.getElementById('next-practice-btn').disabled = true;

    // 清空选项样式
    document.querySelectorAll('#options-box .option').forEach(option => {
        option.classList.remove('correct', 'incorrect', 'disabled');
    });

    // 控制可见性 - 先统一隐藏所有元素，然后根据题型显示需要的
    document.getElementById('question-text').classList.add('hidden');
    document.getElementById('options-box').classList.add('hidden');
    document.getElementById('audio-question-btn').classList.add('hidden');
    document.getElementById('typing-input').classList.add('hidden');
    document.getElementById('typing-submit').classList.add('hidden');
    document.getElementById('typing-input').value = '';
    document.getElementById('typing-input').classList.remove('correct','incorrect');

    if (currentPractice === 0) {
        // 兜底：题库未初始化时立即初始化
        if (!Array.isArray(sessionTargets) || sessionTargets.length < 4) {
            sessionTargets = shuffleArray([4,5,6,7,8,9,10]).slice(0,4);
            currentQuestion = 0;
        }
        // 数字 -> 汉字 （题目为阿拉伯数字 4~10）
        const number = sessionTargets[currentQuestion];
        const correctHanzi = hanziData[number - 1].hanzi;
        currentQuestionMeta = { type: 'num_to_hanzi', prompt: String(number), correctAnswer: correctHanzi };

        const wrongOptions = hanziData
            .filter(item => item.hanzi !== correctHanzi)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(item => item.hanzi);
        const allOptions = shuffleArray([...wrongOptions, correctHanzi]);

        const q = document.getElementById('question-text');
        q.textContent = String(number);
        q.classList.remove('hidden');
        // 确保选项容器可见
        document.getElementById('options-box').classList.remove('hidden');

        document.querySelectorAll('#options-box .option').forEach((option, index) => {
            option.textContent = allOptions[index];
            option.onclick = () => selectOptionNew(option, correctHanzi);
        });
    } else if (currentPractice === 1) {
        // 汉字 -> 拼音
        const item = sessionTargets[currentQuestion];
        const correctPinyin = item.pinyin;
        currentQuestionMeta = { type: 'hanzi_to_pinyin', prompt: item.hanzi, correctAnswer: correctPinyin };
        const wrongPinyins = shuffleArray(hanziData
            .filter(h => h.pinyin !== correctPinyin)
            .map(h => h.pinyin)).slice(0,3);
        const allOptions = shuffleArray([...wrongPinyins, correctPinyin]);

        const q = document.getElementById('question-text');
        q.textContent = item.hanzi;
        q.classList.remove('hidden');
        // 确保选项容器可见
        document.getElementById('options-box').classList.remove('hidden');

        document.querySelectorAll('#options-box .option').forEach((option, index) => {
            option.textContent = allOptions[index];
            option.onclick = () => selectOptionNew(option, correctPinyin);
        });
    } else if (currentPractice === 2) {
        // 练习3：打字输入汉字（0-99数字转汉字）
        const number = sessionTargets[currentQuestion];
        const targetHanzi = numberToHanzi(number);
        currentTypingAnswer = targetHanzi;
        currentQuestionMeta = { type: 'typing', prompt: String(number), correctAnswer: targetHanzi };

        const q = document.getElementById('question-text');
        q.textContent = String(number); // 屏幕中展示阿拉伯数字
        q.classList.remove('hidden');

        // 显示输入框与提交按钮，隐藏选项
        document.getElementById('options-box').classList.add('hidden');
        const input = document.getElementById('typing-input');
        const submitBtn = document.getElementById('typing-submit');
        input.classList.remove('hidden');
        submitBtn.classList.remove('hidden');
        setTimeout(()=>input.focus(), 0);

        // 回车键：未作答时提交；已作答时相当于 Next
        input.onkeydown = (e)=>{
            if(e.key==='Enter'){
                e.preventDefault();
                if (isAnswered) { nextPractice(); }
                else { submitTyping(); }
            }
        };
    } else if (currentPractice === 3) {
        // 听音 -> 选汉字
        const item = sessionTargets[currentQuestion];
        currentAudioHanzi = item.hanzi;
        currentQuestionMeta = { type: 'audio_to_hanzi', prompt: currentAudioHanzi, correctAnswer: currentAudioHanzi };
        const wrongHanzi = shuffleArray(hanziData
            .filter(h => h.hanzi !== currentAudioHanzi)
            .map(h => h.hanzi)).slice(0,3);
        const allOptions = shuffleArray([...wrongHanzi, currentAudioHanzi]);

        const btn = document.getElementById('audio-question-btn');
        btn.classList.remove('hidden');
        

        // 显示选项
        document.getElementById('options-box').classList.remove('hidden');
        document.querySelectorAll('#options-box .option').forEach((option, index) => {
            option.textContent = allOptions[index];
            option.onclick = () => selectOptionNew(option, currentAudioHanzi);
        });
    }
}

// 旧版函数保留（不再使用）

function generateHanziToPinyin() {
    const correctHanzi = hanziData[Math.floor(Math.random() * hanziData.length)];
    const correctPinyin = correctHanzi.pinyin;
    
    // 生成错误拼音选项
    const wrongPinyins = hanziData
        .filter(item => item.pinyin !== correctPinyin)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(item => item.pinyin);
    
    const allOptions = [...wrongPinyins, correctPinyin].sort(() => Math.random() - 0.5);
    
    document.getElementById('question-1').textContent = correctHanzi.hanzi;
    document.querySelectorAll('#options-1 .option').forEach((option, index) => {
        option.textContent = allOptions[index];
        option.onclick = () => selectOption(option, correctPinyin);
    });
}   

function generateAudioQuestion() {
    const correctHanzi = hanziData[Math.floor(Math.random() * hanziData.length)];
    
    // 生成错误选项
    const wrongOptions = hanziData
        .filter(item => item.hanzi !== correctHanzi.hanzi)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(item => item.hanzi);
    
    const allOptions = [...wrongOptions, correctHanzi.hanzi].sort(() => Math.random() - 0.5);
    
    document.querySelectorAll('#options-3 .option').forEach((option, index) => {
        option.textContent = allOptions[index];
        option.onclick = () => selectOption(option, correctHanzi.hanzi);
    });
}

// 旧版选择逻辑已废弃

function selectOptionNew(element, correctAnswer) {
    if (isAnswered) return;
    isAnswered = true;
    const selectedAnswer = element.textContent;
    const isCorrect = selectedAnswer === correctAnswer;

    document.querySelectorAll('#options-box .option').forEach(opt => {
        opt.classList.add('disabled');
        if (opt.textContent === correctAnswer) {
            opt.classList.add('correct');
        } else if (opt === element && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    if (isCorrect) practiceScores[currentPractice]++;
    practiceQuestions[currentPractice]++;
    if (currentQuestionMeta) {
        practiceDetails[currentPractice].push({
            prompt: currentQuestionMeta.prompt,
            yourAnswer: selectedAnswer,
            correctAnswer: currentQuestionMeta.correctAnswer,
            isCorrect
        });
    }
    updateProgress();
    document.getElementById('next-practice-btn').disabled = false;
}

function updateProgress() {
    // 完成当前练习：当答满4题时标记完成并解锁下一项
    if (practiceQuestions[currentPractice] >= 4) {
        practiceCompleted[currentPractice] = true;
        updateHubLocks();
    }
}

function nextPractice() {
    currentQuestion++;
    if (currentQuestion >= 4) {
        // 完成当前练习：返回练习中心；若四项皆完成，展示总结
        const allDone = practiceCompleted.every(v => v) || currentPractice === 3;
        backToHub();
        if (allDone && practiceCompleted[0] && practiceCompleted[1] && practiceCompleted[2]) {
            showSummary();
        }
        return;
    }
    generateQuestionNew();
}

function playAudio() {
    // 这里可以添加真实的音频播放功能
    // 目前只是模拟
    alert('播放音频: 九 (jiǔ)');
}

// 单题页面：听音题播放
function playAudioQuestion() {
    if (!currentAudioHanzi) return;
    const src = getAudioSrcForHanzi(currentAudioHanzi);
    const temp = new Audio(src);
    temp.play().catch(() => speakFallback(currentAudioHanzi));
}

// 提交打字答案
function submitTyping() {
    if (isAnswered) return;
    const input = document.getElementById('typing-input');
    const value = (input.value || '').trim();
    const isCorrect = value === currentTypingAnswer;
    isAnswered = true;
    if (isCorrect) {
        input.classList.add('correct');
        practiceScores[currentPractice]++;
    } else {
        input.classList.add('incorrect');
    }
    practiceQuestions[currentPractice]++;
    if (currentQuestionMeta) {
        practiceDetails[currentPractice].push({
            prompt: currentQuestionMeta.prompt,
            yourAnswer: value,
            correctAnswer: currentQuestionMeta.correctAnswer,
            isCorrect
        });
    }
    updateProgress();
    document.getElementById('next-practice-btn').disabled = false;
}

// 工具函数
function shuffleArray(arr) {
    return arr
        .map(v => ({ v, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(({ v }) => v);
}

function genPhone() {
    const rand4 = () => String(Math.floor(Math.random() * 9000 + 1000));
    return '1' + String(Math.floor(Math.random() * 8) + 2) + String(Math.floor(Math.random() * 8) + 1) + '-' + rand4() + '-' + rand4();
}

function phoneToHanzi(phone) {
    return phone.split('').map(ch => ch === '-' ? '-' : hanziData[parseInt(ch)].hanzi).join('');
}

function genPhoneWrongOptions(correct) {
    // 生成3个干扰项：随机替换某些位置的数字
    const idxs = [5,7,9];
    const make = i => correct.split('').map((ch, idx) => {
        if (ch === '-') return '-';
        if (idx === idxs[i]) {
            return hanziData[Math.floor(Math.random() * 10)].hanzi;
        }
        return ch;
    }).join('');
    return [make(0), make(1), make(2)];
}

// 数字转汉字（0-99）
function numberToHanzi(num) {
    if (num === 0) return '零';
    if (num <= 10) return hanziData[num - 1].hanzi;
    
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    
    if (tens === 1) {
        return ones === 0 ? '十' : '十' + hanziData[ones - 1].hanzi;
    } else {
        const tensHanzi = hanziData[tens - 1].hanzi;
        return ones === 0 ? tensHanzi + '十' : tensHanzi + '十' + hanziData[ones - 1].hanzi;
    }
}

// ===== 复习模块: 音频播放 =====
function getAudioSrcForHanzi(hanzi) {
    // 将汉字映射到音频文件名
    const map = {
        '一': 'yi',
        '二': 'er',
        '三': 'san',
        '四': 'si',
        '五': 'wu',
        '六': 'liu',
        '七': 'qi',
        '八': 'ba',
        '九': 'jiu',
        '十': 'shi'
    };
    const key = map[hanzi];
    return key ? `audio/${key}.mp3` : '';
}

function speakFallback(text) {
    console.log('=== 语音合成开始 ===');
    console.log('要播放的文本:', text);
    console.log('浏览器支持语音合成:', 'speechSynthesis' in window);
    
    try {
        // 停止任何正在播放的语音
        window.speechSynthesis.cancel();
        
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 0.8;
        utter.pitch = 1;
        utter.volume = 1;
        
        console.log('语音合成对象:', utter);
        console.log('语音合成语言:', utter.lang);
        
        // 添加事件监听器
        utter.onstart = () => console.log('语音合成开始播放');
        utter.onend = () => console.log('语音合成播放结束');
        utter.onerror = (e) => console.error('语音合成错误:', e);
        
        window.speechSynthesis.speak(utter);
        console.log('语音合成已调用');
        
    } catch (e) {
        console.error('语音合成异常:', e);
    }
}

function playReviewAudio(event) {
    if (event) event.stopPropagation();
    
    console.log('=== 开始播放复习音频 ===');
    const data = hanziData[currentCardIndex];
    console.log('当前汉字数据:', data);
    console.log('当前卡片索引:', currentCardIndex);
    
    const audioEl = document.getElementById('review-audio');
    console.log('音频元素:', audioEl);
    
    if (!audioEl) {
        console.error('找不到音频元素');
        return;
    }

    const audioSrc = getAudioSrcForHanzi(data.hanzi);
    console.log('音频源路径:', audioSrc);

    // 设置错误处理
    const onError = (e) => {
        console.error('音频文件加载失败:', audioSrc, e);
        audioEl.removeEventListener('error', onError);
        // 如果音频文件失败，尝试语音合成
        speakFallback(data.hanzi);
    };
    
    const onLoadStart = () => {
        console.log('开始加载音频文件:', audioSrc);
    };
    
    const onCanPlay = () => {
        console.log('音频文件可以播放');
    };

    audioEl.removeEventListener('error', onError);
    audioEl.removeEventListener('loadstart', onLoadStart);
    audioEl.removeEventListener('canplay', onCanPlay);
    
    audioEl.addEventListener('error', onError, { once: true });
    audioEl.addEventListener('loadstart', onLoadStart, { once: true });
    audioEl.addEventListener('canplay', onCanPlay, { once: true });

    audioEl.src = audioSrc;
    audioEl.load();
    
    audioEl.play().then(() => {
        console.log('音频播放成功');
    }).catch((error) => {
        console.error('音频播放失败:', error);
        // 如果播放失败，尝试语音合成
        speakFallback(data.hanzi);
    });
}

function showSummary() {
    document.getElementById('practice-page').classList.add('hidden');
    document.getElementById('summary-page').classList.remove('hidden');
    
    const totalScore = practiceScores.reduce((a, b) => a + b, 0);
    const totalQuestions = practiceQuestions.reduce((a, b) => a + b, 0);
    const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    document.getElementById('final-score').textContent = `${percentage}%`;
    document.getElementById('score-circle').style.setProperty('--score-angle', `${percentage * 3.6}deg`);
    
    let summaryText = `Congratulations! You have completed all the exercises!\n\n`;
    summaryText += `Total Score: ${totalScore} / ${totalQuestions}\n`;
    summaryText += `Accuracy: ${percentage}%`;
    
    if (percentage >= 90) {
        summaryText += `\n\n🎉 Excellent! Outstanding performance!`;
    } else if (percentage >= 80) {
        summaryText += `\n\n👍 Great job! Keep it up!`;
    } else if (percentage >= 70) {
        summaryText += `\n\n💪 Good work! Practice more to improve!`;
    } else {
        summaryText += `\n\🤩 Keep practicing, you can do it!`;
    }
    
    document.getElementById('summary-text').textContent = summaryText;
}

function showDetail() {
    document.getElementById('summary-page').classList.add('hidden');
    document.getElementById('detail-page').classList.remove('hidden');
    renderDetail();
}

function showSummaryFromDetail() {
    document.getElementById('detail-page').classList.add('hidden');
    document.getElementById('summary-page').classList.remove('hidden');
}

function renderDetail() {
    const container = document.getElementById('detail-content');
    const practiceTitles = [
        'Practice 1 · Select Hanzi',
        'Practice 2 · Choose Pinyin',
        'Practice 3 · Type Hanzi',
        'Practice 4 · Listen & Select'
    ];
    const circledNumbers = ['➊','➋','➌','➍','➎','➏','➐','➑','➒','➓'];
    let html = '';
    for (let i = 0; i < 4; i++) {
        const list = practiceDetails[i] || [];
        if (!list.length) continue;
        html += `
            <div class="detail-section">
                <div class="detail-section-title">${practiceTitles[i]}</div>
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Correct Answer</th>
                            <th>Your Answer</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((row, idx) => `
                            <tr>
                                <td>${circledNumbers[idx] || (idx + 1)}</td>
                                <td class="latin">${row.correctAnswer}</td>
                                <td class="latin ${row.isCorrect ? 'tag-correct' : 'tag-wrong'}">${row.yourAnswer ?? ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    if (!html) {
        html = '<div style="text-align:center;color:#2d2d42;">暂无详情，请先完成练习。</div>';
    }
    container.innerHTML = html;
}

// 全局回车 = Next（当题目页显示且 Next 可用时）
document.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
        const qp = document.getElementById('question-page');
        const nextBtn = document.getElementById('next-practice-btn');
        if (qp && !qp.classList.contains('hidden') && nextBtn && !nextBtn.disabled) {
            e.preventDefault();
            nextPractice();
        }
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    showMain();
});
