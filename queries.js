// queries.js - MongoDB запросы для системы аренды автомобилей
// Демонстрация CRUD операций и различных операторов MongoDB
//
// НАЗНАЧЕНИЕ: Для ручного запуска через docker exec
// ЗАПУСК: docker exec -i car-rental-mongodb mongosh -u mongo -p mongo car_rental < queries.js
//
// Примечание: При автоматической инициализации этот скрипт вызывается из init-mongo.js

const db = db.getSiblingDB('car_rental')

print('=== MongoDB Запросы для Car Rental API ===\n')

// ============================================================================
// CREATE (Вставка документов)
// ============================================================================
print('=== 1. CREATE OPERATIONS ===\n')

// 1.1 Вставка одного документа (insertOne)
print('1.1 Вставка нового пользователя (insertOne):')
const newUser = db.users.insertOne({
	login: 'test_user',
	first_name: 'Тест',
	last_name: 'Тестов',
	email: 'test@example.com',
	password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
	phone: '+79990000000',
	created_at: new Date(),
})
print(`Создан пользователь с ID: ${newUser.insertedId}\n`)

// 1.2 Вставка нескольких документов (insertMany)
print('1.2 Вставка новых автомобилей (insertMany):')
const newCars = db.cars.insertMany([
	{
		vin: 'WBA8E9C50KN123458',
		brand: 'BMW',
		model: '5 Series',
		year: 2024,
		car_class: 'fullsize',
		license_plate: 'C789DE777',
		daily_rate: 7500.0,
		available: true,
		created_at: new Date(),
	},
	{
		vin: 'WAUZZZ8V8KA123459',
		brand: 'Audi',
		model: 'A4',
		year: 2023,
		car_class: 'compact',
		license_plate: 'D012FG777',
		daily_rate: 4500.0,
		available: true,
		created_at: new Date(),
	},
])
print(`Создано ${Object.keys(newCars.insertedIds).length} автомобиля\n`)

// ============================================================================
// READ (Поиск документов)
// ============================================================================
print('=== 2. READ OPERATIONS ===\n')

// 2.1 Найти всех пользователей (find all)
print('2.1 Все пользователи (find all):')
const allUsers = db.users.find().limit(3).toArray()
allUsers.forEach((u) => print(`  - ${u.login}: ${u.first_name} ${u.last_name}`))
print(`  ... всего: ${db.users.countDocuments()}\n`)

// 2.2 Найти пользователя по логину ($eq)
print('2.3 Поиск пользователя по логину ($eq):')
const userByLogin = db.users.findOne({ login: 'ivan_petrov' })
if (userByLogin) {
	print(
		`  Найден: ${userByLogin.first_name} ${userByLogin.last_name} (${userByLogin.email})\n`,
	)
}

// 2.3 Поиск по маске имени и фамилии ($regex)
print('2.4 Поиск по маске имени ($regex):')
const usersByName = db.users
	.find({
		first_name: { $regex: /^А/, $options: 'i' }, // Начинается на "А"
	})
	.limit(5)
	.toArray()
print(
	`  Пользователи на "А": ${usersByName.map((u) => u.first_name).join(', ')}\n`,
)

// 2.4 Поиск доступных автомобилей
print('2.5 Доступные автомобили ($eq):')
const availableCars = db.cars.countDocuments({ available: true })
print(`  Доступно автомобилей: ${availableCars}\n`)

// 2.5 Поиск автомобилей по классу
print('2.6 Автомобили класса SUV:')
const suvCars = db.cars.find({ car_class: 'suv', available: true }).toArray()
suvCars.forEach((c) => print(`  - ${c.brand} ${c.model} (${c.license_plate})`))
print('')

// 2.6 Поиск по диапазону цен ($gte, $lte)
print('2.7 Автомобили стоимостью 5000-10000 руб/день ($gte, $lte):')
const midRangeCars = db.cars
	.find({
		daily_rate: { $gte: 5000, $lte: 10000 },
	})
	.toArray()
