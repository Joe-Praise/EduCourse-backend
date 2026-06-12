import express from 'express';
import { unifiedSearch } from '../Controllers/searchController.js';

const router = express.Router();

router.get('/', unifiedSearch);

export default router;
