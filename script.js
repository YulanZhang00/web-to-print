// 启动页功能 - 点击时隐藏标题页
let titlePageHidden = false;
const header = document.querySelector('.header');
const navbar = document.querySelector('.navbar');
const btNav = document.querySelector('.bt-nav');

function hideTitlePage() {
    if (!titlePageHidden) {
        titlePageHidden = true;
        header.classList.add('hide');
        // 延迟显示navbar和导航按钮，等待header动画完成后再显示
        setTimeout(() => {
            if (navbar) {
                navbar.style.opacity = '1';
                navbar.style.visibility = 'visible';
            }
            if (btNav) {
                btNav.style.opacity = '1';
                btNav.style.visibility = 'visible';
            }
        }, 800);
    }
}

// 监听点击事件
header.addEventListener('click', hideTitlePage);

// 布局配置
const config = {
    spacing: 300,        // 所有元素的统一间距
    cols: 4,             // 列数
    rows: 3              // 每列的按钮数
};

// 计算重复区域的尺寸
const patternWidth = config.cols * config.spacing;
const patternHeight = config.rows * config.spacing;

// 获取原始容器和需要保留的元素
const originalContainer = document.querySelector('.main-container');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const body = document.body;

// 为原始容器设置初始位置（中心位置）
originalContainer.style.left = '400px';
originalContainer.style.top = '400px';

// 创建包装容器来容纳所有复制的网格
const wrapper = document.createElement('div');
wrapper.id = 'canvas-wrapper';
wrapper.style.position = 'absolute';
wrapper.style.width = '5000px';
wrapper.style.height = '5000px';
wrapper.style.cursor = 'grab';

// 将原始容器移到包装器中
body.removeChild(originalContainer);
wrapper.appendChild(originalContainer);

// 创建3x3的重复网格（除了中心的原始容器）
for (let gridRow = -1; gridRow <= 1; gridRow++) {
    for (let gridCol = -1; gridCol <= 1; gridCol++) {
        // 跳过中心位置（已经有原始容器）
        if (gridRow === 0 && gridCol === 0) continue;
        
        // 克隆原始容器
        const clone = originalContainer.cloneNode(true);
        clone.classList.add('cloned');
        
        // 设置克隆容器的位置
        const offsetX = 400 + gridCol * patternWidth;
        const offsetY = 400 + gridRow * patternHeight;
        clone.style.left = offsetX + 'px';
        clone.style.top = offsetY + 'px';
        
        wrapper.appendChild(clone);
    }
}

// 将包装器插入到 body 的开头（在侧边栏和遮罩层之前）
body.insertBefore(wrapper, body.firstChild);

const canvas = wrapper;

// 为所有按钮添加点击事件（包括原始和克隆的）
let isLongPressFlag = false;

function addButtonClickEvents() {
    // 获取所有按钮（包括克隆的）
    const allButtons = document.querySelectorAll('.main-container div div');
    
    allButtons.forEach((button, index) => {
        button.addEventListener('click', (e) => {
            // 如果是长按，不触发点击事件
            if (isLongPressFlag) {
                e.stopPropagation();
                isLongPressFlag = false;
                return;
            }
            
            e.stopPropagation();
            // 获取按钮的类名，如 button1, button2 等
            const buttonClass = button.className.match(/button\d+/);
            if (buttonClass) {
                const buttonNumber = buttonClass[0].replace('button', '');
                openSidebar('bt' + buttonNumber);
            }
        });
    });
}

// 在克隆完成后添加点击事件
addButtonClickEvents();

// 拖动和缩放功能变量
let isDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;
let scale = 1; // 缩放比例
const minScale = 0.7; // 最小缩放（50%）
const maxScale = 3.5; // 最大缩放（300%）
const container = document.body;