midRangeCars.forEach((c) =>
	print(`  - ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 2.7 Поиск по нескольким классам ($in)
print('2.8 Автомобили классов luxury или van ($in):')
const luxuryVans = db.cars
	.find({
		car_class: { $in: ['luxury', 'van'] },
	})
	.toArray()
luxuryVans.forEach((c) => print(`  - ${c.brand} ${c.model} (${c.car_class})`))
print('')

// 2.8 Поиск с исключением ($ne)
print('2.9 Автомобили НЕ класса economy ($ne):')
const notEconomy = db.cars.countDocuments({
	car_class: { $ne: 'economy' },
})
print(`  Найдено: ${notEconomy}\n`)

// 2.10 Активные аренды пользователя
print('2.10 Активные аренды пользователя (поиск по user_id):')
const ivan = db.users.findOne({ login: 'ivan_petrov' })
if (ivan) {
	const activeRentals = db.rentals
		.find({
			user_id: ivan._id,
			status: 'active',
		})
		.toArray()
	print(`  Активные аренды у ${ivan.first_name}: ${activeRentals.length}`)
	activeRentals.forEach((r) => {
		const car = db.cars.findOne({ _id: r.car_id })
		print(
			`    - ${car.brand} ${car.model} до ${r.end_date.toLocaleDateString()}`,
		)
	})
	print('')
}

// 2.11 Поиск с $and
print('2.11 Автомобили SUV доступные и дороже 7000 руб/день ($and):')
const expensiveSuvs = db.cars
	.find({
		$and: [
			{ car_class: 'suv' },
			{ available: true },
			{ daily_rate: { $gt: 7000 } },
		],
	})
	.toArray()
expensiveSuvs.forEach((c) =>
	print(`  - ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 2.12 Поиск с $or
print('2.12 Автомобили 2023 ИЛИ 2024 года ($or):')
const recentCars = db.cars
	.find({
		$or: [{ year: 2023 }, { year: 2024 }],
	})
	.limit(5)
	.toArray()
print(`  Найдено: ${recentCars.length} автомобилей`)
recentCars.forEach((c) => print(`    - ${c.brand} ${c.model} (${c.year})`))
print('')

// 2.13 Поиск с $lt (меньше чем)
print('2.13 Автомобили дешевле 4000 руб/день ($lt):')
const cheapCars = db.cars
	.find({
		daily_rate: { $lt: 4000 },
	})
	.toArray()
cheapCars.forEach((c) =>
	print(`  - ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 2.14 История аренд пользователя (все статусы)
print('2.14 История всех аренд пользователя:')
const maria = db.users.findOne({ login: 'maria_sidorova' })
if (maria) {
	const allRentals = db.rentals
		.find({
			user_id: maria._id,
		})
		.sort({ created_at: -1 })
		.toArray()
	print(`  Всего аренд у ${maria.first_name}: ${allRentals.length}`)
	allRentals.forEach((r) => {
		const car = db.cars.findOne({ _id: r.car_id })
		print(`    - [${r.status}] ${car.brand} ${car.model}: ${r.total_cost} руб`)
	})
	print('')
}

// ============================================================================
// UPDATE (Обновление документов)
// ============================================================================
print('=== 3. UPDATE OPERATIONS ===\n')

// 3.1 Обновление одного поля ($set)
print('3.1 Обновление статуса автомобиля ($set):')
const carToUpdate = db.cars.findOne({ vin: 'WBA3A5C50CF123456' })
if (carToUpdate) {
	db.cars.updateOne({ _id: carToUpdate._id }, { $set: { available: false } })
	const updated = db.cars.findOne({ _id: carToUpdate._id })
	print(
		`  ${updated.brand} ${updated.model}: available = ${updated.available}\n`,
	)
	// Возвращаем обратно
	db.cars.updateOne({ _id: carToUpdate._id }, { $set: { available: true } })
}

// 3.2 Обновление нескольких полей
print('3.2 Обновление нескольких полей:')
db.users.updateOne(
	{ login: 'test_user' },
	{
		$set: {
			phone: '+79991112233',
			last_name: 'Обновленов',
		},
	},
)
const updatedUser = db.users.findOne({ login: 'test_user' })
print(`  Телефон обновлен: ${updatedUser.phone}\n`)

// 3.3 Обновление по условию (множественное)
print('3.3 Повышение стоимости всех luxury на 10%:')
const luxuryResult = db.cars.updateMany(
	{ car_class: 'luxury' },
	{ $mul: { daily_rate: 1.1 } },
)
print(`  Обновлено автомобилей: ${luxuryResult.modifiedCount}`)
const luxuryCars = db.cars.find({ car_class: 'luxury' }).toArray()
luxuryCars.forEach((c) =>
	print(`    - ${c.brand} ${c.model}: ${c.daily_rate.toFixed(2)} руб/день`),
)
// Возвращаем обратно
db.cars.updateMany({ car_class: 'luxury' }, { $mul: { daily_rate: 1 / 1.1 } })
print('')

// 3.4 Инкремент числового поля ($inc)
print('3.4 Инкремент года выпуска ($inc):')
const oldCar = db.cars.findOne({ year: { $lt: 2021 } })
if (oldCar) {
	const oldYear = oldCar.year
	db.cars.updateOne({ _id: oldCar._id }, { $inc: { year: 1 } })
	const updated = db.cars.findOne({ _id: oldCar._id })
	print(`  ${updated.brand} ${updated.model}: ${oldYear} → ${updated.year}\n`)
	// Возвращаем обратно
	db.cars.updateOne({ _id: oldCar._id }, { $inc: { year: -1 } })
}

// 3.5 Добавление в массив ($push) - добавим историю изменений
print('3.5 Добавление в массив ($push):')
// Сначала добавим поле history некоторым арендам
const rentalToUpdate = db.rentals.findOne({ status: 'active' })
if (rentalToUpdate) {
	db.rentals.updateOne(
		{ _id: rentalToUpdate._id },
		{
			$push: {
				history: {
					action: 'created',
					timestamp: new Date(),
					note: 'Аренда создана',
				},
			},
		},
	)
	const updated = db.rentals.findOne(
		{ _id: rentalToUpdate._id },
		{ history: 1 },
	)
	print(`  Добавлена запись в историю: ${updated.history[0].action}\n`)
}

// 3.6 Удаление из массива ($pull)
print('3.6 Удаление из массива ($pull):')
if (rentalToUpdate) {
	db.rentals.updateOne(
		{ _id: rentalToUpdate._id },
		{ $pull: { history: { action: 'created' } } },
	)
	const updated = db.rentals.findOne(
		{ _id: rentalToUpdate._id },
		{ history: 1 },
	)
	print(
		`  История очищена, осталось записей: ${updated.history ? updated.history.length : 0}\n`,
	)
}

// 3.7 Удаление поля ($unset)
print('3.7 Удаление поля ($unset):')
db.rentals.updateOne({ _id: rentalToUpdate._id }, { $unset: { history: '' } })
print(`  Поле 'history' удалено\n`)

// ============================================================================
// DELETE (Удаление документов)
// ============================================================================
print('=== 4. DELETE OPERATIONS ===\n')

// 4.1 Удаление одного документа
print('4.1 Удаление тестового пользователя:')
const testUser = db.users.findOne({ login: 'test_user' })
if (testUser) {
	const deleteResult = db.users.deleteOne({ _id: testUser._id })
	print(`  Удалено документов: ${deleteResult.deletedCount}\n`)
}

// 4.2 Удаление по условию
print('4.2 Удаление тестовых автомобилей:')
const testCars = db.cars.deleteMany({
	vin: { $in: ['WBA8E9C50KN123458', 'WAUZZZ8V8KA123459'] },
})
print(`  Удалено автомобилей: ${testCars.deletedCount}\n`)

// 4.3 Удаление отмененных аренд старше 30 дней
print('4.3 Подсчет отмененных аренд:')
const cancelledCount = db.rentals.countDocuments({ status: 'cancelled' })
print(`  Найдено отмененных аренд: ${cancelledCount}\n`)

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ОПЕРАТОРЫ
// ============================================================================
print('=== 5. ADDITIONAL OPERATORS ===\n')

// 5.1 $exists - проверка существования поля
print('5.1 Пользователи с телефоном ($exists):')
const usersWithPhone = db.users.countDocuments({
	phone: { $exists: true, $ne: null },
})
print(`  Пользователей с телефоном: ${usersWithPhone}\n`)

// 5.2 $size - размер массива
print('5.2 Аренды с историей изменений ($size):')
const rentalsWithHistory = db.rentals.countDocuments({
	history: { $exists: true },
	$expr: { $gt: [{ $size: '$history' }, 0] },
})
print(`  Аренд с историей: ${rentalsWithHistory}\n`)

// 5.3 $type - проверка типа поля
print('5.3 Проверка типов полей ($type):')
const validDates = db.cars.countDocuments({
	created_at: { $type: 'date' },
})
print(`  Автомобилей с корректной датой: ${validDates}\n`)

// 5.4 $expr - выражения с полями
print('5.4 Аренды где end_date > start_date ($expr):')
const validRentals = db.rentals.countDocuments({
	$expr: { $gt: ['$end_date', '$start_date'] },
})
print(`  Корректных аренд: ${validRentals}\n`)

// 5.5 Сортировка и лимит
print('5.5 Топ-5 самых дорогих автомобилей:')
const topCars = db.cars.find().sort({ daily_rate: -1 }).limit(5).toArray()
topCars.forEach((c, i) =>
	print(`  ${i + 1}. ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 5.6 Проекция (выбор конкретных полей)
print('5.6 Только VIN и марка автомобилей:')
const projected = db.cars
	.find({}, { vin: 1, brand: 1, _id: 0 })
	.limit(5)
	.toArray()
projected.forEach((p) => print(`  ${p.vin}: ${p.brand}`))
print('')

// ============================================================================
// ИТОГОВАЯ СТАТИСТИКА
// ============================================================================
print('=== ИТОГОВАЯ СТАТИСТИКА ===')
print(`Пользователей: ${db.users.countDocuments()}`)
print(`Автомобилей: ${db.cars.countDocuments()}`)
print(`Аренд: ${db.rentals.countDocuments()}`)
print(`\nЗапросы выполнены успешно!`)
