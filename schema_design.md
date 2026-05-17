# Проектирование документной модели MongoDB

## Вариант №21 — Система управления арендой автомобилей

### Выполнил студент группы М8О-105СВ-25 Крючков Артемий Владимирович

---

## 1. Обзор документной модели

Для системы аренды автомобилей спроектирована документная модель с использованием **трех коллекций**:

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   users     │       │    cars      │       │   rentals   │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ _id         │       │ _id          │       │ _id         │
│ login       │       │ vin          │       │ user_id ────┼──→ users._id
│ first_name  │       │ brand        │       │ car_id ─────┼──→ cars._id
│ last_name   │       │ model        │       │ start_date  │
│ email       │       │ year         │       │ end_date    │
│ password    │       │ car_class    │       │ total_cost  │
│ phone       │       │ license_plate│       │ status      │
│ created_at  │       │ daily_rate   │       │ created_at  │
│ created_at  │       │ available    │       │             │
└─────────────┘       │ created_at   │       └─────────────┘
                      └──────────────┘
```

---

## 2. Структура коллекций

### 2.1 Коллекция `users`

Хранит информацию о пользователях системы.

```javascript
{
  _id: ObjectId,              // MongoDB ObjectId (первичный ключ)
  login: string,              // Уникальный логин (3-50 символов)
  first_name: string,         // Имя (1-100 символов)
  last_name: string,          // Фамилия (1-100 символов)
  email: string,              // Уникальный email
  password: string,           // Хэш пароля
  phone: string | null,       // Телефон (опционально)
  created_at: ISODate         // Дата создания аккаунта
}
```

**Индексы:**
- `login` — unique index (для поиска по логину)
- `email` — unique index (для уникальности)

---

### 2.2 Коллекция `cars`

Хранит информацию об автомобилях автопарка.

```javascript
{
  _id: ObjectId,              // MongoDB ObjectId (первичный ключ)
  vin: string,                // Уникальный VIN (17 символов)
  brand: string,              // Марка автомобиля
  model: string,              // Модель
  year: number,               // Год выпуска (1900-2030)
  car_class: string,          // Класс: economy, compact, midsize, fullsize, luxury, suv, van
  license_plate: string,      // Номерной знак
  daily_rate: number,         // Стоимость аренды в день (>= 0)
  available: boolean,         // Доступен для аренды
  created_at: ISODate         // Дата добавления в парк
}
```

**Индексы:**
- `vin` — unique index
- `license_plate` — unique index
- `car_class` + `available` — compound index (для поиска доступных по классу)

---

### 2.3 Коллекция `rentals`

Хранит информацию об арендах автомобилей.

```javascript
{
  _id: ObjectId,              // MongoDB ObjectId (первичный ключ)
  user_id: ObjectId,          // Ссылка на users._id
  car_id: ObjectId,           // Ссылка на cars._id
  start_date: ISODate,        // Начало аренды
  end_date: ISODate,          // Ожидаемое окончание
  total_cost: number,         // Общая стоимость (>= 0)
  status: string,             // active, completed, cancelled
  created_at: ISODate         // Дата создания аренды
}
```

**Индексы:**
- `user_id` + `status` — compound index (для поиска активных аренд пользователя)
- `car_id` + `status` — compound index (для проверки доступности автомобиля)
- `user_id` — index (для истории аренд)

---

## 3. Обоснование выбора Embedded vs References

### 3.1 Анализ связей

| Связь | Тип | Решение | Причина |
|-------|-----|---------|---------|
| users → rentals | 1:N | References | Аренды — отдельная сущность |
| cars → rentals | 1:N | References | История аренд растет независимо |
| users → cars | N:M | References | Связь через rentals |

### 3.2 Почему References для rentals

**Аргументы ПРОТИВ Embedded (встраивания аренд в пользователя):**

1. **Неограниченный рост документа**
   - При встраивании аренд в документ пользователя, документ будет расти
   - MongoDB имеет лимит 16MB на документ
   - Активный пользователь может иметь десятки/сотни аренд за годы

2. **Проблемы с запросами**
   - Невозможно эффективно найти все активные аренды среди всех пользователей
   - Сложно искать аренды по датам, статусам
   - Агрегации становятся неэффективными

3. **Консистентность данных**
   - При завершении аренды нужно обновлять документ пользователя
   - При удалении автомобиля нужно обновлять всех пользователей
   - Высокий риск race conditions

4. **Независимый жизненный цикл**
   - Аренда имеет свой статус (active → completed/cancelled)
   - Аренда существует независимо от пользователя
   - Требуется история всех аренд (даже после удаления пользователя)

**Аргументы ЗА References:**

1. **Нормализация данных**
   - Каждая сущность хранится в одном месте
   - Нет дублирования информации
   - Легче поддерживать консистентность

2. **Гибкость запросов**
   - Можно искать аренды по пользователю: `{ user_id: ObjectId }`
   - Можно искать аренды по автомобилю: `{ car_id: ObjectId }`
   - Можно фильтровать по статусу: `{ status: "active" }`

3. **Масштабируемость**
   - Коллекции можно шардировать независимо
   - Индексы оптимизируют конкретные запросы

---

## 4. Схема связей (ER-диаграмма)

```
┌──────────────────┐
│     users        │
│  ──────────────  │
│  _id (PK)        │
│  login (UNIQUE)  │
│  email (UNIQUE)  │
└────────┬─────────┘
         │ 1
         │
         │ N
         │
