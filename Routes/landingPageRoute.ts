import express from 'express';
import { landingPage } from '../Controllers/landingPageController.js';

const router = express.Router();

router.route('/').get(landingPage);

export default router;
