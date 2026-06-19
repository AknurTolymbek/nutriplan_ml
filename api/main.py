from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import pickle
import warnings
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity

warnings.filterwarnings('ignore')

app = FastAPI(title="Nutrition Planner API")

# Разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("models/kbzhu_model.pkl", "rb") as f:
    kbzhu_data = pickle.load(f)
kbzhu_model    = kbzhu_data["model"]
activity_order = kbzhu_data["activity_order"]

with open("models/recommender_vectors.pkl", "rb") as f:
    rec_data = pickle.load(f)
kazakh_recipes = rec_data["kazakh_recipes"]

print("✅ Models loaded successfully")
print(f"   Kazakh recipes: {len(kazakh_recipes)}")


# ─── Схемы запроса и ответа ────────────────────────────────────────────────
class UserProfile(BaseModel):
    # Обязательные поля
    gender: str                    # "female" или "male"
    age: int
    height: float                  # в сантиметрах
    weight: float                  # в килограммах
    target_weight: float           # целевой вес в килограммах

    # Необязательные поля — система подставит значения по умолчанию
    activity: Optional[str] = "moderate"   # sedentary, light, moderate, active
    goal_days: Optional[int] = None        # срок достижения цели в днях
    wake_time: Optional[str] = "08:00"     # время подъёма
    sleep_time: Optional[str] = "23:00"   # время сна
    plan_days: Optional[int] = 7          # на сколько дней генерировать план
    fridge_items: Optional[List[str]] = [] # продукты в холодильнике


# ─── Вспомогательные функции ───────────────────────────────────────────────
MEAL_CATEGORY = {
    "Завтрак":         "breakfast",
    "Перекус":         "snack",
    "Обед":            "main",
    "Ужин":            "main",
    "Поздний перекус": "snack"
}


def suggest_goal_days(current_weight: float, target_weight: float) -> int:
    """Предлагаем безопасный срок если пользователь не указал"""
    diff = abs(target_weight - current_weight)
    if diff == 0:
        return 90
    elif target_weight > current_weight:
        weeks = diff / 0.4
    else:
        weeks = diff / 0.7
    return max(int(weeks * 7), 30)


def predict_kbzhu(profile: UserProfile) -> dict:
    """Предсказываем суточную норму КБЖУ через ML модель"""
    goal_days = profile.goal_days
    suggested = False
    if goal_days is None:
        goal_days = suggest_goal_days(profile.weight, profile.target_weight)
        suggested = True

    gender_enc   = 0 if profile.gender == "female" else 1
    activity_enc = activity_order[profile.activity]
    weight_diff  = profile.target_weight - profile.weight

    X_input = pd.DataFrame([{
        "gender_encoded":   gender_enc,
        "age":              profile.age,
        "height":           profile.height,
        "weight":           profile.weight,
        "weight_diff":      weight_diff,
        "activity_encoded": activity_enc,
        "goal_days":        goal_days
    }])

    pred = kbzhu_model.predict(X_input)[0]
    return {
        "calories":       round(pred[0]),
        "protein":        round(pred[1]),
        "fat":            round(pred[2]),
        "carbs":          round(pred[3]),
        "goal_days":      goal_days,
        "suggested_days": suggested
    }


