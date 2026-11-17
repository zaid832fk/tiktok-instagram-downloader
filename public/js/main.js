/* ========================================
   SaveVideo - Frontend JavaScript
   Secure | Modern | RTL Support
   ======================================== */

(function() {
  'use strict';

  // DOM Elements
  const downloadForm = document.getElementById('download-form');
  const urlInput = document.getElementById('video-url');
  const qualitySelect = document.getElementById('quality');
  const formatSelect = document.getElementById('format');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.querySelector('.btn-text');
  const btnLoading = document.querySelector('.btn-loading');
  const urlValidation = document.getElementById('url-validation');
  const pasteBtn = document.getElementById('paste-btn');
  
  const resultContainer = document.getElementById('result-container');
  const errorContainer = document.getElementById('error-container');
  const downloadBtn = document.getElementById('download-btn');
  const downloadNewBtn = document.getElementById('download-new');
  const retryBtn = document.getElementById('retry-btn');
  
  const resultQuality = document.getElementById('result-quality');
  const resultPlatform = document.getElementById('result-platform');
  const resultFormat = document.getElementById('result-format');
  const resultSize = document.getElementById('result-size');
  const resultExpires = document.getElementById('result-expires');
  const resultPreview = document.getElementById('result-preview');

  const securityBanner = document.getElementById('security-banner');
  const closeSecurityBtn = document.getElementById('close-security');

  // State
  let currentDownloadUrl = '';
  let currentFileName = '';

  // Event Listeners
  function setupEventListeners() {
    // Form submission
    downloadForm.addEventListener('submit', handleDownloadSubmit);
    
    // URL input validation
    urlInput.addEventListener('input', validateURLInput);
    urlInput.addEventListener('blur', validateURLInput);
    
    // Paste button
    pasteBtn.addEventListener('click', handlePaste);
    
    // Download button
    downloadBtn.addEventListener('click', handleDirectDownload);
    
    // Download new video
    downloadNewBtn.addEventListener('click', resetForm);
    
    // Retry button
    retryBtn.addEventListener('click', resetError);
    
    // Close security banner
    closeSecurityBtn.addEventListener('click', () => {
      securityBanner.style.display = 'none';
    });
  }

  // Validate URL input
  function validateURLInput() {
    const url = urlInput.value.trim();
    const tiktokRegex = /(tiktok\.com|vm\.tiktok\.com)/i;
    const instagramRegex = /(instagram\.com|instagr\.am)/i;
    
    urlValidation.innerHTML = '';
    urlValidation.className = 'url-validation';
    
    if (!url) {
      return;
    }
    
    if (!tiktokRegex.test(url) && !instagramRegex.test(url)) {
      showValidationError('يرجى إدخال رابط تيك توك أو إنستغرام صالح');
      return;
    }
    
    try {
      new URL(url);
      showValidationSuccess('الرابط صحيح');
    } catch (e) {
      showValidationError('رابط غير صالح');
    }
  }

  function showValidationError(message) {
    urlValidation.innerHTML = `<span style="color: #dc2626;">⚠️ ${message}</span>`;
    urlInput.style.borderColor = '#dc2626';
  }

  function showValidationSuccess(message) {
    urlValidation.innerHTML = `<span style="color: #10b981;">✅ ${message}</span>`;
    urlInput.style.borderColor = '#10b981';
  }

  // Handle paste from clipboard
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.includes('tiktok.com') || text.includes('instagram.com'))) {
        urlInput.value = text;
        validateURLInput();
      } else {
        showValidationError('القرص القصوى لا يحتوي على رابط تيك توك أو إنستغرام');
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      urlInput.focus();
      document.execCommand('paste');
      validateURLInput();
    }
  }

  // Handle download form submission
  async function handleDownloadSubmit(e) {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    const quality = qualitySelect.value;
    const format = formatSelect.value;
    
    if (!url) {
      showValidationError('يرجى إدخال رابط الفيديو');
      return;
    }
    
    // Validate platform
    if (!/tiktok\.com|instagram\.com/i.test(url)) {
      showValidationError('يرجى إدخال رابط تيك توك أو إنستغرام صالح');
      return;
    }
    
    // Set loading state
    setLoadingState(true);
    hideResult();
    hideError();
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ url, quality, format })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في تحميل الفيديو');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'فشل في المعالجة');
      }
      
      // Show result
      currentDownloadUrl = data.downloadUrl;
      currentFileName = data.filename;
      
      resultQuality.textContent = data.quality || 'أفضل جودة';
      resultPlatform.textContent = data.platform === 'tiktok' ? 'تيك توك' : 'إنستغرام';
      resultFormat.textContent = data.format.toUpperCase();
      resultSize.textContent = data.fileSize ? (data.fileSize / (1024 * 1024)).toFixed(2) + ' ميغابايت' : 'غير محدد';
      resultExpires.textContent = data.expiresIn || 'ساعة واحدة';
      
      // Show preview based on format
      if (data.format === 'mp3') {
        resultPreview.innerHTML = `
          <div class="audio-preview" style="padding: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎵</div>
            <div>ملف صوتي - MP3</div>
          </div>
        `;
      } else {
        resultPreview.innerHTML = `
          <video controls preload="metadata" style="max-width: 100%; max-height: 400px; border-radius: 12px;">
            <source src="${data.downloadUrl}" type="video/${data.format}">
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        `;
      }
      
      showResult();
      
    } catch (err) {
      console.error('Download error:', err);
      showError('فشل التحميل', err.message || 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoadingState(false);
    }
  }
  // Show result container
  function showResult() {
    errorContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Hide result container
  function hideResult() {
    resultContainer.classList.add('hidden');
  }

  // Show error container
  function showError(title, message) {
    resultContainer.classList.add('hidden');
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-message').textContent = message;
    errorContainer.classList.remove('hidden');
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Hide error container
  function hideError() {
    errorContainer.classList.add('hidden');
  }

  // Reset error
  function resetError() {
    hideError();
    urlInput.focus();
  }

  // Reset form
  function resetForm() {
    hideResult();
    hideError();
    urlInput.value = '';
    qualitySelect.value = 'best';
    formatSelect.value = 'mp4';
    urlValidation.innerHTML = '';
    urlInput.style.borderColor = '';
    urlInput.focus();
  }

  // Check browser support
  function checkBrowserSupport() {
    const unsupported = [];
    
    if (!fetch) unsupported.push('Fetch API');
    if (!navigator.clipboard) unsupported.push('Clipboard API');
    
    if (unsupported.length > 0) {
      console.warn('Browser limitations:', unsupported);
    }
  }

  // Security banner setup
  function setupSecurityBanner() {
    let bannerTimeout;
    
    const resetBannerTimeout = () => {
      clearTimeout(bannerTimeout);
      bannerTimeout = setTimeout(() => {
        securityBanner.style.opacity = '0.5';
      }, 10000);
    };
    
    document.addEventListener('mousemove', resetBannerTimeout);
    document.addEventListener('keydown', resetBannerTimeout);
    resetBannerTimeout();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle direct download
  function handleDirectDownload() {
    if (!currentDownloadUrl) return;
    const link = document.createElement('a');
    link.href = currentDownloadUrl;
    link.download = currentFileName || 'video.mp4';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Download initiated:', currentFileName);
  }

  function setLoadingState(loading) {
    if (loading) {
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
    } else {
      submitBtn.disabled = false;
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
    }
  }

  function init() {
    setupEventListeners();
    setupSecurityBanner();
    checkBrowserSupport();
  }


})();




  const resultExpires = document.getElementById('result-expires');
  const resultPreview = document.getElementById('result-preview');
  
  const securityBanner = document.getElementById('security-banner');
  const closeSecurityBtn = document.getElementById('close-security');

  // State
  let currentDownloadUrl = '';
  let currentFileName = '';


