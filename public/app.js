/**
 * LOCKET TEXT • Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements: Header & Status
  const liveClock = document.getElementById('clockText');
  const statusBadge = document.getElementById('statusBadge');
  const statusLabel = document.getElementById('statusLabel');
  const versionBadge = document.getElementById('versionBadge');
  const currentIdDisplay = document.getElementById('currentIdDisplay');

  // Elements: Form Inputs
  const messageForm = document.getElementById('messageForm');
  const activeToggle = document.getElementById('activeToggle');
  const titleInput = document.getElementById('titleInput');
  const titleCount = document.getElementById('titleCount');
  const messageInput = document.getElementById('messageInput');
  const messageCount = document.getElementById('messageCount');
  const btnTextInput = document.getElementById('btnTextInput');
  const btnLinkInput = document.getElementById('btnLinkInput');
  const resetBtn = document.getElementById('resetBtn');
  const saveBtn = document.getElementById('saveBtn');

  // Elements: Media Upload
  const imageDropzone = document.getElementById('imageDropzone');
  const imageFileInput = document.getElementById('imageFileInput');
  const imageDropzoneContent = document.getElementById('imageDropzoneContent');
  const imagePreviewBox = document.getElementById('imagePreviewBox');
  const imagePreview = document.getElementById('imagePreview');
  const removeImageBtn = document.getElementById('removeImageBtn');

  const audioDropzone = document.getElementById('audioDropzone');
  const audioFileInput = document.getElementById('audioFileInput');
  const audioDropzoneContent = document.getElementById('audioDropzoneContent');
  const audioPlayerBox = document.getElementById('audioPlayerBox');
  const audioName = document.getElementById('audioName');
  const playAudioBtn = document.getElementById('playAudioBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const audioBars = document.getElementById('audioBars');
  const removeAudioBtn = document.getElementById('removeAudioBtn');
  const audioElement = document.getElementById('audioElement');

  // Elements: Scheduler
  const scheduleToggle = document.getElementById('scheduleToggle');
  const scheduleInputBox = document.getElementById('scheduleInputBox');
  const scheduleDateTime = document.getElementById('scheduleDateTime');
  const countdownBadge = document.getElementById('countdownBadge');
  const countdownText = document.getElementById('countdownText');

  // Elements: Smartphone Mockup
  const mockupModal = document.getElementById('mockupModal');
  const mockupImgContainer = document.getElementById('mockupImgContainer');
  const mockupImg = document.getElementById('mockupImg');
  const mockupTitle = document.getElementById('mockupTitle');
  const mockupMessage = document.getElementById('mockupMessage');
  const mockupMusicChip = document.getElementById('mockupMusicChip');
  const mockupMusicTitle = document.getElementById('mockupMusicTitle');
  const mockupCtaBtn = document.getElementById('mockupCtaBtn');
  const mockupCtaText = document.getElementById('mockupCtaText');
  const mockupDismissBtn = document.getElementById('mockupDismissBtn');

  const toastContainer = document.getElementById('toastContainer');

  // Local State
  let state = {
    id: 'msg_initial_001',
    version: 1,
    active: false,
    title: '',
    message: '',
    image_url: '',
    music_url: '',
    schedule_enabled: false,
    schedule_time: null,
    btn_text: 'Yêu anh ❤️',
    btn_link: 'https://m.me/'
  };

  // --- 1. Vietnam Live Clock (Asia/Ho_Chi_Minh GMT+7) ---
  function updateLiveClock() {
    const now = new Date();
    // Calculate GMT+7
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);
    const pad = (n) => String(n).padStart(2, '0');
    liveClock.textContent = `${pad(vnTime.getHours())}:${pad(vnTime.getMinutes())}:${pad(vnTime.getSeconds())} (GMT+7)`;
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // --- 2. Toast Notifications ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- 3. Synchronize Form with Mockup ---
  function updateMockup() {
    // Title
    const titleVal = titleInput.value.trim() || 'Tiêu đề bất ngờ';
    mockupTitle.textContent = titleVal;
    titleCount.textContent = `${titleInput.value.length}/40`;

    // Message
    const msgVal = messageInput.value.trim() || 'Nội dung lời nhắn sẽ hiển thị tại đây...';
    mockupMessage.textContent = msgVal;
    messageCount.textContent = `${messageInput.value.length}/300`;

    // CTA Button
    const ctaVal = btnTextInput.value.trim() || 'Yêu anh ❤️';
    mockupCtaText.textContent = ctaVal;
    mockupCtaBtn.href = btnLinkInput.value.trim() || '#';

    // Image
    if (state.image_url) {
      mockupImg.src = state.image_url;
      mockupImgContainer.classList.remove('hidden');
    } else {
      mockupImgContainer.classList.add('hidden');
    }

    // Music
    if (state.music_url) {
      mockupMusicChip.classList.remove('hidden');
      const filename = state.music_url.split('/').pop().replace(/^\d+_\d+_/, '');
      mockupMusicTitle.textContent = `Bài hát: ${filename}`;
    } else {
      mockupMusicChip.classList.add('hidden');
    }

    // Status Badge & Mockup visual state
    updateStatusBadge();
  }

  function updateStatusBadge() {
    statusBadge.className = 'status-badge';
    const isActive = activeToggle.checked;
    const isScheduled = scheduleToggle.checked && scheduleDateTime.value;

    if (!isActive) {
      statusBadge.classList.add('paused');
      statusLabel.textContent = 'TẠM DỪNG';
      mockupModal.classList.add('inactive-preview');
    } else if (isScheduled) {
      statusBadge.classList.add('scheduled');
      statusLabel.textContent = 'HẸN GIỜ';
      mockupModal.classList.remove('inactive-preview');
    } else {
      statusBadge.classList.add('live');
      statusLabel.textContent = 'ĐANG BẬT';
      mockupModal.classList.remove('inactive-preview');
    }
  }

  // Input Event Listeners
  titleInput.addEventListener('input', updateMockup);
  messageInput.addEventListener('input', updateMockup);
  btnTextInput.addEventListener('input', updateMockup);
  btnLinkInput.addEventListener('input', updateMockup);
  activeToggle.addEventListener('change', updateMockup);

  // --- 4. Scheduler Logic & Countdown ---
  scheduleToggle.addEventListener('change', () => {
    if (scheduleToggle.checked) {
      scheduleInputBox.classList.remove('hidden');
      if (!scheduleDateTime.value) {
        // default to tomorrow 00:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        scheduleDateTime.value = tomorrow.toISOString().slice(0, 16);
      }
    } else {
      scheduleInputBox.classList.add('hidden');
    }
    updateCountdown();
    updateMockup();
  });

  scheduleDateTime.addEventListener('input', updateCountdown);

  function updateCountdown() {
    if (!scheduleToggle.checked || !scheduleDateTime.value) {
      countdownBadge.classList.add('hidden');
      return;
    }

    countdownBadge.classList.remove('hidden');
    const target = new Date(scheduleDateTime.value).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      countdownText.textContent = 'Đã đến thời điểm hẹn giờ! Pop-up sẽ hiển thị.';
      countdownBadge.style.borderColor = 'rgba(0, 230, 118, 0.4)';
      countdownBadge.style.color = 'var(--status-live)';
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      countdownText.textContent = `Còn lại: ${days} ngày ${hours} giờ ${mins} phút ${secs} giây`;
      countdownBadge.style.borderColor = 'rgba(255, 179, 0, 0.3)';
      countdownBadge.style.color = 'var(--gold-light)';
    }
  }
  setInterval(updateCountdown, 1000);

  // --- 5. Media Upload Handlers ---
  function setupUploadDropzone(dropzone, fileInput, onFileSelected) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.remove-btn') || e.target.closest('.play-btn')) return;
      fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelected(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        onFileSelected(fileInput.files[0]);
      }
    });
  }

  // Upload image
  setupUploadDropzone(imageDropzone, imageFileInput, async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Đang tải ảnh lên...', 'success');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      state.image_url = data.file_url;
      imagePreview.src = data.file_url;
      imagePreviewBox.classList.remove('hidden');
      imageDropzoneContent.classList.add('hidden');
      updateMockup();
      showToast('Tải ảnh lên thành công!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  removeImageBtn.addEventListener('click', () => {
    state.image_url = '';
    imagePreview.src = '';
    imagePreviewBox.classList.add('hidden');
    imageDropzoneContent.classList.remove('hidden');
    imageFileInput.value = '';
    updateMockup();
    showToast('Đã gỡ ảnh.');
  });

  // Upload audio
  setupUploadDropzone(audioDropzone, audioFileInput, async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Đang tải nhạc lên...', 'success');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      state.music_url = data.file_url;
      audioElement.src = data.file_url;
      audioName.textContent = file.name;
      audioPlayerBox.classList.remove('hidden');
      audioDropzoneContent.classList.add('hidden');
      updateMockup();
      showToast('Tải bài hát lên thành công!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Audio Play/Pause
  playAudioBtn.addEventListener('click', () => {
    if (audioElement.paused) {
      audioElement.play();
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      audioBars.classList.add('playing');
    } else {
      audioElement.pause();
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      audioBars.classList.remove('playing');
    }
  });

  audioElement.addEventListener('ended', () => {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    audioBars.classList.remove('playing');
  });

  removeAudioBtn.addEventListener('click', () => {
    audioElement.pause();
    state.music_url = '';
    audioElement.src = '';
    audioPlayerBox.classList.add('hidden');
    audioDropzoneContent.classList.remove('hidden');
    audioFileInput.value = '';
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    audioBars.classList.remove('playing');
    updateMockup();
    showToast('Đã gỡ nhạc.');
  });

  // Mockup Close Button Simulation
  mockupDismissBtn.addEventListener('click', () => {
    mockupModal.style.transition = 'opacity 0.25s ease';
    mockupModal.style.opacity = '0';
    setTimeout(() => {
      mockupModal.style.opacity = '1';
    }, 1500);
  });

  // --- 6. Fetch Initial State from Backend ---
  async function loadInitialData() {
    try {
      const res = await fetch('/api/admin/message');
      const data = await res.json();

      state = { ...data };
      currentIdDisplay.textContent = state.id || 'msg_initial_001';
      versionBadge.textContent = `v${state.version || 1}`;

      activeToggle.checked = Boolean(state.active);
      titleInput.value = state.title || '';
      messageInput.value = state.message || '';
      btnTextInput.value = state.btn_text || 'Yêu anh ❤️';
      btnLinkInput.value = state.btn_link || 'https://m.me/';

      if (state.image_url) {
        imagePreview.src = state.image_url;
        imagePreviewBox.classList.remove('hidden');
        imageDropzoneContent.classList.add('hidden');
      }

      if (state.music_url) {
        audioElement.src = state.music_url;
        audioName.textContent = state.music_url.split('/').pop().replace(/^\d+_\d+_/, '');
        audioPlayerBox.classList.remove('hidden');
        audioDropzoneContent.classList.add('hidden');
      }

      if (state.schedule_enabled && state.schedule_time) {
        scheduleToggle.checked = true;
        scheduleInputBox.classList.remove('hidden');
        scheduleDateTime.value = state.schedule_time.slice(0, 16);
      }

      updateMockup();
      updateCountdown();
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }

  // --- 7. Save & Publish Form ---
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Đang lưu...</span>`;

    const payload = {
      active: activeToggle.checked,
      title: titleInput.value,
      message: messageInput.value,
      image_url: state.image_url,
      music_url: state.music_url,
      schedule_enabled: scheduleToggle.checked,
      schedule_time: scheduleToggle.checked ? scheduleDateTime.value : null,
      btn_text: btnTextInput.value,
      btn_link: btnLinkInput.value
    };

    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (!result.success) throw new Error(result.error);

      state = { ...result.data };
      currentIdDisplay.textContent = state.id;
      versionBadge.textContent = `v${state.version}`;

      updateMockup();
      showToast('Đã lưu & kích hoạt thành công!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span>LƯU & KÍCH HOẠT</span>
      `;
    }
  });

  // Reset button
  resetBtn.addEventListener('click', () => {
    if (confirm('Phát có muốn đặt lại form về cấu hình ban đầu không?')) {
      loadInitialData();
      showToast('Đã đặt lại form.');
    }
  });

  // Init
  loadInitialData();
});
