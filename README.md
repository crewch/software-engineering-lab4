# Домашнее задание 04

## Проектирование и работа с MongoDB

### Вариант №21 — Система управления арендой автомобилей ([аналогичный](https://www.hertz.com/))

### Выполнил студент группы М8О-105СВ-25 Крючков Артемий Владимирович

---

## 1. Описание выбранного варианта

#### Приложение должно содержать следующие данные:

- Пользователь
- Автомобиль
- Аренда

#### Реализовать API:

- Создание нового пользователя
- Поиск пользователя по логину
- Поиск пользователя по маске имя и фамилии
- Добавление автомобиля в парк
- Получение списка доступных автомобилей
- Поиск автомобилей по классу
- Создание аренды
- Получение активных аренд пользователя
- Завершение аренды
- Получение истории аренд

---

## 2. Проектирование документной модели

Подробное описание проектирования документной модели с обоснованием выбора embedded/references представлено в файле [schema_design.md](schema_design.md).

### Коллекции:

1. **users** — пользователи системы
2. **cars** — автомобили
3. **rentals** — аренды (ссылки на users и cars)

### Выбор Embedded vs References:

| Сущность        | Связь | Решение        | Обоснование                                            |
| --------------- | ----- | -------------- | ------------------------------------------------------ |
| users ↔ rentals | 1:N   | **references** | Аренды растут независимо, нужен поиск по статусу/датам |
| cars ↔ rentals  | 1:N   | **references** | Автомобили существуют независимо от аренд              |
| users ↔ cars    | N:M   | **references** | Связь через rentals, нет прямой зависимости            |

---

## 3. Реализация REST API сервиса

- **Фреймворк:** Userver (C++)
- **Endpoints:** 7 реализованных HTTP handlers
- **База данных:** MongoDB 7.0
- **Архитектура:** Domain Driven Design (DDD)
- **DTO:** Сгенерировано через chaotic
- **Аутентификация:** JWT токены
- **Спецификация:** OpenAPI 3.0 (`api/openapi.yaml`)

### Реализованные endpoints:

| Метод | Path                            | Описание              |
| ----- | ------------------------------- | --------------------- |
| POST  | `/api/v1/users`                 | Создание пользователя |
| POST  | `/api/v1/users/login`           | Аутентификация (JWT)  |
| GET   | `/api/v1/users/by-login/:login` | Поиск по логину       |
| POST  | `/api/v1/cars`                  | Добавление автомобиля |
| GET   | `/api/v1/cars/available`        | Список доступных      |
| GET   | `/api/v1/cars/class/:car_class` | Поиск по классу       |
| POST  | `/api/v1/rentals`               | Создание аренды       |

---

## 4. MongoDB запросы

### 4.1. CRUD операции

Все CRUD операции представлены в файле [queries.js](queries.js):

- **Create**: `insertOne()`, `insertMany()`
- **Read**: `find()`, `findOne()` с операторами `$eq`, `$ne`, `$gt`, `$lt`, `$in`, `$and`, `$or`, `$regex`
- **Update**: `updateOne()`, `updateMany()` с операторами `$set`, `$inc`, `$mul`, `$push`, `$pull`, `$unset`
- **Delete**: `deleteOne()`, `deleteMany()`

### 4.2. Валидация схем

Валидация схем с использованием `$jsonSchema` представлена в файле [validation.js](validation.js):

- Обязательные поля (required)
- Типы данных (bsonType)
- Ограничения (min/max, pattern, enum)
- Уровни валидации (strict/moderate)
- Действия при нарушении (error/warn)

### 4.3. Aggregation Pipeline

Сложные запросы с aggregation pipeline представлены в файле [aggregation.js](aggregation.js):

| №   | Отчет                    | Описание                                             |
| --- | ------------------------ | ---------------------------------------------------- |
| 1   | Статистика по классам    | Количество, средняя цена, диапазон, потенциал дохода |
| 2   | Активность пользователей | Топ-5 по сумме затрат с детализацией статусов        |
| 3   | Доход по автомобилям     | Топ-10 по доходу (завершенные аренды)                |
| 4   | Статусы аренд по месяцам | Динамика active/completed/cancelled                  |
| 5   | Использование автопарка  | Коэффициент использования по классам                 |
| 6   | Популярные автомобили    | Топ-5 по количеству аренд                            |
| 7   | Анализ длительности      | Средняя/мин/макс длительность по классам             |
| 8   | Сводная статистика       | Общая бизнес-статистика ($facet)                     |

