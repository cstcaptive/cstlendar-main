/**
 * PATCH4: Relation Graph Types
 */

import { ScheduleEventPatch3 } from './patch3';

export interface GraphNodePatch4 {
  event: ScheduleEventPatch3;
  x: number;
  y: number;
  level: number;
}

export interface GraphEdgePatch4 {
  fromId: string;
  toId: string;
}
