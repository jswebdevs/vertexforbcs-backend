import mongoose from 'mongoose';

const PricingSchema = new mongoose.Schema({
  // Corresponds to the 'packageName' from the JSON
  packageName: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    unique: true, // Ensures no duplicate package names
  },
  // Corresponds to 'packageDetails' (similar to 'subHeading' in the slider)
  packageDetails: {
    type: String,
    required: [true, 'Package details (short description) are required'],
    trim: true,
  },
  // Corresponds to 'price' and ensuring it's stored as a Number
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  // Added based on the React component for dynamic pricing display
  billingCycle: {
    type: String,
    required: [true, 'Billing cycle is required (e.g., month, year)'],
    enum: ['month', 'year', 'lifetime', '3 months', '6 months'],
    default: 'month',
  },
  // Corresponds to the 'features' array
  features: {
    type: [String], // Array of strings for plan features
    required: [true, 'At least one feature is required'],
  },
  // Added based on the React component logic (isPopular)
  isPopular: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export default mongoose.model('Pricing', PricingSchema, 'pricing');