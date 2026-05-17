// aggregation.js - Aggregation Pipeline для системы аренды автомобилей
// Демонстрация сложных запросов с использованием стадий агрегации
// 8 отчётов: статистика по классам, активность пользователей, доход, использование автопарка
//
// НАЗНАЧЕНИЕ: Для ручного запуска через docker exec
// ЗАПУСК: docker exec -i car-rental-mongodb mongosh -u mongo -p mongo car_rental < aggregation.js
//
// Примечание: При автоматической инициализации этот скрипт вызывается из init-mongo.js

const db = db.getSiblingDB('car_rental')

print('=== AGGREGATION PIPELINES ===\n')

// ============================================================================
// 1. ОТЧЕТ: Статистика по классам автомобилей
// ============================================================================
print('=== 1. СТАТИСТИКА ПО КЛАССАМ АВТОМОБИЛЕЙ ===\n')

const carClassStats = db.cars
	.aggregate([
		{
			$match: { available: true }, // Только доступные автомобили
		},
		{
			$group: {
				_id: '$car_class',
				count: { $sum: 1 },
				avgPrice: { $avg: '$daily_rate' },
				minPrice: { $min: '$daily_rate' },
				maxPrice: { $max: '$daily_rate' },
				totalRevenue: { $sum: '$daily_rate' },
			},
		},
		{
			$project: {
				_id: 0,
				car_class: '$_id',
				count: 1,
				avgPrice: { $round: ['$avgPrice', 2] },
				minPrice: 1,
				maxPrice: 1,
				totalRevenue: 1,
			},
		},
		{
			$sort: { count: -1 },
		},
	])
	.toArray()

print('Доступные автомобили по классам:\n')
carClassStats.forEach((stat) => {
	print(`  ${stat.car_class.toUpperCase()}:`)
	print(`    Количество: ${stat.count}`)
	print(`    Средняя цена: ${stat.avgPrice} руб/день`)
	print(`    Диапазон: ${stat.minPrice} - ${stat.maxPrice} руб/день`)
	print(`    Потенциальный доход: ${stat.totalRevenue} руб/день\n`)
})

// ============================================================================
// 2. ОТЧЕТ: Активность пользователей (количество аренд)
// ============================================================================
print('=== 2. АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЕЙ ===\n')

const userActivity = db.rentals
	.aggregate([
		{
			$group: {
				_id: '$user_id',
				totalRentals: { $sum: 1 },
				activeRentals: {
					$sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
				},
				completedRentals: {
					$sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
				},
				cancelledRentals: {
					$sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
				},
				totalSpent: { $sum: '$total_cost' },
			},
		},
		{
			$lookup: {
				from: 'users',
				localField: '_id',
				foreignField: '_id',
				as: 'user',
			},
		},
		{
			$unwind: '$user',
		},
		{
			$project: {
				_id: 0,
				userId: '$_id',
				login: '$user.login',
				fullName: { $concat: ['$user.first_name', ' ', '$user.last_name'] },
				totalRentals: 1,
				activeRentals: 1,
				completedRentals: 1,
				cancelledRentals: 1,
				totalSpent: { $round: ['$totalSpent', 2] },
			},
		},
		{
			$sort: { totalSpent: -1 },
		},
		{
			$limit: 5,
		},
	])
	.toArray()

print('Топ-5 пользователей по сумме затрат:\n')
userActivity.forEach((u, i) => {
	print(`  ${i + 1}. ${u.fullName} (@${u.login})`)
	print(`     Всего аренд: ${u.totalRentals}`)
	print(
		`     Активных: ${u.activeRentals}, Завершенных: ${u.completedRentals}, Отмененных: ${u.cancelledRentals}`,
	)
	print(`     Потрачено: ${u.totalSpent} руб\n`)
})

// ============================================================================
// 3. ОТЧЕТ: Доход по автомобилям
// ============================================================================
print('=== 3. ДОХОД ПО АВТОМОБИЛЯМ ===\n')

