// Scratch script to test the pincode controller in isolation
import { getPincodeDetails } from '../src/controllers/pincode.controller.js';

console.log('Testing pincode controller loading...');
if (typeof getPincodeDetails === 'function') {
  console.log('✅ pincode controller loaded successfully!');
} else {
  console.error('❌ Failed to load pincode controller.');
}
