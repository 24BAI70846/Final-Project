const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { User, Meal, Activity } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrition-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey123';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, calorieGoal } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, calorieGoal });
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, calorieGoal: user.calorieGoal } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/meals', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const meals = await Meal.find({ userId: req.userId, date });
    res.json(meals);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/meals', auth, async (req, res) => {
  try {
    const { date, type, foods } = req.body;
    let meal = await Meal.findOne({ userId: req.userId, date, type });
    if (meal) {
      meal.foods.push(...foods);
      await meal.save();
    } else {
      meal = await Meal.create({ userId: req.userId, date, type, foods });
    }
    res.json(meal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/meals/:id', auth, async (req, res) => {
  try {
    const { foodId } = req.query;
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { $pull: { foods: { _id: foodId } } },
      { new: true }
    );

    if (!meal) return res.status(404).json({ error: 'Meal not found' });
    
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.delete('/activities/:id', auth, async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.get('/activities', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const activities = await Activity.find({ userId: req.userId, date });
    res.json(activities);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/activities', auth, async (req, res) => {
  try {
    const { date, name, duration, caloriesBurned } = req.body;
    const activity = await Activity.create({ userId: req.userId, date, name, duration, caloriesBurned });
    res.json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/activities/:id', auth, async (req, res) => {
  try {
    await Activity.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));