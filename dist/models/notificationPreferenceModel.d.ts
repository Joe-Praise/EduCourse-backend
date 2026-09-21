import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const notificationPreferenceSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    enabled: boolean;
    active: boolean;
    review: {
        email: boolean;
        inApp: boolean;
    };
    userId: Types.ObjectId;
    enrollment: {
        email: boolean;
        inApp: boolean;
    };
    review_alert: {
        email: boolean;
        inApp: boolean;
    };
    course_published: {
        email: boolean;
        inApp: boolean;
    };
    earning: {
        email: boolean;
        inApp: boolean;
    };
    progress_nudge: {
        email: boolean;
        inApp: boolean;
    };
    system: {
        email: boolean;
        inApp: boolean;
    };
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    enabled: boolean;
    active: boolean;
    review: {
        email: boolean;
        inApp: boolean;
    };
    userId: Types.ObjectId;
    enrollment: {
        email: boolean;
        inApp: boolean;
    };
    review_alert: {
        email: boolean;
        inApp: boolean;
    };
    course_published: {
        email: boolean;
        inApp: boolean;
    };
    earning: {
        email: boolean;
        inApp: boolean;
    };
    progress_nudge: {
        email: boolean;
        inApp: boolean;
    };
    system: {
        email: boolean;
        inApp: boolean;
    };
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
    enabled: boolean;
    active: boolean;
    review: {
        email: boolean;
        inApp: boolean;
    };
    userId: Types.ObjectId;
    enrollment: {
        email: boolean;
        inApp: boolean;
    };
    review_alert: {
        email: boolean;
        inApp: boolean;
    };
    course_published: {
        email: boolean;
        inApp: boolean;
    };
    earning: {
        email: boolean;
        inApp: boolean;
    };
    progress_nudge: {
        email: boolean;
        inApp: boolean;
    };
    system: {
        email: boolean;
        inApp: boolean;
    };
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type NotificationPreferenceType = InferSchemaType<typeof notificationPreferenceSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type NotificationPreferenceDoc = HydratedDocument<NotificationPreferenceType>;
type NotificationPreferenceModel = Model<NotificationPreferenceType>;
declare const NotificationPreference: NotificationPreferenceModel;
export { NotificationPreference, NotificationPreferenceType, NotificationPreferenceDoc, NotificationPreferenceModel, };
//# sourceMappingURL=notificationPreferenceModel.d.ts.map