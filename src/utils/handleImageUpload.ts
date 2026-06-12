import { Request } from 'express';
import multer from "multer";
import AppError from "./appError.js";



const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only images.', 400));
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export default upload;
