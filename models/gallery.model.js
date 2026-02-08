import mongoose from 'mongoose';

const GallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      // Not required
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String], 
      default: [],
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Private"],
      default: "Published",
    },
    // The images array: Stores URLs of the uploaded images
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Gallery item must contain at least one image.",
      },
    }
  },
  { timestamps: true }
);

export default mongoose.model('Gallery', GallerySchema);