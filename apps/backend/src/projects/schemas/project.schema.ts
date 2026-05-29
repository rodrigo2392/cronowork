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

  // Days a task can sit in the done column before auto-archiving.
  @Prop({ default: 7 })
  autoArchiveDays: number;

  // Per-project notification preferences. Undefined => everything enabled.
  // { muted?: boolean, assign?: boolean, mention?: boolean }
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  notifySettings: Record<string, boolean>;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  activityLog: any[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
