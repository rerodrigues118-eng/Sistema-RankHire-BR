"use client";

import React, { useState, useCallback } from "react";
import type { Candidate, KanbanStatus } from "@/lib/types";
import { RotateCcw } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

interface PipelinePageProps {
  candidates: Candidate[];
  onMoveCandidate: (id: string, newStatus: KanbanStatus) => void;
  onResetPipeline: () => void;
  onSelectCandidate: (c: Candidate) => void;
}

const KANBAN_COLUMNS: { key: KanbanStatus; label: string; color: string }[] = [
  { key: "triado", label: "Triados", color: "#6B7280" },
  { key: "shortlist", label: "Shortlist", color: "#00B4D8" },
  { key: "entrevista", label: "Entrevista", color: "#D4AF37" },
  { key: "oferecido", label: "Oferecido", color: "#8B5CF6" },
  { key: "contratado", label: "Contratado", color: "#059669" },
];

// ── Mini card used inside DragOverlay ──────────────────────
function CandidateMiniCard({ candidate }: { candidate: Candidate }) {
  return (
    <div
      className="bg-[#FFFFFF] rounded-[8px] p-3 shadow-xl"
      style={{ border: "1px solid #E5E7EB", width: 220, opacity: 0.95 }}
    >
      <div className="flex items-center gap-3 mb-1.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ backgroundColor: candidate.avatarColor + "15", color: candidate.avatarColor }}
        >
          {candidate.initials}
        </div>
        <p className="text-[13px] font-medium text-[#111827] truncate">{candidate.name}</p>
      </div>
      <p className="text-[11px] text-[#6B7280] truncate pl-11">{candidate.role}</p>
    </div>
  );
}

// ── Draggable Card ─────────────────────────────────────────
function DraggableCard({
  candidate,
  onSelect,
}: {
  candidate: Candidate;
  onSelect: (c: Candidate) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(candidate)}
      className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3 cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-[#06D6A0] transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ backgroundColor: candidate.avatarColor + "15", color: candidate.avatarColor }}
        >
          {candidate.initials}
        </div>
        <p className="text-[13px] font-medium text-[#111827] truncate leading-tight group-hover:text-[#06D6A0]">{candidate.name}</p>
      </div>
      <p className="text-[11px] text-[#6B7280] truncate mb-3 pl-11">
        {candidate.role} · {candidate.company}
      </p>
      <div className="flex items-center justify-between pl-11">
        <div className="inline-flex items-center bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#FEF08A]">
          <span className="text-[12px] font-semibold text-[#854D0E]">{candidate.score > 0 ? candidate.score.toFixed(1) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Droppable Column ───────────────────────────────────────
function KanbanColumn({
  col,
  items,
  isOver,
  onSelect,
}: {
  col: typeof KANBAN_COLUMNS[number];
  items: Candidate[];
  isOver: boolean;
  onSelect: (c: Candidate) => void;
}) {
  const { setNodeRef } = useDroppable({ id: col.key });

  return (
    <div
      className={`rounded-[12px] flex flex-col transition-colors ${
        isOver ? "bg-[#F0FDF9] border-[#06D6A0]" : "bg-[#F9FAFB] border-[#E5E7EB]"
      } border`}
    >
      {/* Column header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wider font-semibold">
            {col.label}
          </span>
        </div>
        <span className="text-[11px] text-[#4B5563] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-[4px] font-medium">
          {items.length}
        </span>
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 min-h-[150px] pt-1 scrollbar-hide">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div
              className="flex items-center justify-center h-24 rounded-[8px] mx-1 border border-dashed border-[#D1D5DB] bg-white/50"
            >
              <span className="text-[12px] text-[#9CA3AF]">Solte aqui</span>
            </div>
          ) : (
            items.map((c) => (
              <DraggableCard key={c.id} candidate={c} onSelect={onSelect} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function PipelinePage({
  candidates,
  onMoveCandidate,
  onResetPipeline,
  onSelectCandidate,
}: PipelinePageProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grouped = KANBAN_COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = candidates.filter((c) => c.status === col.key);
      return acc;
    },
    {} as Record<KanbanStatus, Candidate[]>
  );

  const activeCandidate = candidates.find((c) => c.id === activeId) || null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over) return;

      // Determine destination column
      const overId = String(over.id);
      const destColumn = KANBAN_COLUMNS.find((col) => col.key === overId);

      if (destColumn) {
        // Dropped directly on a column
        onMoveCandidate(String(active.id), destColumn.key);
      } else {
        // Dropped on another card — find which column that card is in
        const destCand = candidates.find((c) => c.id === overId);
        if (destCand && destCand.status !== candidates.find((c) => c.id === String(active.id))?.status) {
          onMoveCandidate(String(active.id), destCand.status);
        }
      }
    },
    [candidates, onMoveCandidate]
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Pipeline</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Arraste os cards entre colunas para mover candidatos no funil.
          </p>
        </div>
        <button
          onClick={onResetPipeline}
          className="btn-ghost flex items-center gap-2 bg-white"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={1.8} />
          Resetar pipeline
        </button>
      </div>

      {/* Kanban DnD Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 flex-1 min-h-0 pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              items={grouped[col.key]}
              isOver={overId === col.key}
              onSelect={onSelectCandidate}
            />
          ))}
        </div>

        {/* Drag Overlay — ghost card under cursor */}
        <DragOverlay>
          {activeCandidate ? <CandidateMiniCard candidate={activeCandidate} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
