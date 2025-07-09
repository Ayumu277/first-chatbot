// 最強CSS強制読み込みスクリプト
(function() {
  'use strict';
  
  console.log('🔥 CSS強制適用スクリプト開始');
  
  // CSS強制適用関数
  function applyForcedStyles() {
    console.log('🎯 CSS強制適用実行中...');
    
    // 既存のスタイルを削除
    const existingStyle = document.getElementById('forced-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 新しいスタイルを作成
    const style = document.createElement('style');
    style.id = 'forced-styles';
    style.innerHTML = \`
      /* 絶対確実に適用される基本スタイル */
      * { 
        box-sizing: border-box !important; 
        margin: 0 !important; 
        padding: 0 !important; 
      }
      
      html, body { 
        background-color: #0D1117 !important; 
        color: #C9D1D9 !important; 
        font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      
      #__next { 
        height: 100vh !important; 
        background-color: #0D1117 !important; 
      }
      
      /* 全てのTailwindクラスを手動定義 */
      .flex { display: flex !important; }
      .flex-1 { flex: 1 1 0% !important; }
      .flex-col { flex-direction: column !important; }
      .items-center { align-items: center !important; }
      .justify-center { justify-content: center !important; }
      .justify-between { justify-content: space-between !important; }
      
      .h-screen { height: 100vh !important; }
      .h-full { height: 100% !important; }
      .h-6 { height: 1.5rem !important; }
      .w-full { width: 100% !important; }
      .w-64 { width: 16rem !important; }
      .w-6 { width: 1.5rem !important; }
      .min-w-0 { min-width: 0px !important; }
      
      .p-2 { padding: 0.5rem !important; }
      .p-4 { padding: 1rem !important; }
      .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
      .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .ml-2 { margin-left: 0.5rem !important; }
      
      .bg-dark-theme { background-color: #0D1117 !important; }
      .bg-sidebar { background-color: #161B22 !important; }
      .bg-gray-700 { background-color: #374151 !important; }
      .bg-gray-800 { background-color: #1F2937 !important; }
      .bg-blue-600 { background-color: #2563EB !important; }
      
      .text-light-theme { color: #C9D1D9 !important; }
      .text-white { color: #FFFFFF !important; }
      .text-gray-100 { color: #F3F4F6 !important; }
      .text-gray-200 { color: #E5E7EB !important; }
      .text-gray-300 { color: #D1D5DB !important; }
      .text-gray-400 { color: #9CA3AF !important; }
      
      .border { border-width: 1px !important; }
      .border-theme { border-color: #30363D !important; }
      .border-gray-600 { border-color: #4B5563 !important; }
      .border-gray-700 { border-color: #374151 !important; }
      .rounded { border-radius: 0.25rem !important; }
      .rounded-lg { border-radius: 0.5rem !important; }
      
      .fixed { position: fixed !important; }
      .relative { position: relative !important; }
      .absolute { position: absolute !important; }
      .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
      .inset-y-0 { top: 0 !important; bottom: 0 !important; }
      .top-4 { top: 1rem !important; }
      .left-4 { left: 1rem !important; }
      .z-30 { z-index: 30 !important; }
      .z-40 { z-index: 40 !important; }
      .z-50 { z-index: 50 !important; }
      
      .translate-x-0 { transform: translateX(0px) !important; }
      .-translate-x-full { transform: translateX(-100%) !important; }
      .transition-transform { transition-property: transform !important; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important; transition-duration: 150ms !important; }
      .transition-colors { transition-property: color, background-color, border-color !important; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important; transition-duration: 150ms !important; }
      .duration-300 { transition-duration: 300ms !important; }
      .ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important; }
      
      .block { display: block !important; }
      .hidden { display: none !important; }
      .overflow-hidden { overflow: hidden !important; }
      .overflow-y-auto { overflow-y: auto !important; }
      
      .hover\\:bg-gray-700:hover { background-color: #374151 !important; }
      .hover\\:bg-blue-700:hover { background-color: #1D4ED8 !important; }
      
      .focus\\:outline-none:focus { outline: 2px solid transparent !important; outline-offset: 2px !important; }
      .focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important; }
      
      .animate-spin { animation: spin 1s linear infinite !important; }
      .animate-bounce { animation: bounce 1s infinite !important; }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(-25%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }
      
      @media (min-width: 768px) {
        .md\\:hidden { display: none !important; }
        .md\\:translate-x-0 { transform: translateX(0px) !important; }
        .md\\:static { position: static !important; }
      }
      
      /* 特別なスタイル */
      .bg-\\[\\#0D1117\\] { background-color: #0D1117 !important; }
      .bg-\\[\\#161B22\\] { background-color: #161B22 !important; }
      .bg-\\[\\#21262D\\] { background-color: #21262D !important; }
      .bg-\\[\\#1E90FF\\] { background-color: #1E90FF !important; }
      .text-\\[\\#C9D1D9\\] { color: #C9D1D9 !important; }
    \`;
    
    document.head.appendChild(style);
    
    // DOM要素に直接スタイルを適用
    document.body.style.backgroundColor = '#0D1117';
    document.body.style.color = '#C9D1D9';
    document.body.style.fontFamily = 'Inter, "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';
    
    document.documentElement.style.backgroundColor = '#0D1117';
    document.documentElement.style.color = '#C9D1D9';
    document.documentElement.style.height = '100%';
    
    const nextDiv = document.getElementById('__next');
    if (nextDiv) {
      nextDiv.style.backgroundColor = '#0D1117';
      nextDiv.style.color = '#C9D1D9';
      nextDiv.style.height = '100vh';
    }
    
    console.log('✅ CSS強制適用完了');
  }
  
  // 複数のタイミングで実行
  const executeAtDifferentTimes = () => {
    applyForcedStyles();
    
    // 500ms後
    setTimeout(applyForcedStyles, 500);
    
    // 1秒後
    setTimeout(applyForcedStyles, 1000);
    
    // 2秒後
    setTimeout(applyForcedStyles, 2000);
    
    // DOM変更監視
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldApply = true;
        }
      });
      
      if (shouldApply) {
        setTimeout(applyForcedStyles, 100);
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  };
  
  // 即座に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executeAtDifferentTimes);
  } else {
    executeAtDifferentTimes();
  }
  
  // ページロード完了時にも実行
  window.addEventListener('load', executeAtDifferentTimes);
  
})();