import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Form.module.css'
import { Leaf, Snowflake, User, Venus, Mars, Zap, UtensilsCrossed } from 'lucide-react'

const FRIDGE_OPTIONS = [
  'яйцо', 'молоко', 'курица', 'говядина', 'рис', 'гречка', 'макароны',
  'картофель', 'морковь', 'лук', 'помидор', 'огурец', 'капуста',
  'масло сливочное', 'масло растительное', 'сыр', 'творог', 'сметана',
  'кефир', 'мука', 'сахар', 'чеснок', 'болгарский перец', 'свёкла'
]

export default function Form() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fridge, setFridge] = useState([])
  const [form, setForm] = useState({
    gender: 'female',
    age: '',
    height: '',
    weight: '',
    target_weight: '',
    activity: 'moderate',
    wake_time: '08:00',
    sleep_time: '23:00',
    plan_days: 7,
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleFridge = (item) => {
    setFridge(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const handleSubmit = async () => {
    if (!form.age || !form.height || !form.weight || !form.target_weight) {
      setError('Пожалуйста заполните все обязательные поля')
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/generate_plan', {
        ...form,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        target_weight: parseFloat(form.target_weight),
        plan_days: parseInt(form.plan_days),
        goal_days: null,
        fridge_items: fridge,
      })
      // Сохраняем результат в localStorage
      localStorage.setItem('nutritionPlan', JSON.stringify(response.data))
      navigate('/result')
    } catch (err) {
      setError('Ошибка при генерации плана. Проверь что бэк запущен.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Хедер */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>← Назад</button>
        <div className={styles.logo} style={{display:'flex',alignItems:'center',gap:'8px'}}><Leaf size={18} color="#7B6BAA" /> NutriPlan</div>
      </div>

      <div className={styles.container}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Расскажите о себе</h1>
          <p className={styles.subtitle}>Заполните параметры — система создаст персональный план питания</p>
        </div>

        <div className={styles.formGrid}>
          {/* Левая колонка */}
          <div className={styles.formLeft}>

            {/* Основные параметры */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <User size={20} color="#7B6BAA" />
                <span className={styles.cardTitle}>Основные параметры</span>
                <span className={styles.required}>* обязательно</span>
              </div>

              {/* Пол */}
              <div className={styles.field}>
                <label className={styles.label}>Пол</label>
                <div className={styles.genderBtns}>
                  <button
                    className={`${styles.genderBtn} ${form.gender === 'female' ? styles.genderActive : ''}`}
                    onClick={() => setForm({...form, gender: 'female'})}
                  ><Venus size={16} color="#7B6BAA" /> Женский</button>
                  <button
                    className={`${styles.genderBtn} ${form.gender === 'male' ? styles.genderActive : ''}`}
                    onClick={() => setForm({...form, gender: 'male'})}
                  ><Mars size={16} color="#7B6BAA" /> Мужской</button>
                </div>
              </div>

              <div className={styles.row3}>
                <div className={styles.field}>
                  <label className={styles.label}>Возраст *</label>
                  <input className={styles.input} type="number" name="age" placeholder="20" value={form.age} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Рост (см) *</label>
                  <input className={styles.input} type="number" name="height" placeholder="165" value={form.height} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Текущий вес (кг) *</label>
                  <input className={styles.input} type="number" name="weight" placeholder="60" value={form.weight} onChange={handleChange} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Целевой вес (кг) *</label>
                <input className={styles.input} type="number" name="target_weight" placeholder="55" value={form.target_weight} onChange={handleChange} />
                {form.weight && form.target_weight && (
                  <span className={styles.hint}>
                    {parseFloat(form.target_weight) > parseFloat(form.weight)
                      ? `📈 Набор ${(form.target_weight - form.weight).toFixed(1)} кг`
                      : parseFloat(form.target_weight) < parseFloat(form.weight)
                      ? `📉 Похудение на ${(form.weight - form.target_weight).toFixed(1)} кг`
                      : `⚖️ Поддержание веса`
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Активность и расписание */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Zap size={20} color="#7B6BAA" />
                <span className={styles.cardTitle}>Активность и расписание</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Уровень активности</label>
                <select className={styles.select} name="activity" value={form.activity} onChange={handleChange}>
                  <option value="sedentary">Сидячий образ жизни</option>
                  <option value="light">Лёгкая активность (1–3 раза в неделю)</option>
                  <option value="moderate">Умеренная активность (3–5 раз в неделю)</option>
                  <option value="active">Высокая активность (каждый день)</option>
                </select>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Время подъёма</label>
                  <input className={styles.input} type="time" name="wake_time" value={form.wake_time} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Время сна</label>
                  <input className={styles.input} type="time" name="sleep_time" value={form.sleep_time} onChange={handleChange} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Период планирования</label>
                <div className={styles.daysBtns}>
                  {[7, 30, 90].map(d => (
                    <button
                      key={d}
                      className={`${styles.dayBtn} ${form.plan_days === d ? styles.dayActive : ''}`}
                      onClick={() => setForm({...form, plan_days: d})}
                    >
                      {d === 7 ? '7 дней' : d === 30 ? '30 дней' : '90 дней'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка — холодильник */}
          <div className={styles.formRight}>
            <div className={`${styles.card} ${styles.cardFull}`}>
              <div className={styles.cardHeader}>
                <Snowflake size={20} color="#7B6BAA" />
                <span className={styles.cardTitle}>Что есть в холодильнике?</span>
              </div>
              <p className={styles.fridgeHint}>Отметь продукты которые есть дома — система учтёт их при подборе блюд</p>
              <div className={styles.fridgeGrid}>
                {FRIDGE_OPTIONS.map(item => (
                  <button
                    key={item}
                    className={`${styles.fridgeItem} ${fridge.includes(item) ? styles.fridgeActive : ''}`}
                    onClick={() => toggleFridge(item)}
                  >
                    {fridge.includes(item) ? '✓ ' : ''}{item}
                  </button>
                ))}
              </div>
              {fridge.length > 0 && (
                <div className={styles.fridgeCount}>
                  Выбрано: {fridge.length} продуктов
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.loading}>
              <span className={styles.spinner} /> Генерируем план...
            </span>
          ) : (
            <span style={{display:'flex',alignItems:'center',gap:'8px',justifyContent:'center'}}>
             <UtensilsCrossed size={18} color="white" /> Создать план питания
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
