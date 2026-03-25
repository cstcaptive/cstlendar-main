/**
 * PATCH4: Relation Graph Visualization Component
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Minimize2, MousePointer2, User } from 'lucide-react';
import { ScheduleEventPatch3 } from '../types/patch3';

interface RelationGraphPatch4Props {
  isOpen: boolean;
  onClose: () => void;
  rootEvent: ScheduleEventPatch3;
  allEvents: ScheduleEventPatch3[];
}

interface NodeData {
  id: string;
  title: string;
  date: string;
  time: string;
  contacts: string[];
  parentId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export const RelationGraphPatch4: React.FC<RelationGraphPatch4Props> = ({
  isOpen,
  onClose,
  rootEvent,
  allEvents
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate Graph Data
  const graphData = useMemo(() => {
    // Patch 11: Aggregate recurring events
    const aggregatedEvents = allEvents.filter(e => {
      if (!e.recurringGroupId) return true;
      if (e.id === rootEvent.id) return true;
      const groupEvents = allEvents.filter(g => g.recurringGroupId === e.recurringGroupId);
      const rootInGroup = groupEvents.find(g => g.id === rootEvent.id);
      if (rootInGroup) {
        return e.id === rootEvent.id;
      }
      return e.recurringSequence === 1;
    });

    // 1. Find the absolute root of this family
    let current: ScheduleEventPatch3 | undefined = rootEvent;
    const visited = new Set<string>();
    
    while (current?.parentId && !visited.has(current.parentId)) {
      visited.add(current.id);
      const parent = aggregatedEvents.find(e => e.id === current?.parentId);
      if (!parent) break;
      current = parent;
    }
    const absoluteRoot = current;

    // 2. Build the tree from absoluteRoot
    const nodes: NodeData[] = [];
    const edges: { from: string; to: string }[] = [];
    const nodeWidth = 220;
    const nodeHeight = 100;
    const horizontalGap = 60;
    const verticalGap = 120;

    const levelCounts: { [key: number]: number } = {};

    const traverse = (event: ScheduleEventPatch3, level: number) => {
      if (nodes.find(n => n.id === event.id)) return;

      const node: NodeData = {
        id: event.id,
        title: event.recurringGroupId ? `${event.title} (循环)` : event.title,
        date: event.date,
        time: event.startTime || '全天',
        contacts: event.contacts.map(c => c.name),
        parentId: event.parentId,
        x: 0,
        y: level * (nodeHeight + verticalGap),
        width: nodeWidth,
        height: nodeHeight,
        level
      };

      levelCounts[level] = (levelCounts[level] || 0) + 1;
      node.x = (levelCounts[level] - 1) * (nodeWidth + horizontalGap);
      
      nodes.push(node);

      // Find children
      const children = aggregatedEvents.filter(e => e.parentId === event.id);
      children.forEach(child => {
        edges.push({ from: event.id, to: child.id });
        traverse(child, level + 1);
      });
    };

    if (absoluteRoot) {
      traverse(absoluteRoot, 0);
    }

    // Center nodes horizontally per level
    const maxLevel = Math.max(...nodes.map(n => n.level), 0);
    for (let l = 0; l <= maxLevel; l++) {
      const levelNodes = nodes.filter(n => n.level === l);
      const totalWidth = levelNodes.length * nodeWidth + (levelNodes.length - 1) * horizontalGap;
      const startX = -totalWidth / 2;
      levelNodes.forEach((n, i) => {
        n.x = startX + i * (nodeWidth + horizontalGap);
      });
    }

    return { nodes, edges };
  }, [rootEvent, allEvents]);

  // Initial center
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: dimensions.width / 2, y: 100 });
      setScale(0.8);
    }
  }, [isOpen, dimensions.width]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
      >
        {/* Toolbar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white flex items-center gap-4 pointer-events-auto">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">关联图谱</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {rootEvent.title} 的家族日程
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white flex items-center gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1">
                <MousePointer2 className="w-3 h-3" /> 拖拽画布
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> 滚轮缩放
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 cursor-grab active:cursor-grabbing" ref={containerRef}>
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable
            onWheel={handleWheel}
            onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
          >
            <Layer>
              {/* Edges */}
              {graphData.edges.map((edge, i) => {
                const fromNode = graphData.nodes.find(n => n.id === edge.from);
                const toNode = graphData.nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                return (
                  <Line
                    key={`edge-${i}`}
                    points={[
                      fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height,
                      fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height + 40,
                      toNode.x + toNode.width / 2, toNode.y - 40,
                      toNode.x + toNode.width / 2, toNode.y
                    ]}
                    stroke="#CBD5E1"
                    strokeWidth={2}
                    tension={0.5}
                  />
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node) => (
                <Group key={node.id} x={node.x} y={node.y}>
                  {/* Shadow/Glow for selected */}
                  {node.id === rootEvent.id && (
                    <Rect
                      width={node.width + 10}
                      height={node.height + 10}
                      x={-5}
                      y={-5}
                      fill="#6366F1"
                      opacity={0.2}
                      cornerRadius={20}
                    />
                  )}
                  
                  <Rect
                    width={node.width}
                    height={node.height}
                    fill="white"
                    stroke={node.id === rootEvent.id ? "#6366F1" : "#F1F5F9"}
                    strokeWidth={node.id === rootEvent.id ? 3 : 1}
                    cornerRadius={16}
                    shadowColor="black"
                    shadowBlur={10}
                    shadowOpacity={0.05}
                    shadowOffset={{ x: 0, y: 4 }}
                  />

                  {/* Header */}
                  <Rect
                    width={node.width}
                    height={30}
                    fill={node.id === rootEvent.id ? "#6366F1" : "#F8FAFC"}
                    cornerRadius={[16, 16, 0, 0]}
                  />
                  <Text
                    text={node.date}
                    x={12}
                    y={10}
                    fontSize={10}
                    fontStyle="bold"
                    fill={node.id === rootEvent.id ? "white" : "#94A3B8"}
                    fontFamily="Inter"
                  />
                  <Text
                    text={node.time}
                    x={node.width - 50}
                    y={10}
                    fontSize={10}
                    fontStyle="bold"
                    fill={node.id === rootEvent.id ? "white" : "#94A3B8"}
                    fontFamily="Inter"
                    align="right"
                    width={40}
                  />

                  {/* Content */}
                  <Text
                    text={node.title}
                    x={12}
                    y={40}
                    fontSize={14}
                    fontStyle="900"
                    fill="#1E293B"
                    fontFamily="Inter"
                    width={node.width - 24}
                    wrap="char"
                  />

                  {/* Contacts */}
                  {node.contacts.length > 0 && (
                    <Group x={12} y={70}>
                      <Text
                        text={node.contacts.join(', ')}
                        fontSize={10}
                        fontStyle="bold"
                        fill="#6366F1"
                        fontFamily="Inter"
                        x={18}
                        y={2}
                      />
                      {/* Simple User Icon placeholder */}
                      <Rect width={12} height={12} fill="#EEF2FF" cornerRadius={3} />
                    </Group>
                  )}
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Legend */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl border border-white flex items-center gap-8 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-full" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">当前选中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-200 rounded-full border border-slate-300" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">关联日程</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="text-[10px] font-bold text-slate-400 italic">
            共 {graphData.nodes.length} 个关联节点
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
