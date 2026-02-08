// quizrecord.model.js
const userQuizRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    // This is where you put the heavy data
    details: [ 
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" }, 
            serialNo: { type: Number },
            answer: { type: String } // Option selected (A, B, C, D)
        }
    ],
    // You might also duplicate the final score here for completeness
    score: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
});