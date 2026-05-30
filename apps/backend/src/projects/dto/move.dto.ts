import { IsOptional, IsObject, IsArray } from 'class-validator';

// Minimal payload for a drag/drop move. Instead of re-sending the whole
// project (which can blow past the body-size limit on large boards), the
// client sends only what changed:
export class MoveDto {
  // Affected columns only: { [columnId]: orderedTaskIds }. Typically the 1–2
  // columns touched by the move, each value being just a list of task IDs.
  @IsOptional()
  @IsObject()
  columns?: Record<string, string[]>;

  // New column order (column reordering only).
  @IsOptional()
  @IsArray()
  columnOrder?: string[];

  // Partial per-task field updates merged into existing tasks
  // (e.g. movedToDoneAt, assignee, timeLogs, archived, archivedAt).
  @IsOptional()
  @IsObject()
  taskUpdates?: Record<string, any>;

  // Optional activity-log entry to append server-side.
  @IsOptional()
  @IsObject()
  activity?: { id: string; text: string; time: string };
}
