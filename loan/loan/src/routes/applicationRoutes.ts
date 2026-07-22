import { Router } from 'express';
import { listApplications, getApplication } from '../controllers/applicationController';

const router = Router();

router.get('/', listApplications);
router.get('/:id', getApplication);

export default router;