const carRevenue = db.rentals
	.aggregate([
		{
			$match: { status: 'completed' }, // Только завершенные аренды
		},
		{
			$lookup: {
				from: 'cars',
				localField: 'car_id',
				foreignField: '_id',
				as: 'car',
			},
		},
		{
			$unwind: '$car',
		},
		{
			$group: {
				_id: {
					carId: '$car_id',
					brand: '$car.brand',
					model: '$car.model',
					car_class: '$car.car_class',
				},
				rentalCount: { $sum: 1 },
				totalRevenue: { $sum: '$total_cost' },
				avgRentalCost: { $avg: '$total_cost' },
				totalDays: {
					$sum: {
						$divide: [
							{ $subtract: ['$end_date', '$start_date'] },
							1000 * 60 * 60 * 24, // Перевод мс в дни
						],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				car: { $concat: ['$_id.brand', ' ', '$_id.model'] },
				car_class: '$_id.car_class',
				rentalCount: 1,
				totalRevenue: { $round: ['$totalRevenue', 2] },
				avgRentalCost: { $round: ['$avgRentalCost', 2] },
				totalDays: { $round: ['$totalDays', 1] },
				revenuePerDay: {
					$round: [
						{
							$cond: [
								{ $gt: ['$totalDays', 0] },
								{ $divide: ['$totalRevenue', '$totalDays'] },
								0,
							],
						},
						2,
					],
				},
			},
		},
		{
			$sort: { totalRevenue: -1 },
		},
		{
			$limit: 10,
		},
	])
	.toArray()

print('Топ-10 автомобилей по доходу (завершенные аренды):\n')
carRevenue.forEach((c, i) => {
	print(`  ${i + 1}. ${c.car} (${c.car_class})`)
	print(`     Аренд: ${c.rentalCount}, Дней всего: ${c.totalDays}`)
	print(`     Доход: ${c.totalRevenue} руб`)
	print(`     Средний чек: ${c.avgRentalCost} руб`)
	print(`     Доход в день: ${c.revenuePerDay} руб\n`)
})

// ============================================================================
// 4. ОТЧЕТ: Статусы аренд по месяцам
// ============================================================================
print('=== 4. СТАТУСЫ АРЕНД ПО МЕСЯЦАМ ===\n')

const monthlyStats = db.rentals
	.aggregate([
		{
			$group: {
				_id: {
					year: { $year: '$created_at' },
					month: { $month: '$created_at' },
					status: '$status',
				},
				count: { $sum: 1 },
			},
		},
		{
			$group: {
				_id: {
					year: '$_id.year',
					month: '$_id.month',
				},
				statuses: {
					$push: {
						status: '$_id.status',
						count: '$count',
					},
				},
				total: { $sum: '$count' },
			},
		},
		{
			$project: {
				_id: 0,
				year: '$_id.year',
				month: '$_id.month',
				total: 1,
				statuses: 1,
			},
		},
		{
			$sort: { year: 1, month: 1 },
		},
	])
	.toArray()

print('Аренды по месяцам:\n')
monthlyStats.forEach((m) => {
	const monthName = new Date(m.year, m.month - 1).toLocaleDateString('ru-RU', {
		month: 'long',
		year: 'numeric',
	})
	print(`  ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}:`)
	m.statuses.forEach((s) => {
		print(`    ${s.status}: ${s.count}`)
	})
	print(`    Итого: ${m.total}\n`)
})

// ============================================================================
// 5. ОТЧЕТ: Коэффициент использования автопарка
// ============================================================================
print('=== 5. КОЭФФИЦИЕНТ ИСПОЛЬЗОВАНИЯ АВТОПАРКА ===\n')

const utilizationStats = db.cars
	.aggregate([
		{
			$lookup: {
				from: 'rentals',
				localField: '_id',
				foreignField: 'car_id',
				as: 'rentals',
			},
		},
		{
			$project: {
				_id: 1,
				brand: 1,
				model: 1,
				car_class: 1,
				available: 1,
				rentalCount: { $size: '$rentals' },
				activeRentals: {
					$size: {
						$filter: {
							input: '$rentals',
							as: 'r',
							cond: { $eq: ['$$r.status', 'active'] },
						},
					},
				},
				totalRevenue: { $sum: '$rentals.total_cost' },
			},
		},
		{
			$group: {
				_id: '$car_class',
				totalCars: { $sum: 1 },
				availableCars: {
					$sum: { $cond: ['$available', 1, 0] },
				},
				activeRentals: { $sum: '$activeRentals' },
				totalRevenue: { $sum: '$totalRevenue' },
				avgRevenuePerCar: { $avg: '$totalRevenue' },
			},
		},
		{
			$project: {
				_id: 0,
				car_class: '$_id',
				totalCars: 1,
				availableCars: 1,
				utilizationRate: {
					$round: [
						{ $multiply: [{ $divide: ['$activeRentals', '$totalCars'] }, 100] },
						1,
					],
				},
				totalRevenue: { $round: ['$totalRevenue', 2] },
				avgRevenuePerCar: { $round: ['$avgRevenuePerCar', 2] },
			},
		},
		{
			$sort: { utilizationRate: -1 },
		},
	])
	.toArray()

print('Использование автопарка по классам:\n')
utilizationStats.forEach((u) => {
	print(`  ${u.car_class.toUpperCase()}:`)
	print(`    Всего авто: ${u.totalCars}`)
	print(`    Доступно: ${u.availableCars}`)
	print(`    В аренде сейчас: ${u.utilizationRate}%`)
	print(`    Общий доход: ${u.totalRevenue} руб`)
	print(`    Средний доход на авто: ${u.avgRevenuePerCar} руб\n`)
})

// ============================================================================
// 6. ОТЧЕТ: Самые популярные автомобили
// ============================================================================
print('=== 6. САМЫЕ ПОПУЛЯРНЫЕ АВТОМОБИЛИ ===\n')

const popularCars = db.rentals
	.aggregate([
		{
			$group: {
				_id: '$car_id',
				rentalCount: { $sum: 1 },
				totalRevenue: { $sum: '$total_cost' },
				avgRating: { $avg: '$total_cost' },
			},
		},
		{
			$lookup: {
				from: 'cars',
				localField: '_id',
				foreignField: '_id',
				as: 'car',
			},
		},
		{
			$unwind: '$car',
		},
		{
			$project: {
				_id: 0,
				carId: '$_id',
				car: { $concat: ['$car.brand', ' ', '$car.model'] },
				car_class: '$car.car_class',
				year: '$car.year',
				rentalCount: 1,
				totalRevenue: { $round: ['$totalRevenue', 2] },
				avgRentalCost: { $round: ['$avgRating', 2] },
			},
		},
		{
			$sort: { rentalCount: -1 },
		},
		{
			$limit: 5,
		},
	])
	.toArray()

print('Топ-5 самых популярных автомобилей:\n')
popularCars.forEach((c, i) => {
	print(`  ${i + 1}. ${c.car} (${c.year}, ${c.car_class})`)
	print(`     Аренд всего: ${c.rentalCount}`)
	print(`     Доход: ${c.totalRevenue} руб`)
	print(`     Средняя аренда: ${c.avgRentalCost} руб\n`)
})

// ============================================================================
// 7. ОТЧЕТ: Анализ длительности аренд
// ============================================================================
print('=== 7. АНАЛИЗ ДЛИТЕЛЬНОСТИ АРЕНД ===\n')

const rentalDuration = db.rentals
	.aggregate([
		{
			$match: { status: { $in: ['completed', 'active'] } },
		},
		{
			$project: {
				_id: 1,
				status: 1,
				durationDays: {
					$divide: [
						{ $subtract: ['$end_date', '$start_date'] },
						1000 * 60 * 60 * 24,
					],
				},
				total_cost: 1,
				car_id: 1,
			},
		},
		{
			$lookup: {
				from: 'cars',
				localField: 'car_id',
				foreignField: '_id',
				as: 'car',
			},
		},
		{
			$unwind: '$car',
		},
		{
			$group: {
				_id: '$car.car_class',
				avgDuration: { $avg: '$durationDays' },
				minDuration: { $min: '$durationDays' },
				maxDuration: { $max: '$durationDays' },
				totalRentals: { $sum: 1 },
				avgCostPerDay: {
					$avg: { $divide: ['$total_cost', '$durationDays'] },
				},
			},
		},
		{
			$project: {
				_id: 0,
				car_class: '$_id',
				avgDuration: { $round: ['$avgDuration', 1] },
				minDuration: { $round: ['$minDuration', 1] },
				maxDuration: { $round: ['$maxDuration', 1] },
				totalRentals: 1,
				avgCostPerDay: { $round: ['$avgCostPerDay', 2] },
			},
		},
		{
			$sort: { avgDuration: -1 },
		},
	])
	.toArray()

print('Длительность аренд по классам автомобилей:\n')
rentalDuration.forEach((d) => {
	print(`  ${d.car_class.toUpperCase()}:`)
	print(`    Всего аренд: ${d.totalRentals}`)
	print(`    Средняя длительность: ${d.avgDuration} дн.`)
	print(`    Мин/Макс: ${d.minDuration} / ${d.maxDuration} дн.`)
	print(`    Средняя стоимость в день: ${d.avgCostPerDay} руб\n`)
})

// ============================================================================
// 8. ОТЧЕТ: Сводная статистика бизнеса
// ============================================================================
print('=== 8. СВОДНАЯ СТАТИСТИКА БИЗНЕСА ===\n')

const businessStats = db.rentals
	.aggregate([
		{
			$facet: {
				totalRentals: [{ $count: 'count' }],
				activeRentals: [{ $match: { status: 'active' } }, { $count: 'count' }],
				completedRentals: [
					{ $match: { status: 'completed' } },
					{ $count: 'count' },
				],
				cancelledRentals: [
					{ $match: { status: 'cancelled' } },
					{ $count: 'count' },
				],
				totalRevenue: [{ $group: { _id: null, sum: { $sum: '$total_cost' } } }],
				avgRentalCost: [
					{ $group: { _id: null, avg: { $avg: '$total_cost' } } },
				],
				uniqueCustomers: [{ $group: { _id: '$user_id' } }, { $count: 'count' }],
			},
		},
		{
			$project: {
				totalRentals: { $arrayElemAt: ['$totalRentals.count', 0] },
				activeRentals: { $arrayElemAt: ['$activeRentals.count', 0] },
				completedRentals: { $arrayElemAt: ['$completedRentals.count', 0] },
				cancelledRentals: { $arrayElemAt: ['$cancelledRentals.count', 0] },
				totalRevenue: { $arrayElemAt: ['$totalRevenue.sum', 0] },
				avgRentalCost: { $arrayElemAt: ['$avgRentalCost.avg', 0] },
				uniqueCustomers: { $arrayElemAt: ['$uniqueCustomers.count', 0] },
			},
		},
	])
	.toArray()

const stats = businessStats[0]
print('Общая статистика:')
print(`  Всего аренд: ${stats.totalRentals || 0}`)
print(`    Активных: ${stats.activeRentals || 0}`)
print(`    Завершенных: ${stats.completedRentals || 0}`)
print(`    Отмененных: ${stats.cancelledRentals || 0}`)
print(
	`  Общий доход: ${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : 0} руб`,
)
print(
	`  Средняя стоимость аренды: ${stats.avgRentalCost ? stats.avgRentalCost.toFixed(2) : 0} руб`,
)
print(`  Уникальных клиентов: ${stats.uniqueCustomers || 0}`)

const carCount = db.cars.countDocuments()
const userCount = db.users.countDocuments()
print(`  Всего автомобилей: ${carCount}`)
print(`  Всего пользователей: ${userCount}`)

print('\n=== AGGREGATION PIPELINES ЗАВЕРШЕНЫ ===')