def recommend_dish(target_cal, target_prot, target_fat, target_carbs,
                   max_minutes, recipes_df, meal_type=None,
                   exclude_names=None, top_n=3):
    """Рекомендуем блюда через cosine similarity"""
    df = recipes_df.copy()
    df = df[df["minutes"] <= max_minutes * 3]
    df = df.dropna(subset=["calories", "protein", "fat", "carbs"])

    # Убираем мусорные рецепты
    df = df[df["calories"] >= 80]
    df = df[~((df["protein"] == 0) & (df["fat"] == 0))]
    df = df[~((df["protein"] <= 1) & (df["fat"] <= 1) & (df["carbs"] <= 5))]

    # Фильтруем по типу приёма пищи
    if meal_type and "category" in df.columns:
        cat = MEAL_CATEGORY.get(meal_type)
        if cat:
            cat_df = df[df["category"] == cat]
            if len(cat_df) >= 5:
                df = cat_df

    # Исключаем недавние блюда
    if exclude_names:
        df = df[~df["name"].isin(exclude_names)]

    if len(df) == 0:
        return None

    features = ["calories", "protein", "fat", "carbs", "minutes"]
    sc = MinMaxScaler()
    vecs = sc.fit_transform(df[features])

    target = np.array([[target_cal, target_prot, target_fat,
                        target_carbs, max_minutes]])
    target_vec = sc.transform(target)

    sims = cosine_similarity(target_vec, vecs)[0]
    top_idx = sims.argsort()[-top_n:][::-1]

    results = []
    for idx in top_idx:
        row = df.iloc[idx]
        rec_cal       = round(row["calories"])
        original_name = row["name"]

        if rec_cal > 0 and rec_cal < target_cal * 0.7:
            portions = round(target_cal / rec_cal, 1)
            portion_note = f"рекомендуем {portions} порции = {round(rec_cal * portions)} ккал"
        else:
            portions = 1
            portion_note = ""

        results.append({
            "name":          original_name,
            "original_name": original_name,
            "calories":      rec_cal,
            "protein":       round(row["protein"]),
            "fat":           round(row["fat"]),
            "carbs":         round(row["carbs"]),
            "minutes":       int(row["minutes"]),
            "portions":      portions,
            "portion_note":  portion_note
        })

    return results


def build_schedule(wake_time: str, sleep_time: str, kbzhu: dict) -> list:
    """Строим расписание приёмов пищи по времени подъёма и сна"""
    wake_h  = int(wake_time.split(":")[0])
    sleep_h = int(sleep_time.split(":")[0])

    # Правильный расчёт сна через полночь
    sleep_hours = 24 - sleep_h + wake_h if sleep_h > wake_h else wake_h - sleep_h

    cal  = kbzhu["calories"]
    prot = kbzhu["protein"]
    fat  = kbzhu["fat"]
    carb = kbzhu["carbs"]

    dinner_h     = min(sleep_h - 5, 18)
    late_snack_h = min(sleep_h - 3, 20)

    return [
        {"приём": "Подъём",         "время": f"{wake_h:02d}:00",       "is_meal": False, "действие": "Выпить стакан воды"},
        {"приём": "Завтрак",        "время": f"{wake_h+1:02d}:00",     "is_meal": True,  "calories": round(cal*0.25), "protein": round(prot*0.25), "fat": round(fat*0.25), "carbs": round(carb*0.25), "max_minutes": 20},
        {"приём": "Перекус",        "время": f"{wake_h+3:02d}:30",     "is_meal": True,  "calories": round(cal*0.10), "protein": round(prot*0.10), "fat": round(fat*0.10), "carbs": round(carb*0.10), "max_minutes": 10},
        {"приём": "Обед",           "время": f"{wake_h+5:02d}:00",     "is_meal": True,  "calories": round(cal*0.35), "protein": round(prot*0.35), "fat": round(fat*0.35), "carbs": round(carb*0.35), "max_minutes": 60},
        {"приём": "Ужин",           "время": f"{dinner_h:02d}:00",     "is_meal": True,  "calories": round(cal*0.25), "protein": round(prot*0.25), "fat": round(fat*0.25), "carbs": round(carb*0.25), "max_minutes": 45},
        {"приём": "Поздний перекус","время": f"{late_snack_h:02d}:00", "is_meal": True,  "calories": round(cal*0.05), "protein": round(prot*0.05), "fat": round(fat*0.05), "carbs": round(carb*0.05), "max_minutes": 5},
        {"приём": "Сон",            "время": f"{sleep_h:02d}:00",      "is_meal": False, "действие": f"Сон ({sleep_hours} часов)"}
    ]


