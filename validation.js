// validation.js - Валидация схем MongoDB для системы аренды автомобилей
// Создание коллекций с валидацией схем и индексами
//
// НАЗНАЧЕНИЕ: Для ручного запуска через docker exec
// ЗАПУСК: docker exec -i car-rental-mongodb mongosh -u mongo -p mongo car_rental < validation.js
//
// Примечание: При автоматической инициализации этот скрипт вызывается из init-mongo.js

const db = db.getSiblingDB('car_rental')

print('Creating collections with schema validation...')

// Drop existing collections if they exist (for re-initialization)
try {
	db.users.drop()
} catch (e) {}
try {
	db.cars.drop()
} catch (e) {}
try {
	db.rentals.drop()
} catch (e) {}

// Users collection with validation
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

print('Created users collection with validation')

// Cars collection with validation
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

print('Created cars collection with validation')

// Rentals collection with validation
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

print('Created rentals collection with validation')

// Create indexes for performance
print('Creating indexes...')

// Users indexes
db.users.createIndex({ login: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })

// Cars indexes
db.cars.createIndex({ vin: 1 }, { unique: true })
db.cars.createIndex({ license_plate: 1 }, { unique: true })
db.cars.createIndex({ car_class: 1, available: 1 })
db.cars.createIndex({ available: 1 })

// Rentals indexes
db.rentals.createIndex({ user_id: 1, status: 1 })
db.rentals.createIndex({ car_id: 1, status: 1 })
db.rentals.createIndex({ user_id: 1 })
db.rentals.createIndex({ car_id: 1 })

print('Indexes created successfully')
print('Schema validation setup completed')
