import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, index: true })
  userId: string; // Quien recibe la notificación

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['INVITE', 'ASSIGN', 'SYSTEM'], default: 'SYSTEM' })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  projectId?: string; // Opcional, para enlazar a un proyecto

  @Prop()
  taskId?: string; // Opcional, para enlazar a una tarea
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
