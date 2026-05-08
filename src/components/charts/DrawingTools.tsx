'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type DrawingTool = 'select' | 'line' | 'horizontal' | 'fibonacci' | 'rectangle' | 'text' | 'arrow';

interface DrawingPoint {
  x: number;
  y: number;
  time: number;
  price: number;
}

interface Drawing {
  id: string;
  tool: DrawingTool;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  text?: string;
}

interface DrawingToolsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  chartRef: React.RefObject<{ toChartCoords: (x: number, y: number) => { time: number; price: number } } | null>;
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  drawings: Drawing[];
  setDrawings: React.Dispatch<React.SetStateAction<Drawing[]>>;
  onDrawingComplete?: (drawing: Drawing) => void;
}

const TOOLS: { id: DrawingTool; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: 'Select' },
  { id: 'line', icon: '/', label: 'Line' },
  { id: 'horizontal', icon: '—', label: 'H-Line' },
  { id: 'fibonacci', icon: 'F', label: 'Fib' },
  { id: 'rectangle', icon: '▢', label: 'Rect' },
  { id: 'text', icon: 'T', label: 'Text' },
  { id: 'arrow', icon: '→', label: 'Arrow' },
];

const COLORS = [
  '#00f5d4', // Cyan
  '#ff206e', // Magenta
  '#f59e0b', // Gold
  '#10b981', // Green
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ffffff', // White
];

const LINE_WIDTHS = [1, 2, 3, 4, 5];

