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

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  activityLog: any[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
