import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'
import { useRef } from 'react'
import { ClipboardList, Brain, CalendarDays, Coffee, Apple, UtensilsCrossed, ChefHat, Leaf } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
    const howRef = useRef(null)

  return (
    <div className={styles.page}>

      {/* Навигация */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Leaf size={22} color="#8B7BB8" />
          <span className={styles.logoText}>NutriPlan</span>
        </div>
        <button className={styles.navBtn} onClick={() => navigate('/form')}>
          Начать →
        </button>
      </nav>

      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.badge}>✦ Персональный план питания</div>
          <h1 className={styles.heroTitle}>
            Питайся умно.<br />
            <span className={styles.accent}>Достигай целей.</span>
          </h1>
          <p className={styles.heroDesc}>
            Система на основе машинного обучения создаёт персональный план питания
            с учётом твоих параметров, цели и продуктов которые есть дома.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.btnPrimary} onClick={() => navigate('/form')}>
              Создать мой план
            </button>
            <button className={styles.btnSecondary} onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth' })}>
             Узнать больше ↓
            </button>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>142</span>
              <span className={styles.statLabel}>блюда в базе</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>7–90</span>
              <span className={styles.statLabel}>дней планирования</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>ML</span>
              <span className={styles.statLabel}>алгоритм подбора</span>
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardHeader}>
              <span style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <CalendarDays size={16} color="#7B6BAA" /> Сегодня
              </span>
              <span className={styles.heroCardKcal}>2 242 ккал</span>
            </div>
            {[
              { time: '09:00', meal: 'Завтрак', dish: 'Сырники со сметаной', kcal: 420, icon: <Coffee size={20} color="#7B6BAA" /> },
              { time: '11:30', meal: 'Перекус', dish: 'Греческий йогурт с ягодами', kcal: 240, icon: <Apple size={20} color="#7B6BAA" /> },
              { time: '13:00', meal: 'Обед', dish: 'Плов с курицей', kcal: 575, icon: <UtensilsCrossed size={20} color="#7B6BAA" /> },
              { time: '18:00', meal: 'Ужин', dish: 'Гречка с мясом', kcal: 420, icon: <ChefHat size={20} color="#7B6BAA" /> },
            ].map((item, i) => (
              <div key={i} className={styles.mealRow}>
                <span className={styles.mealIcon}>{item.icon}</span>
                <div className={styles.mealInfo}>
                  <span className={styles.mealTime}>{item.time} · {item.meal}</span>
                  <span className={styles.mealDish}>{item.dish}</span>
                </div>
                <span className={styles.mealKcal}>{item.kcal}</span>
              </div>
            ))}
          </div>

          {/* Декоративные элементы */}
          <div className={styles.blob1} />
          <div className={styles.blob2} />
        </div>
      </section>

      {/* Как это работает */}
      <section className={styles.howSection} ref={howRef}>
        <h2 className={styles.sectionTitle}>Как это работает</h2>
        <p className={styles.sectionDesc}>Три простых шага до персонального плана питания</p>

        <div className={styles.steps}>
          {[
            { num: '01', icon:  <ClipboardList size={28} color="#7B6BAA" />, title: 'Введи параметры', desc: 'Укажи пол, возраст, вес, рост и свою цель — похудеть, набрать массу или поддержать форму.' },
            { num: '02', icon: <Brain size={28} color="#7B6BAA" />, title: 'ML подбирает план', desc: 'Алгоритм рассчитывает суточную норму КБЖУ и подбирает блюда под твои цели через cosine similarity.' },
            { num: '03', icon: <UtensilsCrossed size={28} color="#7B6BAA" />, title: 'Получи расписание', desc: 'Готовый план по дням с точным временем приёмов пищи, альтернативными блюдами и советами по порциям.' },
          ].map((step, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNum}>{step.num}</div>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Готовы начать?</h2>
          <p className={styles.ctaDesc}>Создай свой персональный план питания за 2 минуты</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/form')}>
            Создать план питания →
          </button>
        </div>
      </section>

      {/* Футер */}
      <footer className={styles.footer}>
        <span style={{display:'inline-flex', alignItems:'center', gap:'6px'}}>
            <Leaf size={16} color="#7B6BAA" /> NutriPlan · ML-система персонального питания</span>
      </footer>
    </div>
  )
}
