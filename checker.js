// backend/cleanup_orphans.js

import mongoose from 'mongoose';
// 🛑 ADD THIS LINE TO LOAD .env FILE
import 'dotenv/config'; 

// You will need to replace the paths below with your actual paths
import Course from './models/courses.model.js'; 
import Quiz from './models/quizzes.model.js';

// WARNING: MONGO_URI is now loaded from your .env file
const MONGO_URI = process.env.MONGO_URI; 

async function deleteOrphanedQuizzes() {
    console.log("--- Starting Orphaned Quiz Cleanup Script ---");
    
    // Check if URI is available for debugging
    if (!MONGO_URI) {
        console.error("❌ CRITICAL ERROR: MONGO_URI is not defined. Check your .env file and path.");
        await mongoose.disconnect();
        return;
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Database connection established.");

        // Step 1: Use aggregation to identify orphaned quizzes
        const orphanedQuizzes = await Quiz.aggregate([
            {
                $lookup: {
                    from: Course.collection.name, // 'courses' collection name
                    localField: "courseID",      // The field in the Quiz model pointing to the Course ID
                    foreignField: "_id",         // The primary key in the Course model
                    as: "courseCheck",           
                },
            },
            {
                $match: {
                    courseCheck: { $eq: [] },
                },
            },
            {
                $project: {
                    _id: 1,
                    quizTitle: 1,
                    orphanedCourseId: "$courseID",
                },
            },
        ]);

        const orphanedIds = orphanedQuizzes.map(q => q._id);

        if (orphanedIds.length > 0) {
            console.log(`\n🔍 Found ${orphanedIds.length} orphaned quizzes ready for deletion.`);
            orphanedQuizzes.forEach(q => {
                console.log(` - Deleting: ${q.quizTitle} (Orphan ID: ${q.orphanedCourseId})`);
            });

            // Step 2: Delete the identified documents
            const result = await Quiz.deleteMany({ _id: { $in: orphanedIds } });
            
            console.log(`\n✅ Cleanup Complete: Successfully deleted ${result.deletedCount} orphaned quizzes.`);
        } else {
            console.log('✅ No orphaned quizzes found. Database is clean.');
        }

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR DURING CLEANUP:', error);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed.");
    }
}

deleteOrphanedQuizzes();