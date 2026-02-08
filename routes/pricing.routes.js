import express from 'express';
import { 
    createPlan, 
    getAllPlans, 
    getPlanById, 
    updatePlan, 
    deletePlan 
} from '../controllers/pricing.controller.js'; // Adjust path if necessary

const router = express.Router();

// ------------------------------------------------------------------
// Base Route: /api/pricing
// ------------------------------------------------------------------
router.route('/')
    // GET /api/pricing: Get all plans (Public/Frontend/Admin)
    .get(getAllPlans)
    // POST /api/pricing: Create a new plan (Admin route)
    .post(createPlan); 

// ------------------------------------------------------------------
// Specific ID Route: /api/pricing/:id
// ------------------------------------------------------------------
router.route('/:id')
    // GET /api/pricing/:id: Get a single plan by ID
    .get(getPlanById)
    // PUT /api/pricing/:id: Update a plan by ID (Admin route)
    .put(updatePlan) 
    // DELETE /api/pricing/:id: Delete a plan by ID (Admin route)
    .delete(deletePlan); 

export default router;