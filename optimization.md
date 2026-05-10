# Анализ часто выполняемых запросов

В системе выполняются следующие основные запросы:

**Users:**

* `SELECT * FROM users WHERE login = $1`
* `SELECT * FROM users WHERE id = $1`
* `SELECT 1 FROM users WHERE id = $1`

**Cars:**

* `SELECT * FROM cars WHERE available = true`
* `SELECT * FROM cars WHERE car_class = ?`
* `SELECT * FROM cars WHERE id = $1`

**Rentals:**

* `SELECT * FROM rentals WHERE user_id = $1 AND status = 'active'`
* `SELECT * FROM rentals WHERE user_id = $1 ORDER BY start_date DESC`
* `SELECT * FROM rentals WHERE id = $1`

---

### Результаты оптимизации

Тесты проводились на `1e6` пользователей, `1e6` машин и `1e5` аренд

| Запрос          | До         | После      | Вывод                             |
| --------------- | ---------- | ---------- | --------------------------------- |
| users by login  | 0.59 ms    | 0.152 ms   | индекс даёт ускорение             |
| cars available  | 170.275 ms | 143.514 ms | индекс даёт ускорение             |
| cars by class   | 123.206 ms | 96.485 ms  | индекс даёт ускорение                  |
| rentals active  | 1.055 ms   | 0.163 ms   | сильное ускорение                 |
| rentals history | 1.233 ms   | 0.101 ms   | сильное ускорение                 |

---

### Используемые индексы и их назначение

#### 1. Первичные ключи (PRIMARY KEY)

Создаются автоматически:

* `users(id)`
* `cars(id)`
* `rentals(id)`

Назначение:

* Быстрый поиск по ID

---

#### 2. Уникальные индексы

```sql
CREATE UNIQUE INDEX idx_users_login ON users(login);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

Используются в:

```sql
SELECT * FROM users WHERE login = $1;
```

Эффект:

*  Ускоряют доступ к пользователям по login или email

---

#### 3. Индексы по внешним ключам

```sql
CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_rentals_car_id ON rentals(car_id);
```

Назначение:

* Ускоряют доступ к арендам по пользователю и автомобилю

---

#### 4. Индексы по WHERE

```sql
CREATE INDEX idx_cars_available ON cars(available);
CREATE INDEX idx_rentals_status ON rentals(status);
```

Эффект:

* `cars.available` → умеренное ускорение
* зависит от распределения данных

---

#### 5. Составные индексы

##### rentals(user_id, status)

```sql
CREATE INDEX idx_rentals_user_status ON rentals(user_id, status);
```

Результат:

```text
1.055 ms → 0.163 ms
```

Эффект:

* значительное ускорение
* индекс сразу покрывает оба условия

---

##### rentals(user_id, start_date DESC)

```sql
CREATE INDEX idx_rentals_user_start_date ON rentals(user_id, start_date DESC);
```

Результат:

```text
1.233 ms → 0.101 ms
```

---

##### rentals(car_id, start_date, end_date)

```sql
CREATE INDEX idx_rentals_car_dates ON rentals(car_id, start_date, end_date);
```

Назначение:

* проверка доступности авто

---

##### cars(brand, model)

```sql
CREATE INDEX idx_cars_brand_model ON cars(brand, model);
```

Назначение:

* поиск по марке и модели

---

### Итог

1. Индексы особенно эффективны для:

   * сложных условий (user_id + status)
   * сортировки (ORDER BY)
   * больших таблиц

2. Наиболее заметное ускорение:

   * rentals (до 10x быстрее)
