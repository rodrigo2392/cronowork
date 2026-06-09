import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  sharedWith: string[];

  @Prop({ type: [String], default: [] })
  members: string[];

  // Per-member access role, keyed by email: 'editor' | 'viewer'.
  // Owner is always full-access; a member with no entry defaults to 'editor'.
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  roles: Record<string, string>;

  @Prop({ required: true, unique: true })
  id: string;

  // Link-based sharing: a random token that lets any authenticated user join
  // the project. Empty/undefined = link sharing disabled. shareRole is the
  // access role granted to whoever joins through the link.
  @Prop({ index: true })
  shareToken: string;

  @Prop({ default: 'editor' })
  shareRole: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  prefix: string;

  @Prop()
  icon: string;

  // Storing tasks and columns as Mixed objects since they are dynamic dictionaries mapped by ID
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  tasks: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  columns: Record<string, any>;

  @Prop({ type: [String], default: [] })
  columnOrder: string[];

  // Column that represents "completed" (drives progress %, time-tracker stop,
  // and auto-archive). Falls back to the last column when unset.
  @Prop()
  doneColumnId: string;

  // Auto-archive: master toggle + days a task can sit in the done column
  // before archiving, + optional permanent deletion of archived tasks.
  @Prop({ default: true })
  autoArchiveEnabled: boolean;

  @Prop({ default: 7 })
  autoArchiveDays: number;

  // 0 = never delete archived tasks.
  @Prop({ default: 0 })
  autoDeleteArchivedDays: number;

  // Defaults applied to newly created tasks.
  @Prop({ default: 'medium' })
  defaultPriority: string;

  @Prop({ type: [String], default: [] })
  defaultTags: string[];

  // Default assignee (email) for newly created tasks. Empty = unassigned.
  @Prop({ default: '' })
  defaultAssignee: string;

  // Auto-start the time tracker when a task moves to an "In Progress" column.
  @Prop({ default: true })
  autoStartTimer: boolean;

  // Whether AI task generation is allowed for this project.
  @Prop({ default: true })
  aiEnabled: boolean;

  // Per-project notification preferences. Undefined => everything enabled.
  // { muted?: boolean, assign?: boolean, mention?: boolean }
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  notifySettings: Record<string, boolean>;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  activityLog: any[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
