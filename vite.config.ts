import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// 引入相容 React 18 的點擊跳轉插件
import { reactClickToComponent } from 'vite-plugin-react-click-to-component';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      reactClickToComponent({
        editor: 'vscode', // 強制指定協議
      }), 
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        // 使用更現代的寫法解決 Mac 上的路徑問題
        '@': path.resolve(new URL('.', import.meta.url).pathname),
      },
    },
    server: {
      // 保持你原本的 HMR 和 Port 設定
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 3000, 
      
    },
  };
});
