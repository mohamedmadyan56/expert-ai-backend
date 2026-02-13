const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// 1) تعريف الـ Schema (لازم دي تكون الأول)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'expert', 'admin'],default: 'user' }
});

// 2) الـ Middleware (لازم يكون بعد الـ Schema وقبل الـ Model)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return ;
  this.password = await bcrypt.hash(this.password, 12);
 
});
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
// 3) تحويل الـ Schema لـ Model (ده لازم يكون آآآخر حاجة)
const User = mongoose.model('User', userSchema);
module.exports = User;