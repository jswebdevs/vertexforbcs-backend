import mongoose from 'mongoose';

const SliderSchema = new mongoose.Schema({
  heading: {
    type: String, 
    trim: true
  },
  subHeading: {
    type: String,
    trim: true
  },
  link: {
    type: String
  },
  ctaText: {
    type: String
  },
  media: {
    url: { 
      type: String, 
      required: true 
    }, 
    type: { 
      type: String, 
      enum: ['image', 'video'], 
      default: 'image' 
    }
  }
});

export default mongoose.model('Slider', SliderSchema);