def generate_plan(profile: UserProfile) -> dict:
    """Главная функция — генерируем полный план питания"""
    kbzhu    = predict_kbzhu(profile)
    schedule = build_schedule(profile.wake_time, profile.sleep_time, kbzhu)

    recent_meals = []
    WINDOW = 5 * 5
    plan   = []

    for day in range(1, profile.plan_days + 1):
        day_plan      = {"day": day, "schedule": []}
        day_calories  = 0

        for slot in schedule:
            if not slot["is_meal"]:
                day_plan["schedule"].append({
                    "meal":    slot["приём"],
                    "time":    slot["время"],
                    "is_meal": False,
                    "action":  slot["действие"]
                })
                continue

            dishes = recommend_dish(
                target_cal    = slot["calories"],
                target_prot   = slot["protein"],
                target_fat    = slot["fat"],
                target_carbs  = slot["carbs"],
                max_minutes   = slot["max_minutes"],
                recipes_df    = kazakh_recipes,
                meal_type     = slot["приём"],
                exclude_names = recent_meals,
                top_n         = 3
            )

            if dishes is None or len(dishes) == 0:
                recent_meals = []
                dishes = recommend_dish(
                    slot["calories"], slot["protein"],
                    slot["fat"], slot["carbs"],
                    slot["max_minutes"], kazakh_recipes,
                    meal_type=slot["приём"], top_n=3
                )

            if dishes:
                main_dish    = dishes[0]
                alternatives = dishes[1:]

                recent_meals.append(main_dish["original_name"])
                if len(recent_meals) > WINDOW:
                    recent_meals = recent_meals[-WINDOW:]

                day_calories += main_dish["calories"]

                day_plan["schedule"].append({
                    "meal":         slot["приём"],
                    "time":         slot["время"],
                    "is_meal":      True,
                    "dish":         main_dish["name"],
                    "calories":     main_dish["calories"],
                    "protein":      main_dish["protein"],
                    "fat":          main_dish["fat"],
                    "carbs":        main_dish["carbs"],
                    "minutes":      main_dish["minutes"],
                    "portions":     main_dish["portions"],
                    "portion_note": main_dish["portion_note"],
                    "alternatives": [d["name"] for d in alternatives]
                })

        # Итог дня — сколько калорий набрали и сколько не хватает
        deficit = kbzhu["calories"] - day_calories
        day_plan["daily_summary"] = {
            "eaten_calories":  day_calories,
            "target_calories": kbzhu["calories"],
            "deficit":         deficit,
            "advice": f"Увеличь порцию обеда в 1.5 раза чтобы добрать {deficit} ккал" if deficit > 300 else ""
        }

        plan.append(day_plan)

    return {
        "kbzhu":     kbzhu,
        "plan_days": profile.plan_days,
        "plan":      plan
    }


# ─── Эндпоинты API ─────────────────────────────────────────────────────────
@app.get("/")
def root():
    """Проверка что сервер работает"""
    return {"status": "ok", "message": "Nutrition Planner API is running"}


@app.post("/generate_plan")
def generate_meal_plan(profile: UserProfile):
    """
    Главный эндпоинт — принимает профиль пользователя и возвращает план питания.
    Обязательные поля: gender, age, height, weight, target_weight
    Необязательные: activity, goal_days, wake_time, sleep_time, plan_days, fridge_items
    """
    try:
        result = generate_plan(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/activities")
def get_activities():
    """Возвращаем список уровней активности для формы"""
    return {
        "activities": [
            {"value": "sedentary", "label": "Сидячий образ жизни"},
            {"value": "light",     "label": "Лёгкая активность (1-3 раза в неделю)"},
            {"value": "moderate",  "label": "Умеренная активность (3-5 раз в неделю)"},
            {"value": "active",    "label": "Высокая активность (каждый день)"}
        ]
    }
