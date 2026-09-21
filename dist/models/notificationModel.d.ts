import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const notificationSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "review" | "enrollment" | "review_alert" | "course_published" | "earning" | "progress_nudge" | "system";
    message: string;
    active: boolean;
    title: string;
    userId: Types.ObjectId;
    read: boolean;
    link?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "review" | "enrollment" | "review_alert" | "course_published" | "earning" | "progress_nudge" | "system";
    message: string;
    active: boolean;
    title: string;
    userId: Types.ObjectId;
    read: boolean;
    link?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "review" | "enrollment" | "review_alert" | "course_published" | "earning" | "progress_nudge" | "system";
    message: string;
    active: boolean;
    title: string;
    userId: Types.ObjectId;
    read: boolean;
    link?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type NotificationType = InferSchemaType<typeof notificationSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
interface NotificationMethods {
}
interface NotificationStatics {
    markAllReadForUser(this: NotificationModel, userId: string): Promise<void>;
    countUnreadForUser(this: NotificationModel, userId: string): Promise<number>;
}
type NotificationDoc = HydratedDocument<NotificationType, NotificationMethods>;
type NotificationModel = Model<NotificationType, {}, NotificationMethods> & NotificationStatics;
declare const Notification: NotificationModel;
export { Notification, NotificationType, NotificationDoc, NotificationModel };
//# sourceMappingURL=notificationModel.d.ts.map