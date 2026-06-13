import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const quizSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    active: boolean;
    courseId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    moduleIndex: number;
    generatedAt: NativeDate;
    questions: Types.DocumentArray<{
        options: string[];
        question: string;
        answer: number;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        options: string[];
        question: string;
        answer: number;
    }> & {
        options: string[];
        question: string;
        answer: number;
    }>;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    moduleIndex: number;
    generatedAt: NativeDate;
    questions: Types.DocumentArray<{
        options: string[];
        question: string;
        answer: number;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        options: string[];
        question: string;
        answer: number;
    }> & {
        options: string[];
        question: string;
        answer: number;
    }>;
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
    active: boolean;
    courseId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    moduleIndex: number;
    generatedAt: NativeDate;
    questions: Types.DocumentArray<{
        options: string[];
        question: string;
        answer: number;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        options: string[];
        question: string;
        answer: number;
    }> & {
        options: string[];
        question: string;
        answer: number;
    }>;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type QuizType = InferSchemaType<typeof quizSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type QuizDoc = HydratedDocument<QuizType>;
type QuizModel = Model<QuizType>;
declare const Quiz: QuizModel;
export { Quiz, QuizType, QuizDoc, QuizModel };
//# sourceMappingURL=quizModel.d.ts.map