**Используемые стадии:** `$match`, `$group`, `$project`, `$sort`, `$limit`, `$lookup`, `$unwind`, `$facet`, `$addFields`, `$redact`

---

## 5. Структура проекта

```
software-engineering-lab4/
├── schema_design.md          # Проектирование документной модели
├── data.js                   # Тестовые данные (12 users, 15 cars, 18 rentals)
├── queries.js                # CRUD операции MongoDB (20+ примеров)
├── validation.js             # Валидация схем $jsonSchema + индексы
├── aggregation.js            # Aggregation pipeline (8 отчетов)
├── init-mongo.js             # Скрипт инициализации MongoDB (автозапуск)
├── docker-compose.yml        # Docker конфигурация (MongoDB + API)
├── Dockerfile                # Сборка API с mongo-cxx-driver
├── Makefile                  # Команды сборки и запуска
├── .env                      # Переменные окружения
├── api/
│   └── openapi.yaml          # OpenAPI 3.0 спецификация
├── docs/
│   └── definitions/          # DTO схемы (user, car, rental, errors)
├── src/
│   ├── main.cpp              # Точка входа Userver
│   ├── infrastructure/
│   │   ├── mongo_storage/    # MongoDB хранилище (6 файлов)
│   │   └── jwt/              # JWT компонент
│   ├── services/             # Бизнес-логика (user, car, rental)
│   ├── controllers/          # REST API handlers (7 endpoints)
│   └── lib/                  # Общие утилиты
├── configs/
│   ├── static_config.yaml    # Конфигурация userver
│   └── config_vars.yaml      # Переменные конфигурации
├── tests/                    # Тесты
└── postman/                  # Postman коллекция для тестирования API
```

---

## 6. Запуск проекта

### 6.1. Требования

- Docker и Docker Compose
- MongoDB Shell (mongosh) — опционально для ручных запросов
- VS Code + Dev Containers (опционально для разработки API)

### 6.2. Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/crewch/software-engineering-lab4.git
cd software-engineering-lab4

# Запустить MongoDB и API
docker-compose up -d
```

**Что происходит:**

1. Создается сеть `api_network`
2. Запускается MongoDB 7.0 с персистентным volume
3. Выполняется `init-mongo.js` — создаются коллекции, валидация, индексы, тестовые данные
4. Запускается API контейнер (сборка из Dockerfile)

Тестовые данные загружаются автоматически при первом запуске контейнера MongoDB через `docker-entrypoint-initdb.d/`.

---

## 7. Сборка и запуск API

### 7.1. Сборка из VS Code в Dev Container

1. Открыть проект в VS Code:

```bash
code .
```

2. Установить расширение `ms-vscode-remote.remote-containers`

3. Открыть проект в контейнере: `Reopen in container` (Ctrl+Shift+P → "Dev Containers: Reopen in Container")

4. Собрать проект:

```sh
make build-debug
```

5. Создать симлинк для compile_commands.json (для IntelliSense):

```sh
ln -sf build-debug/compile_commands.json .
```

5. Запустить API:

Перед запуском поменять `mongo-uri` с `prod` на `local` и заменить `ip` на свой в [static_config.yaml](configs/static_config.yaml)

```sh
make start-debug
```

### 7.2. Тесты

Перед запуском поменять `mongo-uri` с `prod` на `local` и заменить `ip` на свой в [static_config.yaml](configs/static_config.yaml)

```sh
make test-debug
```

---

## 8. Примеры запросов

Импортируйте коллекцию из папки `postman/` для удобного тестирования API через GUI.

---

## 9. Результат

| Файл                                     | Описание                                                             |
| ---------------------------------------- | -------------------------------------------------------------------- |
| [schema_design.md](schema_design.md)     | Проектирование документной модели с обоснованием embedded/references |
| [data.js](data.js)                       | Тестовые данные (45 документов)                                      |
| [queries.js](queries.js)                 | CRUD операции MongoDB (20+ примеров)                                 |
| [validation.js](validation.js)           | Валидация схем $jsonSchema + индексы                                 |
| [aggregation.js](aggregation.js)         | Aggregation pipeline (8 отчетов)                                     |
| [docker-compose.yml](docker-compose.yml) | Docker конфигурация (MongoDB + API)                                  |
| [init-mongo.js](init-mongo.js)           | Скрипт автоматической инициализации MongoDB                          |
| [api/openapi.yaml](api/openapi.yaml)     | OpenAPI 3.0 спецификация                                             |
