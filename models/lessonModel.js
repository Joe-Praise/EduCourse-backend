const mongoose = require('mongoose');

const { Schema } = mongoose;

const lessonSchema = new Schema({
  moduleId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Module',
    required: [true, 'A lesson must have a module!'],
  },
  courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'A course module must have a course!'],
  },
  url: {
    type: String,
    required: [true, 'A lesson must have a url'],
  },
  title: {
    type: String,
    required: [true, 'A lesson must have title'],
  },
  duration: {
    type: String,
    required: [true, 'A lesson must have duration'],
  },
  lessonIndex: {
    type: Number,
    required: [true, 'A lesson must have a module index!'],
  },
  active: {
    type: Boolean,
    default: true,
  },
});

lessonSchema.index({ moduleId: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;
