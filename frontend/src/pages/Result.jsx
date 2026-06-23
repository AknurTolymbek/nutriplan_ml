import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Result.module.css'
import { Sunrise, Coffee, Apple, UtensilsCrossed, ChefHat, Moon, BedDouble, Leaf, CalendarDays, BarChart2, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const MEAL_ICONS = {
  'Подъём':         <Sunrise size={20} color="#8B7BB8" />,
  'Завтрак':        <Coffee size={20} color="#8B7BB8" />,
  'Перекус':        <Apple size={20} color="#8B7BB8" />,
  'Обед':           <UtensilsCrossed size={20} color="#8B7BB8" />,
  'Ужин':           <ChefHat size={20} color="#8B7BB8" />,
  'Поздний перекус':<Moon size={20} color="#8B7BB8" />,
  'Сон':            <BedDouble size={20} color="#8B7BB8" />,
}

function RecipeModal({ dishName, onClose }) {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`http://localhost:8000/recipe/${encodeURIComponent(dishName)}`)
      .then(r => { setRecipe(r.data); setLoading(false) })
      .catch(() => { setError('Рецепт не найден в базе'); setLoading(false) })
  }, [dishName])

  // Парсим steps если это строка вида "['шаг1', 'шаг2']"
  const parseSteps = (raw) => {
    try {
      const cleaned = raw.replace(/'/g, '"')
      const arr = JSON.parse(cleaned)
      return Array.isArray(arr) ? arr : [raw]
    } catch {
      return [raw]
    }
  }

  const parseIngredients = (raw) => {
    try {
      const cleaned = raw.replace(/'/g, '"')
      const arr = JSON.parse(cleaned)
      return Array.isArray(arr) ? arr : [raw]
    } catch {
      return [raw]
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{dishName}</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>

        {loading && <div className={styles.modalLoading}>Загрузка...</div>}
        {error && <div className={styles.modalError}>{error}</div>}

        {recipe && (
          <div className={styles.modalBody}>
            {/* КБЖУ */}
            <div className={styles.modalNutrition}>
              <div className={styles.modalNutrItem}>
                <span className={styles.modalNutrVal}>{recipe.calories}</span>
                <span className={styles.modalNutrLabel}>ккал</span>
              </div>
              <div className={styles.modalNutrItem}>
                <span className={styles.modalNutrVal} style={{color:'#7BC67E'}}>{recipe.protein}г</span>
                <span className={styles.modalNutrLabel}>белки</span>
              </div>
              <div className={styles.modalNutrItem}>
                <span className={styles.modalNutrVal} style={{color:'#F0B429'}}>{recipe.fat}г</span>
                <span className={styles.modalNutrLabel}>жиры</span>
              </div>
              <div className={styles.modalNutrItem}>
                <span className={styles.modalNutrVal} style={{color:'#E07B7B'}}>{recipe.carbs}г</span>
                <span className={styles.modalNutrLabel}>углеводы</span>
              </div>
              <div className={styles.modalNutrItem}>
                <Clock size={16} color="#7B6BAA" />
                <span className={styles.modalNutrVal}>{recipe.minutes} мин</span>
              </div>
            </div>

            {/* Ингредиенты */}
            {recipe.ingredients && (
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Ингредиенты</h3>
                <ul className={styles.modalIngredients}>
                  {parseIngredients(recipe.ingredients).map((ing, i) => (
                    <li key={i} className={styles.modalIngredientItem}>• {ing}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Шаги */}
            {recipe.steps && (
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Приготовление</h3>
                <ol className={styles.modalSteps}>
                  {parseSteps(recipe.steps).map((step, i) => (
                    <li key={i} className={styles.modalStep}>
                      <span className={styles.modalStepNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!recipe.ingredients && !recipe.steps && (
              <div className={styles.modalNoRecipe}>
                Подробный рецепт недоступен. Это блюдо подобрано по калорийности и КБЖУ.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Result() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [activeDay, setActiveDay] = useState(1)
  const [weekOffset, setWeekOffset] = useState(0) // какая неделя показана
  const [selectedDish, setSelectedDish] = useState(null) // для модалки

  useEffect(() => {
    const saved = localStorage.getItem('nutritionPlan')
    if (!saved) { navigate('/form'); return; }
    setData(JSON.parse(saved))
  }, [])

  if (!data) return null

  const { kbzhu, plan } = data
  const totalDays = plan.length
  const daysPerPage = 7
  const totalWeeks = Math.ceil(totalDays / daysPerPage)

  // Дни текущей недели
  const weekStart = weekOffset * daysPerPage
  const weekEnd = Math.min(weekStart + daysPerPage, totalDays)
  const visibleDays = plan.slice(weekStart, weekEnd)

  // При смене недели переключаем на первый день этой недели
  const goToWeek = (offset) => {
    setWeekOffset(offset)
    setActiveDay(offset * daysPerPage + 1)
  }

  const currentDay = plan.find(d => d.day === activeDay)
  const meals = currentDay?.schedule || []
  const summary = currentDay?.daily_summary

  return (
    <div className={styles.page}>
      {selectedDish && (
        <RecipeModal dishName={selectedDish} onClose={() => setSelectedDish(null)} />
      )}

      {/* Хедер */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/form')}>← Изменить параметры</button>
        <div className={styles.logo} style={{display:'flex', alignItems:'center', gap:'8px'}}>
         <Leaf size={18} color="#7B6BAA" /> NutriPlan
        </div>
        <button className={styles.newPlan} onClick={() => navigate('/')}>На главную</button>
      </div>

      <div className={styles.container}>

        {/* КБЖУ карточка */}
        <div className={styles.kbzhuCard}>
          <div className={styles.kbzhuLeft}>
            <div className={styles.kbzhuBadge}>✦ Твоя суточная норма</div>
            <div className={styles.kbzhuMain}>
              <span className={styles.kbzhuCal}>{kbzhu.calories}</span>
              <span className={styles.kbzhuCalLabel}>ккал / день</span>
            </div>
            {kbzhu.suggested_days && (
              <div className={styles.goalNote}>
                <CalendarDays size={16} color="#7B6BAA" /> Срок достижения цели: <strong>{kbzhu.goal_days} дней</strong>
                <span className={styles.goalSub}> · план обновляется каждые 7 дней</span>
              </div>
            )}
          </div>
          <div className={styles.kbzhuRight}>
            {[
              { label: 'Белки', value: kbzhu.protein, unit: 'г', color: '#7BC67E' },
              { label: 'Жиры', value: kbzhu.fat, unit: 'г', color: '#F0B429' },
              { label: 'Углеводы', value: kbzhu.carbs, unit: 'г', color: '#E07B7B' },
            ].map((item, i) => (
              <div key={i} className={styles.kbzhuItem}>
                <div className={styles.kbzhuItemVal} style={{color: item.color}}>
                  {item.value}<span className={styles.kbzhuUnit}>{item.unit}</span>
                </div>
                <div className={styles.kbzhuItemLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Навигация по дням с пагинацией по неделям */}
        <div className={styles.daysNav}>
          {totalWeeks > 1 && (
            <div className={styles.weekNav}>
              <button
                className={styles.weekBtn}
                onClick={() => goToWeek(weekOffset - 1)}
                disabled={weekOffset === 0}
              >
                <ChevronLeft size={16} /> Пред. неделя
              </button>
              <span className={styles.weekLabel}>
                Неделя {weekOffset + 1} из {totalWeeks} · Дни {weekStart + 1}–{weekEnd}
              </span>
              <button
                className={styles.weekBtn}
                onClick={() => goToWeek(weekOffset + 1)}
                disabled={weekOffset === totalWeeks - 1}
              >
                След. неделя <ChevronRight size={16} />
              </button>
            </div>
          )}
          <div className={styles.daysScroll}>
            {visibleDays.map(d => (
              <button
                key={d.day}
                className={`${styles.dayBtn} ${activeDay === d.day ? styles.dayActive : ''}`}
                onClick={() => setActiveDay(d.day)}
              >
                <span className={styles.dayNum}>День {d.day}</span>
                <span className={styles.dayCal}>{d.daily_summary?.eaten_calories} ккал</span>
              </button>
            ))}
          </div>
        </div>

        {/* Расписание дня */}
        <div className={styles.dayContent}>
          <div className={styles.schedule}>
            {meals.map((slot, i) => (
              <div key={i} className={`${styles.slot} ${!slot.is_meal ? styles.slotDivider : ''}`}>
                {!slot.is_meal ? (
                  <div className={styles.dividerRow}>
                    <span className={styles.dividerIcon}>{MEAL_ICONS[slot.meal] || '•'}</span>
                    <span className={styles.dividerTime}>{slot.time}</span>
                    <span className={styles.dividerText}>{slot.meal} — {slot.action}</span>
                  </div>
                ) : (
                  <div className={styles.mealCard}>
                    <div className={styles.mealLeft}>
                      <div className={styles.mealMeta}>
                        <span className={styles.mealIcon}>{MEAL_ICONS[slot.meal] || '🍴'}</span>
                        <div>
                          <div className={styles.mealTime}>{slot.time}</div>
                          <div className={styles.mealType}>{slot.meal}</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.mealCenter}>
                      <div
                        className={styles.dishName}
                        onClick={() => setSelectedDish(slot.dish)}
                        title="Нажмите чтобы увидеть рецепт"
                      >
                        {slot.dish} <span className={styles.dishRecipeHint}>→ рецепт</span>
                      </div>
                      <div className={styles.dishMeta}>
                        <span>⏱ {slot.minutes} мин</span>
                        {slot.portion_note && (
                          <span className={styles.portionNote}>! {slot.portion_note}</span>
                        )}
                      </div>
                      {slot.alternatives?.length > 0 && (
                        <div className={styles.alternatives}>
                          <span className={styles.altLabel}>Альтернативы:</span>
                          {slot.alternatives.map((alt, j) => (
                            <span
                              key={j}
                              className={styles.altTag}
                              onClick={() => setSelectedDish(alt)}
                              title="Нажмите чтобы увидеть рецепт"
                            >
                              {alt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.mealRight}>
                      <div className={styles.mealCal}>{slot.calories}</div>
                      <div className={styles.mealCalLabel}>ккал</div>
                      <div className={styles.mealMacros}>
                        <span>Б {slot.protein}г</span>
                        <span>Ж {slot.fat}г</span>
                        <span>У {slot.carbs}г</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {summary && (
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}><BarChart2 size={18} color="#7B6BAA" /> Итог дня {activeDay}</div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryVal}>{summary.eaten_calories}</span>
                  <span className={styles.summaryLabel}>Съедено ккал</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={styles.summaryVal}>{summary.target_calories}</span>
                  <span className={styles.summaryLabel}>Норма ккал</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={`${styles.summaryVal} ${styles.deficit}`}>-{summary.deficit}</span>
                  <span className={styles.summaryLabel}>Дефицит</span>
                </div>
              </div>
              {summary.advice && (
                <div className={styles.advice}>✦ {summary.advice}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}