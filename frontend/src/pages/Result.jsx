import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Result.module.css'
import { Sunrise, Coffee, Apple, UtensilsCrossed, ChefHat, Moon, BedDouble, Leaf, CalendarDays, BarChart2 } from 'lucide-react'

const MEAL_ICONS = {
  'Подъём':         <Sunrise size={20} color="#8B7BB8" />,
  'Завтрак':        <Coffee size={20} color="#8B7BB8" />,
  'Перекус':        <Apple size={20} color="#8B7BB8" />,
  'Обед':           <UtensilsCrossed size={20} color="#8B7BB8" />,
  'Ужин':           <ChefHat size={20} color="#8B7BB8" />,
  'Поздний перекус':<Moon size={20} color="#8B7BB8" />,
  'Сон':            <BedDouble size={20} color="#8B7BB8" />,
}

export default function Result() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [activeDay, setActiveDay] = useState(1)

  useEffect(() => {
    const saved = localStorage.getItem('nutritionPlan')
    if (!saved) { navigate('/form'); return; }
    setData(JSON.parse(saved))
  }, [])

  if (!data) return null

  const { kbzhu, plan } = data
  const currentDay = plan.find(d => d.day === activeDay)
  const meals = currentDay?.schedule || []
  const summary = currentDay?.daily_summary

  return (
    <div className={styles.page}>
      {/* Хедер */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/form')}>← Изменить параметры</button>
        <div className={styles.logo} style={{display:'flex', alignItems:'center', gap:'8px'}}>
         <Leaf size={18} color="#7B6BAA" /> NutriPlan
        </div>
        <button className={styles.newPlan} onClick={() => navigate('/')}>На главную</button>
      </div>

      <div className={styles.container}>

        {/* Верхняя карточка — суточная норма */}
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
              { label: 'Углеводы', value: kbzhu.carbs, unit: 'г', color: '#E07B7B'  },
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

        {/* Навигация по дням */}
        <div className={styles.daysNav}>
          <div className={styles.daysScroll}>
            {plan.map(d => (
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
                      <div className={styles.dishName}>{slot.dish}</div>
                      <div className={styles.dishMeta}>
                        <span>⏱ {slot.minutes} мин</span>
                        {slot.portion_note && (
                          <span className={styles.portionNote}>!  {slot.portion_note}</span>
                        )}
                      </div>
                      {slot.alternatives?.length > 0 && (
                        <div className={styles.alternatives}>
                          <span className={styles.altLabel}>Альтернативы:</span>
                          {slot.alternatives.map((alt, j) => (
                            <span key={j} className={styles.altTag}>{alt}</span>
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

          {/* Итог дня */}
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
                <div className={styles.advice}>✦  {summary.advice}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