// 更新 transform 的函数
function updateTransform() {
    canvas.style.transformOrigin = '0 0';
    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// 标准化位置到中心pattern范围内（考虑缩放）
function normalizePosition() {
    // 根据当前缩放计算实际的循环距离
    const scaledPatternWidth = patternWidth * scale;
    const scaledPatternHeight = patternHeight * scale;
    
    // 使用更小的阈值，让循环更早触发，避免看到边缘
    const thresholdX = scaledPatternWidth * 0.2;  // 45% 而不是 50%
    const thresholdY = scaledPatternHeight * 0.2;
    
    while (translateX > thresholdX) {
        translateX -= scaledPatternWidth;
    }
    while (translateX < -thresholdX) {
        translateX += scaledPatternWidth;
    }
    while (translateY > thresholdY) {
        translateY -= scaledPatternHeight;
    }
    while (translateY < -thresholdY) {
        translateY += scaledPatternHeight;
    }
}

// 鼠标按下
canvas.addEventListener('mousedown', (e) => {
    // 检查是否点击了按钮
    const button = e.target.closest('.main-container div div');
    if (button) return;
    
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    canvas.style.cursor = 'grabbing';
    
    // 隐藏 bt-nav
    if (btNav) {
        btNav.style.opacity = '0';
    }
});

// 触摸开始
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        // 双指触摸，准备缩放
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        initialScale = scale;
        isDragging = false; // 禁用拖动
        return;
    }
    
    // 检查是否点击了按钮
    const button = e.target.closest('.main-container div div');
    if (button) return;
    
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX - translateX;
    startY = touch.clientY - translateY;
    canvas.style.cursor = 'grabbing';
    
    // 隐藏 bt-nav
    if (btNav) {
        btNav.style.opacity = '0';
    }
});

// 鼠标移动
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    // 实时标准化位置，实现无缝循环
    normalizePosition();
    
    // 更新起始点，保证连续性
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    
    updateTransform();
});

// 触摸移动
document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        // 计算缩放比例
        const newScale = Math.min(
            Math.max(initialScale * (currentDistance / initialDistance), minScale),
            maxScale
        );
        
        scale = newScale;
        updateTransform();
        return;
    }
    
    if (!isDragging) return;
    
    const touch = e.touches[0];
    translateX = touch.clientX - startX;
    translateY = touch.clientY - startY;
    
    // 实时标准化位置，实现无缝循环
    normalizePosition();
    
    // 更新起始点，保证连续性
    startX = touch.clientX - translateX;
    startY = touch.clientY - translateY;
    
    updateTransform();
});

// 鼠标释放
document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        
        // 显示 bt-nav
        if (btNav && titlePageHidden) {
            btNav.style.opacity = '1';
        }
    }
});

// 触摸结束
document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        
        // 显示 bt-nav
        if (btNav && titlePageHidden) {
            btNav.style.opacity = '1';
        }
    }
});

// 防止选中文本
canvas.addEventListener('selectstart', (e) => {
    if (isDragging) {
        e.preventDefault();
    }
});

// 鼠标滚轮缩放功能（标准算法 - 以鼠标为中心）
let isZooming = false;
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    if (isZooming) return;
    isZooming = true;
    
    requestAnimationFrame(() => {
        // 获取鼠标位置
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // 计算鼠标在当前缩放下相对于内容的位置
        const worldX = (mouseX - translateX) / scale;
        const worldY = (mouseY - translateY) / scale;
        
        // 计算新的缩放 - 更细腻的缩放步长
        const delta = e.deltaY > 0 ? 0.97 : 1.03;
        const oldScale = scale;
        scale = Math.min(Math.max(scale * delta, minScale), maxScale);
        
        // 计算新的平移，使世界坐标点保持在鼠标位置
        translateX = mouseX - worldX * scale;
        translateY = mouseY - worldY * scale;
        
        // 缩放后也要标准化位置，避免内容跳出范围
        normalizePosition();
        
        // 更新 transform
        updateTransform();
        
        setTimeout(() => {
            isZooming = false;
        }, 10);
    });
}, { passive: false });

// 触摸板双指缩放（移动设备）
let initialDistance = 0;
let initialScale = 1;

// 侧边栏功能
function openSidebar(menuId) {
    // 隐藏所有菜单内容
    const allContents = document.querySelectorAll('.sidebar-content');
    allContents.forEach(content => {
        content.classList.remove('active');
    });

    // 显示选中的菜单内容
    const selectedContent = document.getElementById(menuId);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // 打开侧边栏
    sidebar.classList.add('active');
    overlay.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// ESC键关闭侧边栏
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSidebar();
    }
});

