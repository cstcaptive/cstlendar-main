/**
 * PATCH6: Data Backup and Restore Types
 */

import { ScheduleEventPatch3 } from './patch3';

export interface AISettingsPatch2 {
  apiKey: string;
  baseUrl: string;
  apiVersion: string;
  model: string;
}

export interface SmartFlowBackupPatch6 {
  version: string;
  exportDate: string;
  data: {
    events: ScheduleEventPatch3[];
    aiConfig: AISettingsPatch2 | null;
  };
}