export default function DrawingTools({
  containerRef,
  chartRef,
  activeTool,
  setActiveTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  drawings,
  setDrawings,
  onDrawingComplete,
}: DrawingToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineWidthPicker, setShowLineWidthPicker] = useState(false);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Get chart coordinates from mouse position
  const getChartCoords = useCallback((x: number, y: number): DrawingPoint => {
    if (chartRef.current) {
      const coords = chartRef.current.toChartCoords(x, y);
      return { x, y, time: coords.time, price: coords.price };
    }
    return { x, y, time: x, price: y };
  }, [chartRef]);

  // Start drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'select') return;

    const pos = getMousePos(e);
    const chartPos = getChartCoords(pos.x, pos.y);

    const newDrawing: Drawing = {
      id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool: activeTool,
      points: [chartPos],
      color,
      lineWidth,
      text: activeTool === 'text' ? '' : undefined,
    };

    setIsDrawing(true);
    setCurrentDrawing(newDrawing);
  }, [activeTool, color, lineWidth, getMousePos, getChartCoords]);

  // Continue drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return;

    const pos = getMousePos(e);
    const chartPos = getChartCoords(pos.x, pos.y);

    if (currentDrawing.tool === 'horizontal') {
      // For horizontal lines, only track Y position (price level)
      setCurrentDrawing(prev => prev ? {
        ...prev,
        points: [prev.points[0], chartPos],
      } : null);
    } else {
      setCurrentDrawing(prev => prev ? {
        ...prev,
        points: [prev.points[0], chartPos],
      } : null);
    }
  }, [isDrawing, currentDrawing, getMousePos, getChartCoords]);

  // End drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawing) return;

    if (currentDrawing.tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const completedDrawing = { ...currentDrawing, text };
        setDrawings(prev => [...prev, completedDrawing]);
        onDrawingComplete?.(completedDrawing);
      }
    } else if (currentDrawing.points.length >= 2) {
      setDrawings(prev => [...prev, currentDrawing]);
      onDrawingComplete?.(currentDrawing);
    }

    setIsDrawing(false);
    setCurrentDrawing(null);
  }, [isDrawing, currentDrawing, setDrawings, onDrawingComplete]);

  // Draw on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match container
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Draw existing drawings
    drawings.forEach(drawing => {
      drawDrawing(ctx, drawing);
    });

    // Draw current drawing
    if (currentDrawing) {
      drawDrawing(ctx, currentDrawing);
    }
  }, [drawings, currentDrawing, containerRef]);

  // Draw a single drawing
  const drawDrawing = (ctx: CanvasRenderingContext2D, drawing: Drawing) => {
    const { points, color, lineWidth, tool } = drawing;
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (tool) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        break;

      case 'horizontal':
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, points[1].y);
        ctx.lineTo(ctx.canvas.width, points[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case 'fibonacci':
        // Draw trend line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();

        // Calculate Fibonacci levels
        const high = Math.min(points[0].price, points[1].price);
        const low = Math.max(points[0].price, points[1].price);
        const diff = low - high;
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const startX = Math.min(points[0].x, points[1].x);
        const endX = Math.max(points[0].x, points[1].x);

        levels.forEach(level => {
          const y = points[0].y + (points[1].y - points[0].y) * (1 - level);
          ctx.strokeStyle = `${color}40`;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.font = '10px JetBrains Mono';
          ctx.fillText(`${(level * 100).toFixed(1)}%`, endX + 5, y + 3);
        });
        break;

      case 'rectangle':
        const x = Math.min(points[0].x, points[1].x);
        const y = Math.min(points[0].y, points[1].y);
        const w = Math.abs(points[1].x - points[0].x);
        const h = Math.abs(points[1].y - points[0].y);
        ctx.strokeRect(x, y, w, h);
        break;

      case 'arrow':
        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
        const arrowLen = 15;
        ctx.beginPath();
        ctx.moveTo(points[1].x, points[1].y);
        ctx.lineTo(
          points[1].x - arrowLen * Math.cos(angle - Math.PI / 6),
          points[1].y - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(points[1].x, points[1].y);
        ctx.lineTo(
          points[1].x - arrowLen * Math.cos(angle + Math.PI / 6),
          points[1].y - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
    }

    // Draw text if present
    if (drawing.text && points.length > 0) {
      ctx.fillStyle = color;
      ctx.font = '12px JetBrains Mono';
      ctx.fillText(drawing.text, points[0].x, points[0].y - 10);
    }
  };

  // Redraw on changes
  useEffect(() => {
    drawCanvas();
  }, [drawings, currentDrawing, drawCanvas]);

  // Clear all drawings
  const clearDrawings = useCallback(() => {
    setDrawings([]);
  }, [setDrawings]);

  // Undo last drawing
  const undoDrawing = useCallback(() => {
    setDrawings(prev => prev.slice(0, -1));
  }, [setDrawings]);

  return (
    <>
      {/* Drawing Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-auto z-20"
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Floating Toolbar */}
      <motion.div
        className="absolute top-4 right-4 z-30 flex flex-col gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Tools */}
        <div className="flex flex-col gap-1 p-1.5 rounded-xl" style={{
          background: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all ${
                activeTool === tool.id
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-1" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(10, 10, 15, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="w-5 h-5 rounded-full border-2 border-white/30" style={{ background: color }} />
          </button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                className="absolute right-12 top-0 p-2 rounded-xl"
                style={{
                  background: 'rgba(10, 10, 15, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex flex-col gap-1">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Line Width */}
        <div className="relative">
          <button
            onClick={() => setShowLineWidthPicker(!showLineWidthPicker)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
            style={{
              background: 'rgba(10, 10, 15, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="w-5 h-1 rounded-full bg-white" style={{ width: `${lineWidth * 2}px` }} />
          </button>

          <AnimatePresence>
            {showLineWidthPicker && (
              <motion.div
                className="absolute right-12 top-0 p-2 rounded-xl flex flex-col gap-2"
                style={{
                  background: 'rgba(10, 10, 15, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {LINE_WIDTHS.map(w => (
                  <button
                    key={w}
                    onClick={() => {
                      setLineWidth(w);
                      setShowLineWidthPicker(false);
                    }}
                    className={`w-8 h-6 rounded flex items-center justify-center hover:bg-white/10 ${
                      lineWidth === w ? 'bg-primary/20' : ''
                    }`}
                  >
                    <div className="w-5 h-1 rounded-full bg-white" style={{ width: `${w * 3}px` }} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-1" />

        {/* Undo */}
        <button
          onClick={undoDrawing}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
          style={{
            background: 'rgba(10, 10, 15, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Undo"
        >
          ↩
        </button>

        {/* Clear */}
        <button
          onClick={clearDrawings}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          style={{
            background: 'rgba(10, 10, 15, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Clear All"
        >
          ✕
        </button>
      </motion.div>
    </>
  );
}

// Hook to manage drawings persistence
export function useDrawings(symbol: string) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`drawings-${symbol}`);
    if (stored) {
      try {
        setDrawings(JSON.parse(stored));
      } catch {
        console.warn('Failed to load drawings from localStorage');
      }
    }
  }, [symbol]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(`drawings-${symbol}`, JSON.stringify(drawings));
  }, [drawings, symbol]);

  return { drawings, setDrawings };
}