// 禁用整个页面的滚轮滚动（只用于缩放）
document.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });


// 音频文件
const sounds = {
    sd1: new Audio("sound/b1.mp3"),
    sd2: new Audio("sound/b2.mp3"),
    sd3: new Audio("sound/b3.mp3"),
    sd4: new Audio("sound/b4.mp3"),
    sd5: new Audio("sound/b5.mp3"),
    sd6: new Audio("sound/b6.mp3"),
    sd7: new Audio("sound/b7.mp3"),
    sd8: new Audio("sound/b8.mp3"),
    sd9: new Audio("sound/b9.mp3"),
    sd10: new Audio("sound/b10.mp3"),
    sd11: new Audio("sound/b11.mp3"),
    sd12: new Audio("sound/b12.mp3"),
  };

// ======== 录音功能 (MP3 格式) ========
let audioContext = null;
let isRecording = false;
let audioSources = {};
let recordingStarted = false;
let scriptProcessor = null;
let recordedBuffers = []; // 存储左右声道的原始音频数据
let sampleRate = 44100;

// 初始化 AudioContext 和录音功能
function initAudioRecording() {
    if (audioContext) return; // 已经初始化过了
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sampleRate = audioContext.sampleRate;
    
    // 创建一个混音节点，用于收集所有音频
    const mixerNode = audioContext.createGain();
    mixerNode.gain.value = 1;
    
    // 为每个音频创建源节点并连接
    Object.keys(sounds).forEach(key => {
        const audio = sounds[key];
        const source = audioContext.createMediaElementSource(audio);
        // 连接到混音器
        source.connect(mixerNode);
        // 同时连接到扬声器，让用户能听到声音
        source.connect(audioContext.destination);
        audioSources[key] = source;
    });
    
    // 创建 ScriptProcessorNode 用于捕获原始音频数据
    // 使用 4096 的缓冲区大小，2 个输入通道，2 个输出通道
    scriptProcessor = audioContext.createScriptProcessor(4096, 2, 2);
    
    scriptProcessor.onaudioprocess = (e) => {
        if (!isRecording) return;
        
        // 获取左右声道数据并复制（因为原数据会被覆盖）
        const leftChannel = new Float32Array(e.inputBuffer.getChannelData(0));
        const rightChannel = new Float32Array(e.inputBuffer.getChannelData(1));
        
        recordedBuffers.push({
            left: leftChannel,
            right: rightChannel
        });
    };
    
    // 连接混音器到处理器
    mixerNode.connect(scriptProcessor);
    // 处理器需要连接到目标才能工作（但我们设置为静音）
    scriptProcessor.connect(audioContext.destination);
}

// 开始录音
function startRecording() {
    if (isRecording) return;
    
    initAudioRecording();
    
    // 确保 AudioContext 是运行状态
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    recordedBuffers = [];
    isRecording = true;
    recordingStarted = true;
    
    // 显示录音状态和导出按钮
    updateRecordingUI(true);
    console.log('Recording has started');
}

// 停止录音并导出
function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    
    // 更新UI
    updateRecordingUI(false);
    console.log('Downloading...');
    
    // 转换并导出
    exportAsMP3();
}

