import { useState, useEffect } from 'react';
import { register, login, getUser, getMeals, addMeal, deleteMeal, getActivities, addActivity } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRegister, setIsRegister] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', calorieGoal: 2000 });
  const [breakfastInput, setBreakfastInput] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [lunchInput, setLunchInput] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [dinnerInput, setDinnerInput] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [snacksInput, setSnacksInput] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [activityForm, setActivityForm] = useState({ name: '', duration: '', caloriesBurned: '' });

  useEffect(() => {
    if (token) {
      loadUser();
      loadData();
    }
  }, [token, date]);

  const loadUser = async () => {
    

    
    try {
      const res = await getUser();
      setUser(res.data);
    } catch (err) {
      logout();
    }
  };

  const loadData = async () => {
    try {
      const mealsRes = await getMeals(date);
      setMeals(mealsRes.data);
      const activitiesRes = await getActivities(date);
      setActivities(activitiesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(formData);
        setIsRegister(false);
        alert('Registration successful! Please login.');
      } else {
        const res = await login({ email: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Auth failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const handleAddFood = async (e, type, inputData, setInputData) => {
    e.preventDefault();
    try {
      await addMeal({
        date,
        type,
        foods: [{
          name: inputData.name,
          calories: parseInt(inputData.calories),
          protein: parseFloat(inputData.protein),
          carbs: parseFloat(inputData.carbs),
          fat: parseFloat(inputData.fat)
        }]
      });
      setInputData({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      loadData();
    } catch (err) {
      alert('Failed to add food');
    }
  };

  const handleDeleteFood = async (mealId, foodId) => {
    try {
      await deleteMeal(mealId, foodId);
      loadData();
    } catch (err) {
      alert('Failed to delete food');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity(activityId);
      loadData();
    } catch (err) {
      alert('Failed to delete activity');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await addActivity({
        date,
        name: activityForm.name,
        duration: parseInt(activityForm.duration),
        caloriesBurned: parseInt(activityForm.caloriesBurned)
      });
      setActivityForm({ name: '', duration: '', caloriesBurned: '' });
      loadData();
    } catch (err) {
      alert('Failed to add activity');
    }
  };

  const getMealsByType = (type) => {
    const meal = meals.find(m => m.type === type);
    return meal ? meal.foods : [];
  };

  const getTotals = () => {
    let consumed = 0;
    let burned = 0;
    meals.forEach(m => m.foods.forEach(f => consumed += f.calories || 0));
    activities.forEach(a => burned += a.caloriesBurned || 0);
    const goal = user?.calorieGoal || 2000;
    const remaining = goal - consumed + burned;
    return { consumed, burned, remaining, goal };
  };

  if (!token) {
    return (
      <div className="auth-container">
        <h1>Daily Nutrition Tracker</h1>
        <div className="auth-box">
          <h2>{isRegister ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleAuth}>
            {isRegister && (
              <>
                <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input type="number" placeholder="Daily Calorie Goal" value={formData.calorieGoal} onChange={e => setFormData({...formData, calorieGoal: e.target.value})} />
              </>
            )}
            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
          </form>
          <p onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Already have account? Login' : 'Need account? Register'}
          </p>
        </div>
      </div>
    );
  }

  const { consumed, burned, remaining, goal } = getTotals();
  const progress = Math.min((consumed / goal) * 100, 100);

  const mealInputs = {
    breakfast: { state: breakfastInput, setter: setBreakfastInput },
    lunch: { state: lunchInput, setter: setLunchInput },
    dinner: { state: dinnerInput, setter: setDinnerInput },
    snacks: { state: snacksInput, setter: setSnacksInput }
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Daily Nutrition Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="calorie-summary">
        <div className="circle-progress">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="bg-circle" />
            <circle cx="50" cy="50" r="45" className="progress-circle" style={{ strokeDasharray: `${progress * 2.83} 283` }} />
          </svg>
          <div className="circle-text">
            <div className="calorie-num">{consumed}</div>
            <div className="calorie-label">Consumed</div>
          </div>
        </div>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Goal</span>
            <span className="stat-value">{goal}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Burned</span>
            <span className="stat-value burned">{burned}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Remaining</span>
            <span className={`stat-value ${remaining < 0 ? 'negative' : ''}`}>{remaining}</span>
          </div>
        </div>
      </div>

      <div className="meals-container">
        {['breakfast', 'lunch', 'dinner', 'snacks'].map(type => {
          const { state, setter } = mealInputs[type];
          return (
            <div key={type} className="meal-section">
              <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
              <div className="food-list">
                {getMealsByType(type).map((food, idx) => {
                  const meal = meals.find(m => m.type === type);
                  return (
                    <div key={idx} className="food-item">
                      <span className="food-name">{food.name}</span>
                      <span className="food-cal">{food.calories} cal</span>
                      <span className="food macros">P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g</span>
                      <button className="delete-btn" onClick={() => handleDeleteFood(meal._id, food._id)}>×</button>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={(e) => handleAddFood(e, type, state, setter)} className="add-food-form">
                <input type="text" placeholder="Food name" value={state.name} onChange={e => setter({...state, name: e.target.value})} required />
                <input type="number" placeholder="Cal" value={state.calories} onChange={e => setter({...state, calories: e.target.value})} required />
                <input type="number" placeholder="Protein" value={state.protein} onChange={e => setter({...state, protein: e.target.value})} required />
                <input type="number" placeholder="Carbs" value={state.carbs} onChange={e => setter({...state, carbs: e.target.value})} required />
                <input type="number" placeholder="Fat" value={state.fat} onChange={e => setter({...state, fat: e.target.value})} required />
                <button type="submit">Add</button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="activities-section">
        <h3>Activities</h3>
        <div className="activity-list">
          {activities.map((act, idx) => (
            <div key={idx} className="activity-item">
              <span className="activity-name">{act.name}</span>
              <span className="activity-duration">{act.duration} min</span>
              <span className="activity-cal">{act.caloriesBurned} cal burned</span>
              <button className="delete-btn" onClick={() => handleDeleteActivity(act._id)}>×</button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddActivity} className="add-activity-form">
          <input type="text" placeholder="Activity (running, gym...)" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} required />
          <input type="number" placeholder="Duration (min)" value={activityForm.duration} onChange={e => setActivityForm({...activityForm, duration: e.target.value})} required />
          <input type="number" placeholder="Calories burned" value={activityForm.caloriesBurned} onChange={e => setActivityForm({...activityForm, caloriesBurned: e.target.value})} required />
          <button type="submit">Add Activity</button>
        </form>
      </div>
    </div>
  );
}

export default App;