┌────────▼─────────┐       ┌──────────────────┐
│    rentals       │       │      cars        │
│  ──────────────  │       │  ──────────────  │
│  _id (PK)        │ N   1 │  _id (PK)        │
│  user_id (FK) ───┼───────│  vin (UNIQUE)    │
│  car_id (FK) ────┼───────│  license_plate   │
│  status          │       │  available       │
│  start_date      │       └──────────────────┘
│  end_date        │
│  total_cost      │
└──────────────────┘
```

---

## 5. Типы данных MongoDB

| Поле | Тип MongoDB | Описание |
|------|-------------|----------|
| `_id` | ObjectId | Автогенерируемый первичный ключ |
| `login`, `email`, `vin` | String | Строковые идентификаторы |
| `year`, `daily_rate`, `total_cost` | Number | Числовые значения |
| `available` | Boolean | Флаг доступности |
| `created_at`, `start_date`, `end_date` | Date | Даты и время |
| `phone` | String или Null | Опциональное поле |

---

## 6. Валидация схем

Для коллекции `users` определена валидация `$jsonSchema`:

```javascript
db.createCollection('users', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: ['login', 'first_name', 'last_name', 'email', 'password'],
			properties: {
				login: {
					bsonType: 'string',
					minLength: 3,
					maxLength: 50,
					pattern: '^[a-zA-Z0-9_-]+$',
					description:
						'Login must be 3-50 characters, alphanumeric with underscores or hyphens',
				},
				first_name: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 100,
					description: 'First name is required',
				},
				last_name: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 100,
					description: 'Last name is required',
				},
				email: {
					bsonType: 'string',
					maxLength: 255,
					description: 'Email is required',
				},
				password: {
					bsonType: 'string',
					minLength: 8,
					maxLength: 128,
					description: 'Password must be 8-128 characters',
				},
				phone: {
					bsonType: ['string', 'null'],
					pattern: '^\\+?[0-9\\s\\-()]{10,20}$',
					description: 'Phone must be 10-20 characters',
				},
				created_at: {
					bsonType: 'date',
					description: 'Creation timestamp',
				},
			},
		},
	},
	validationLevel: 'strict',
	validationAction: 'error',
})
```

Для коллекции `cars` определена валидация `$jsonSchema`:

```javascript
db.createCollection('cars', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: [
				'vin',
				'brand',
				'model',
				'year',
				'car_class',
				'license_plate',
				'daily_rate',
			],
			properties: {
				vin: {
					bsonType: 'string',
					pattern: '^[A-HJ-NPR-Z0-9]{17}$',
					description: 'VIN must be exactly 17 characters',
				},
				brand: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 50,
					description: 'Brand is required',
				},
				model: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 50,
					description: 'Model is required',
				},
				year: {
					bsonType: 'number',
					minimum: 1900,
					maximum: 2030,
					description: 'Year must be between 1900 and 2030',
				},
				car_class: {
					enum: [
						'economy',
						'compact',
						'midsize',
						'fullsize',
						'luxury',
						'suv',
						'van',
					],
					description: 'Car class must be one of the allowed values',
				},
				license_plate: {
					bsonType: 'string',
					description: 'License plate is required',
				},
				daily_rate: {
					bsonType: 'number',
					minimum: 0,
					description: 'Daily rate must be non-negative',
				},
				available: {
					bsonType: 'bool',
					description: 'Availability flag',
				},
				created_at: {
					bsonType: 'date',
					description: 'Creation timestamp',
				},
			},
		},
	},
	validationLevel: 'strict',
	validationAction: 'error',
})
```

Для коллекции `rentals` определена валидация `$jsonSchema`:

```javascript
db.createCollection('rentals', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: [
				'user_id',
				'car_id',
				'start_date',
				'end_date',
				'total_cost',
				'status',
			],
			properties: {
				user_id: {
					bsonType: 'objectId',
					description: 'Reference to user',
				},
				car_id: {
					bsonType: 'objectId',
					description: 'Reference to car',
				},
				start_date: {
					bsonType: 'date',
					description: 'Rental start date',
				},
				end_date: {
					bsonType: 'date',
					description: 'Rental end date',
				},
				total_cost: {
					bsonType: 'number',
					minimum: 0,
					description: 'Total cost must be non-negative',
				},
				status: {
					enum: ['active', 'completed', 'cancelled'],
					description: 'Rental status',
				},
				created_at: {
					bsonType: 'date',
					description: 'Creation timestamp',
				},
			},
		},
	},
	validationLevel: 'strict',
	validationAction: 'error',
})
```

---

## 7. Заключение

Выбранная модель с использованием **references** для всех связей обеспечивает:

1. Нормализацию данных и отсутствие дублирования
2. Гибкость запросов к любой сущности
3. Масштабируемость и независимый рост коллекций
4. Консистентность при обновлении данных
5. Возможность эффективного индексирования

