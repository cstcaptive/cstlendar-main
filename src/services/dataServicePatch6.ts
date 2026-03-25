/**
 * PATCH6: Data Export and Import Service
 */

import { SmartFlowBackupPatch6 } from '../types/patch6';

const EVENTS_KEY = 'smartflow_events';
const AI_CONFIG_KEY = 'smartflow_patch2_ai_config_v2';
const BACKUP_VERSION = '1.0.0';

export const dataServicePatch6 = {
  /**
   * Collects all relevant data from localStorage and returns a backup object
   */
  exportData: (): SmartFlowBackupPatch6 => {
    const eventsRaw = localStorage.getItem(EVENTS_KEY);
    const aiConfigRaw = localStorage.getItem(AI_CONFIG_KEY);

    return {
      version: BACKUP_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        events: eventsRaw ? JSON.parse(eventsRaw) : [],
        aiConfig: aiConfigRaw ? JSON.parse(aiConfigRaw) : null,
      }
    };
  },

  /**
   * Triggers a browser download of the backup data as a JSON file
   */
  downloadBackup: () => {
    const backup = dataServicePatch6.exportData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `smartflow_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Validates and imports backup data into localStorage
   */
  importData: async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content) as SmartFlowBackupPatch6;
          
          // Basic validation
          if (!backup.version || !backup.data) {
            throw new Error('无效的备份文件格式');
          }

          // Save to localStorage
          if (backup.data.events) {
            localStorage.setItem(EVENTS_KEY, JSON.stringify(backup.data.events));
          }
          
          if (backup.data.aiConfig) {
            localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(backup.data.aiConfig));
          }

          resolve(true);
        } catch (err) {
          console.error('Import failed:', err);
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
};