// 将录制的音频转换为 MP3 并导出
function exportAsMP3() {
    if (recordedBuffers.length === 0) {
        alert('error');
        recordingStarted = false;
        return;
    }
    
    // 显示转换中提示
    const recordBtn = document.getElementById('record-export-btn');
    recordBtn.innerHTML = `
        <svg class="loading-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4 31.4" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
        </svg>
        <span>转换中...</span>
    `;
    
    // 使用 setTimeout 让 UI 更新后再进行转换
    setTimeout(() => {
        try {
            // 计算总样本数
            const totalSamples = recordedBuffers.length * 4096;
            
            // 合并所有缓冲区
            const leftData = new Float32Array(totalSamples);
            const rightData = new Float32Array(totalSamples);
            
            let offset = 0;
            for (const buffer of recordedBuffers) {
                leftData.set(buffer.left, offset);
                rightData.set(buffer.right, offset);
                offset += buffer.left.length;
            }
            
            // 转换为 16 位整数 PCM
            const leftInt16 = floatTo16BitPCM(leftData);
            const rightInt16 = floatTo16BitPCM(rightData);
            
            // 使用 lamejs 编码为 MP3
            const mp3encoder = new lamejs.Mp3Encoder(2, sampleRate, 128); // 立体声, 采样率, 128kbps
            const mp3Data = [];
            
            const blockSize = 1152; // lamejs 推荐的块大小
            for (let i = 0; i < leftInt16.length; i += blockSize) {
                const leftChunk = leftInt16.subarray(i, i + blockSize);
                const rightChunk = rightInt16.subarray(i, i + blockSize);
                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
            
            // 完成编码
            const mp3End = mp3encoder.flush();
            if (mp3End.length > 0) {
                mp3Data.push(mp3End);
            }
            
            // 创建 Blob 并保存
            const blob = new Blob(mp3Data, { type: 'audio/mp3' });
            lastRecordedMP3Blob = blob;
            
            console.log('✅ MP3 转换成功！');
            
            // 生成波形图
            generateWaveform(leftData, rightData);
            
            // 直接下载 MP3
            downloadMP3();
            
            // 显示波形图模态框
            showWaveformModal();
            
        } catch (error) {
            console.error('MP3 转换失败:', error);
            alert('MP3 转换失败，请重试！');
        }
        
        // 重置状态，允许新的录音
        recordingStarted = false;
        recordedBuffers = [];
        
        // 恢复按钮状态
        updateRecordingUI(false);
    }, 100);
}

// 将 Float32Array 转换为 Int16Array
function floatTo16BitPCM(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        // 限制范围并转换
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

// 更新录音状态UI
function updateRecordingUI(recording) {
    const recordBtn = document.getElementById('record-export-btn');
    const recordingIndicator = document.getElementById('recording-indicator');
    
    if (recording) {
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = `
            <svg class="export-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Export</span>
        `;
        recordingIndicator.classList.add('active');
    } else {
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = `
            <svg class="mic-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 19V23M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Record</span>
        `;
        recordingIndicator.classList.remove('active');
    }
}

// 存储最后录制的音频数据
let lastRecordedMP3Blob = null;

// 存储波形数据用于生成波形图
let waveformData = null;

// 生成波形图
function generateWaveform(leftData, rightData) {
    const canvas = document.getElementById('waveform-canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    const width = 1200;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    
    // 混合左右声道
    const mixedData = new Float32Array(leftData.length);
    for (let i = 0; i < leftData.length; i++) {
        mixedData[i] = (leftData[i] + rightData[i]) / 2;
    }
    
    // 采样数据以适应画布宽度
    const samplesPerPixel = Math.floor(mixedData.length / width);
    const waveformValues = [];
    
    for (let i = 0; i < width; i++) {
        const start = i * samplesPerPixel;
        const end = start + samplesPerPixel;
        
        let min = 0;
        let max = 0;
        
        for (let j = start; j < end && j < mixedData.length; j++) {
            const value = mixedData[j];
            if (value < min) min = value;
            if (value > max) max = value;
        }
        
        waveformValues.push({ min, max });
    }
    
    // 绘制背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // 水平网格线
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // 垂直网格线
    for (let i = 0; i <= 12; i++) {
        const x = (width / 12) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // 绘制中心线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.25, '#feca57');
    gradient.addColorStop(0.5, '#48dbfb');
    gradient.addColorStop(0.75, '#feca57');
    gradient.addColorStop(1, '#ff6b6b');
    
    // 绘制波形
    const centerY = height / 2;
    const amplitude = height * 0.45;
    
    // 绘制填充波形
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i < waveformValues.length; i++) {
        const { max } = waveformValues[i];
        const y = centerY - max * amplitude;
        ctx.lineTo(i, y);
    }
    
    for (let i = waveformValues.length - 1; i >= 0; i--) {
        const { min } = waveformValues[i];
        const y = centerY - min * amplitude;
        ctx.lineTo(i, y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // 绘制波形线条
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // 上半部分线条
    ctx.beginPath();
    for (let i = 0; i < waveformValues.length; i++) {
        const { max } = waveformValues[i];
        const y = centerY - max * amplitude;
        if (i === 0) {
            ctx.moveTo(i, y);
        } else {
            ctx.lineTo(i, y);
        }
    }
    ctx.stroke();
    
    // 下半部分线条
    ctx.beginPath();
    for (let i = 0; i < waveformValues.length; i++) {
        const { min } = waveformValues[i];
        const y = centerY - min * amplitude;
        if (i === 0) {
            ctx.moveTo(i, y);
        } else {
            ctx.lineTo(i, y);
        }
    }
    ctx.stroke();
    
    // 添加时间戳文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px "Science Gothic", sans-serif';
    ctx.textAlign = 'left';
    
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`BUTTONS ARCHIVE - ${timestamp}`, 20, height - 15);
    
    // 存储波形数据供导出使用
    waveformData = canvas.toDataURL('image/png');
    
    return waveformData;
}

// 显示波形图模态框
function showWaveformModal() {
    const modal = document.getElementById('waveform-modal');
    modal.classList.add('active');
}

// 关闭波形图模态框
function closeWaveformModal() {
    const modal = document.getElementById('waveform-modal');
    modal.classList.remove('active');
}

// 下载波形图
function downloadWaveform() {
    if (!waveformData) {
        alert('没有波形图数据！');
        return;
    }
    
    const a = document.createElement('a');
    a.href = waveformData;
    a.download = `waveform-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ESC 键关闭波形图模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeWaveformModal();
    }
});

// 录音/导出按钮点击事件
function handleRecordExport() {
    if (isRecording) {
        stopRecording();
    } else if (!recordingStarted) {
        // 手动开始录音
        startRecording();
    }
}

// 下载MP3文件
function downloadMP3() {
    if (!lastRecordedMP3Blob) {
        alert('还没有录制的音频！请先录制。');
        return;
    }
    
    const url = URL.createObjectURL(lastRecordedMP3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `button-sounds-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

  // 长按播放声音功能
  let pressTimer = null;

  // 播放声音的通用函数（自动开始录音）
  function playSound(key) {
    // 如果还没开始录音，自动开始
    if (!recordingStarted && !isRecording) {
      startRecording();
    }
    
    const snd = sounds[key];
    snd.currentTime = 0;
    snd.play().catch(err => console.log("播放失败:", err));
  }

  document.addEventListener("mousedown", (e) => {
    const key = e.target.dataset.sound;
    if (!key) return;

    isLongPressFlag = false;
    pressTimer = setTimeout(() => {
      isLongPressFlag = true;
      playSound(key);
    }, 500); // 长按500毫秒后播放声音
  });

  document.addEventListener("mouseup", (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  document.addEventListener("mouseleave", (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  // 触摸设备的长按支持
  document.addEventListener("touchstart", (e) => {
    const key = e.target.dataset.sound;
    if (!key) return;

    isLongPressFlag = false;
    pressTimer = setTimeout(() => {
      isLongPressFlag = true;
      playSound(key);
    }, 500); // 长按500毫秒后播放声音
  });

  document.addEventListener("touchend", (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  document.addEventListener("touchcancel", (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

// 缩放按钮功能
const zoomInBtn = document.querySelector('.zoom-in');
const zoomOutBtn = document.querySelector('.zoom-out');
const zoomStep = 0.15; // 每次缩放的步长

function smoothZoom(targetScale) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const worldX = (centerX - translateX) / scale;
    const worldY = (centerY - translateY) / scale;
    
    // 添加平滑过渡效果
    canvas.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    scale = Math.min(Math.max(targetScale, minScale), maxScale);
    
    translateX = centerX - worldX * scale;
    translateY = centerY - worldY * scale;
    
    updateTransform();
    
    // 过渡完成后移除transition，以免影响拖动的流畅性
    setTimeout(() => {
        canvas.style.transition = '';
    }, 400);
}

if (zoomInBtn) {
    zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        smoothZoom(scale + zoomStep);
    });
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        smoothZoom(scale - zoomStep);
    });
}