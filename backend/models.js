const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  calorieGoal: { type: Number, default: 2000 }
});

const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snacks'], required: true },
  foods: [{
    name: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }]
});

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  caloriesBurned: { type: Number, required: true }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Meal: mongoose.model('Meal', mealSchema),
  Activity: mongoose.model('Activity', activitySchema)
};