# Домашнее задание 03

## Проектирование и оптимизация реляционной базы данных

### Вариант №21 — Система управления арендой автомобилей ([аналогичный](https://www.hertz.com/))

### Выполнил студент группы М8О-105СВ-25 Крючков Артемий Владимирович

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

## 2. Проектирование REST API

В файле [api/openapi_full.yaml](api/openapi_full.yaml) схема API. В директории [docs/definitions](docs/definitions) - модели данных.

---

## 3. Реализация REST API сервиса

- Реализовано на Userver;
- Реализованы 7 эндпоинтов;
- PostgreSQL;
- Соблюдены принципы Domain Driven Design;
- DTO сгенерировано chaotic.

---

## 4. Реализация аутентификации

- Реализована JWT авторизация (простая, HS256). Пристствует валидация юзера по id с помощью jwt на всех endpoint-ах, кроме создание пользователя и логин. Подробнее в [configs/static_config.yaml](configs/static_config.yaml)

---

## 5. Документирование API

Openapi-спецификация в [api/openapi_full.yaml](api/openapi_full.yaml)

---

## 6. Тестирование

Интеграционные тесты на python в директории tests. Для запуска используйте команды `make test-debug` или `make test-release`.

Также есть [конфиг postman](postman/-api-v1.postman_collection.json) для ручного тестирования.

---

## 7. Описание схемы базы данных

База данных предназначена для системы аренды автомобилей и состоит из трех основных сущностей:

- **users** — пользователи системы
- **cars** — автомобили
- **rentals** — аренды автомобилей

Также используются перечисления (ENUM) для фиксированных наборов значений.

---

### Перечисления (ENUM)

#### car_class_enum

Класс автомобиля:

* economy
* compact
* midsize
* fullsize
* luxury
* suv
* van

Используется в таблице `cars`.

---

#### rental_status_enum

Статус аренды:

* active — активная аренда
* completed — завершена
* cancelled — отменена

Используется в таблице `rentals`.

---

### Таблица users

Хранит информацию о пользователях.

#### Поля:

* `id` — UUID, первичный ключ
* `login` — уникальный логин пользователя
* `first_name` — имя
* `last_name` — фамилия
* `email` — уникальный email
* `password` — хэш пароля
* `phone` — телефон (опционально)
* `created_at` — дата создания

#### Ограничения:

* `login` — UNIQUE
* `email` — UNIQUE

---

### Таблица cars

Хранит автомобили, доступные для аренды.

#### Поля:

* `id` — UUID, первичный ключ
* `vin` — уникальный VIN номер
* `brand` — марка
* `model` — модель
* `year` — год выпуска (1900–2030)
* `car_class` — класс автомобиля (ENUM)
* `license_plate` — уникальный номер
* `daily_rate` — стоимость аренды в день
* `available` — доступность автомобиля
* `created_at` — дата добавления

#### Ограничения:

* `vin` — UNIQUE
* `license_plate` — UNIQUE
* `year` — CHECK (диапазон)
* `daily_rate` — CHECK (>= 0)

---

### Таблица rentals

Хранит информацию об арендах автомобилей.

#### Поля:

* `id` — UUID, первичный ключ
* `user_id` — пользователь (FK → users.id)
* `car_id` — автомобиль (FK → cars.id)
* `start_date` — дата начала аренды
* `end_date` — дата окончания
* `total_cost` — итоговая стоимость
* `status` — статус аренды (ENUM)
* `created_at` — дата создания

#### Ограничения:

* `user_id` → users(id) (ON DELETE CASCADE)
* `car_id` → cars(id) (ON DELETE CASCADE)
* `end_date > start_date`
* `total_cost >= 0`

---

### Связи между таблицами

* Один пользователь → много аренд (1:N)
* Один автомобиль → много аренд (1:N)

Таблица `rentals` является связующей между `users` и `cars`.

## 8. Результат

- Исходный код: [src](src)
- openapi.yaml: [api/openapi_full.yaml](api/openapi_full.yaml)
- README.md: [README.md](README.md)
- Тесты: [tests](tests)
- Конфиг postman: [конфиг postman](postman/-api-v1.postman_collection.json)
- Dockerfile: [Dockerfile](Dockerfile)
- docker-compose.yml: [docker-compose.yml](docker-compose.yml)
- Схема БД [schema.sql](schema.sql)
- Скрипт для базового заполнения БД [data.sql](data.sql)
- Запросы sql [queries.sql](queries.sql)
- Оптимизация БД: [optimization.md](optimization.md)

---

## 9. Запуск

```
git clone https://github.com/crewch/software-engineering-lab3.git
docker-compose up
```

## Сборка из vscode в devcontainer

1. Скачать репозиторий и открыть его в vscode из директории:

```
git clone https://github.com/crewch/software-engineering-lab3.git
code .
```

2. Скачать расширение ms-vscode-remote.remote-containers
3. Открыть проект в vscode и нажать 'Reopen in container'
4. Открыть терминал от пользователя user (можно в vscode Terminal -> New Terminal либо через docker exec и sudo su user)
5. Собрать проект с помощью:

```sh
make build-debug
```

6. Прописать симлинку, чтобы в vscode не было ошибок

```sh
ln -sf build-debug/compile_commands.json .
```

## Запуск из devcontainer

Поменять dbconnection в [static_config.yaml](configs/static_config.yaml) на local

```sh
make start-debug
```

## Тесты из devcontainer

```sh
make test-debug
```
