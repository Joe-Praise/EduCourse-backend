import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

/**
 * Per-user, per-type notification preferences. `inApp` and `email` are
 * independent channels; either can be toggled off without affecting the
 * other. Defaults: every type opted IN to in-app, opted OUT of email.
 *
 * The default behaviour matches what the system did before this model
 * existed (everything in-app, no email), so adding the model is a no-op
 * for existing users until they explicitly change a preference.
 */
const channelSchema = new Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
  },
  { _id: false },
);

const notificationPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    enrollment: { type: channelSchema, default: () => ({}) },
    review: { type: channelSchema, default: () => ({}) },
    review_alert: { type: channelSchema, default: () => ({}) },
    course_published: { type: channelSchema, default: () => ({}) },
    earning: { type: channelSchema, default: () => ({}) },
    progress_nudge: { type: channelSchema, default: () => ({}) },
    system: { type: channelSchema, default: () => ({}) },
    /** Master switch. When false, ALL notifications are silenced regardless
     *  of per-type settings. */
    enabled: { type: Boolean, default: true },
    active: { type: Boolean, default: true, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

type NotificationPreferenceType = InferSchemaType<typeof notificationPreferenceSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
type NotificationPreferenceDoc = HydratedDocument<NotificationPreferenceType>;
type NotificationPreferenceModel = Model<NotificationPreferenceType>;

notificationPreferenceSchema.pre<
  Query<NotificationPreferenceDoc[], NotificationPreferenceDoc>
>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const NotificationPreference = model<
  NotificationPreferenceType,
  NotificationPreferenceModel
>('NotificationPreference', notificationPreferenceSchema);

export {
  NotificationPreference,
  NotificationPreferenceType,
  NotificationPreferenceDoc,
  NotificationPreferenceModel,
};
