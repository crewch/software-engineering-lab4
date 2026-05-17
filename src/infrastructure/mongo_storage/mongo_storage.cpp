#include "infrastructure/mongo_storage/mongo_storage.hpp"
#include "infrastructure/mongo_storage/mongo_instance.hpp"

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/kvp.hpp>
#include <bsoncxx/builder/basic/array.hpp>
#include <bsoncxx/types.hpp>
#include <mongocxx/options/find_one_and_update.hpp>
#include <mongocxx/options/update.hpp>
#include <mongocxx/options/find.hpp>

#include <userver/logging/log.hpp>

namespace car_rental::storage {

namespace {

using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::basic::make_document;
using bsoncxx::builder::basic::make_array;

mongocxx::client CreateClient(const std::string& uri) {
    (void)infrastructure::GetMongoInstance();
    return mongocxx::client{mongocxx::uri{uri}};
}

}  // namespace

MongoStorage::MongoStorage(std::string mongo_uri)
    : client_(CreateClient(mongo_uri)) {
    mongocxx::uri uri(mongo_uri);
    const auto db_name = uri.database().empty() ? std::string{kDefaultDbName} : uri.database();
    db_ = client_[db_name];
}

std::optional<domain::User> MongoStorage::CreateUser(const domain::User& user) {
    auto users = db_[kUsersCollection.data()];

    bsoncxx::builder::basic::document doc_builder;
    doc_builder.append(
        kvp("login", user.GetLogin()),
        kvp("first_name", user.GetFirstName()),
        kvp("last_name", user.GetLastName()),
        kvp("email", user.GetEmail()),
        kvp("password", user.GetPassword()),
        kvp("created_at", bsoncxx::types::b_date{std::chrono::system_clock::now()})
    );
    
    if (user.GetPhone().has_value() && !user.GetPhone().value().empty()) {
        doc_builder.append(kvp("phone", user.GetPhone().value()));
    } else {
        doc_builder.append(kvp("phone", bsoncxx::types::b_null{}));
    }

    auto doc = doc_builder.extract();

    try {
        auto insert_result = users.insert_one(doc.view());
        
        auto inserted_id = insert_result->inserted_id().get_oid().value;
        auto result = users.find_one(make_document(kvp("_id", inserted_id)));
        
        if (result) {
            return DocumentToUser_(result->view());
        }

        return std::nullopt;
    } catch (const std::exception& e) {
        std::string error_msg = e.what();
        if (error_msg.find("E11000") != std::string::npos) {
            LOG_WARNING() << "MongoDB conflict: user already exists (login="
                          << user.GetLogin() << ", email=" << user.GetEmail() << ")";
            return std::nullopt;
        }
        LOG_ERROR() << "MongoDB error: " << error_msg;
        throw;
    }
}

std::optional<domain::User> MongoStorage::GetUserByLogin(const std::string& login) const {
    auto users = db_[kUsersCollection.data()];

    try {
        auto result = users.find_one(make_document(kvp("login", login)));

        if (!result) return std::nullopt;
        return DocumentToUser_(result->view());
    } catch (const std::exception& e) {
        LOG_ERROR() << "Error getting user by login '" << login << "': " << e.what();
        throw;
    }
}

std::optional<domain::User> MongoStorage::GetUserById(const std::string& id) const {
    auto users = db_[kUsersCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid user ID format: " << id;
        return std::nullopt;
    }
    
    auto result = users.find_one(make_document(kvp("_id", oid)));

    if (!result) return std::nullopt;
    return DocumentToUser_(result->view());
}

std::vector<domain::User> MongoStorage::SearchUsers(const std::string& name_mask) const {
    auto users = db_[kUsersCollection.data()];

    auto filter = make_document(
        kvp("$or", make_array(
            make_document(
                kvp("first_name", make_document(
                    kvp("$regex", "^" + name_mask),
                    kvp("$options", "i")))),
            make_document(
                kvp("last_name", make_document(
                    kvp("$regex", "^" + name_mask),
                    kvp("$options", "i"))))
        ))
    );

    std::vector<domain::User> result;
    for (auto&& doc : users.find(filter.view())) {
        result.push_back(DocumentToUser_(doc));
    }
    return result;
}

bool MongoStorage::UserExists(const std::string& id) const {
    auto users = db_[kUsersCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid user ID format: " << id;
        return false;
    }
    
    auto result = users.find_one(make_document(kvp("_id", oid)));
    return result.has_value();
}

std::optional<domain::Car> MongoStorage::CreateCar(const domain::Car& car) {
    auto cars = db_[kCarsCollection.data()];

    auto doc = make_document(
        kvp("vin", car.GetVin()),
        kvp("brand", car.GetBrand()),
        kvp("model", car.GetModel()),
        kvp("year", static_cast<int32_t>(car.GetYear())),
        kvp("car_class", domain::Car::CarClassToString(car.GetCarClass())),
        kvp("license_plate", car.GetLicensePlate()),
        kvp("daily_rate", car.GetDailyRate()),
        kvp("available", car.IsAvailable()),
        kvp("created_at", bsoncxx::types::b_date{std::chrono::system_clock::now()})
    );

    try {
        auto insert_result = cars.insert_one(doc.view());
        
        auto inserted_id = insert_result->inserted_id().get_oid().value;
        auto result = cars.find_one(make_document(kvp("_id", inserted_id)));
        
        if (result) {
            return DocumentToCar_(result->view());
        }

        return std::nullopt;
    } catch (...) {
        return std::nullopt;
    }
}

Page<domain::Car> MongoStorage::GetCars(
    std::optional<domain::CarClass> car_class,
    std::optional<bool> available_only,
    int limit,
    int offset
) const {
    Page<domain::Car> result;
    auto cars = db_[kCarsCollection.data()];

    bsoncxx::builder::basic::document filter;
    if (car_class) {
        filter.append(kvp("car_class", domain::Car::CarClassToString(*car_class)));
    }
    if (available_only) {
        filter.append(kvp("available", *available_only));
    }

    mongocxx::options::find opts;
    opts.limit(limit);
    opts.skip(offset);
    opts.sort(make_document(kvp("created_at", -1)));

    auto cursor = cars.find(filter.view(), opts);
    for (auto&& doc : cursor) {
        result.items.push_back(DocumentToCar_(doc));
    }

    result.total = static_cast<int>(cars.count_documents(filter.view()));
    return result;
}

std::optional<domain::Car> MongoStorage::GetCarById(const std::string& id) const {
    auto cars = db_[kCarsCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid car ID format: " << id;
        return std::nullopt;
    }
    
    auto result = cars.find_one(make_document(kvp("_id", oid)));

    if (!result) return std::nullopt;
    return DocumentToCar_(result->view());
}

std::optional<domain::Car> MongoStorage::GetCarByVin(const std::string& vin) const {
    auto cars = db_[kCarsCollection.data()];
    auto result = cars.find_one(make_document(kvp("vin", vin)));

    if (!result) return std::nullopt;
    return DocumentToCar_(result->view());
}

bool MongoStorage::UpdateCarAvailability(const std::string& id, bool available) {
    auto cars = db_[kCarsCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid car ID format: " << id;
        return false;
    }
    
    auto result = cars.update_one(
        make_document(kvp("_id", oid)),
        make_document(kvp("$set", make_document(kvp("available", bsoncxx::types::b_bool{available}))))
    );
    return result && result->modified_count() > 0;
}

bool MongoStorage::CarExists(const std::string& id) const {
    auto cars = db_[kCarsCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid car ID format: " << id;
        return false;
    }
    
    auto result = cars.find_one(make_document(kvp("_id", oid)));
    return result.has_value();
}

std::optional<domain::Rental> MongoStorage::CreateRental(const domain::Rental& rental) {
    auto rentals = db_[kRentalsCollection.data()];

    bsoncxx::oid user_oid;
    bsoncxx::oid car_oid;
    try {
        user_oid = bsoncxx::oid{rental.GetUserId()};
        car_oid = bsoncxx::oid{rental.GetCarId()};
    } catch (...) {
        LOG_ERROR() << "Invalid user_id or car_id format";
        return std::nullopt;
    }

    auto doc = make_document(
        kvp("user_id", user_oid),
        kvp("car_id", car_oid),
        kvp("start_date", bsoncxx::types::b_date{rental.GetStartDate()}),
        kvp("end_date", bsoncxx::types::b_date{rental.GetEndDate()}),
        kvp("total_cost", rental.GetTotalCost()),
        kvp("status", domain::Rental::RentalStatusToString(rental.GetStatus())),
        kvp("created_at", bsoncxx::types::b_date{std::chrono::system_clock::now()})
    );

    try {
        auto insert_result = rentals.insert_one(doc.view());

        auto inserted_id = insert_result->inserted_id().get_oid().value;
        auto result = rentals.find_one(make_document(kvp("_id", inserted_id)));

        if (result) {
            return DocumentToRental_(result->view());
        }

        return std::nullopt;
    } catch (...) {
        return std::nullopt;
    }
}

std::optional<domain::Rental> MongoStorage::GetRentalById(const std::string& id) const {
    auto rentals = db_[kRentalsCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid rental ID format: " << id;
        return std::nullopt;
    }
    
    auto result = rentals.find_one(make_document(kvp("_id", oid)));

    if (!result) return std::nullopt;
    return DocumentToRental_(result->view());
}

std::vector<domain::Rental> MongoStorage::GetActiveRentalsByUserId(const std::string& user_id) const {
    auto rentals = db_[kRentalsCollection.data()];
    
    bsoncxx::oid uid;
    try {
        uid = bsoncxx::oid{user_id};
    } catch (...) {
        LOG_ERROR() << "Invalid user ID format: " << user_id;
        return {};
    }
    
    auto filter = make_document(
        kvp("user_id", uid),
        kvp("status", "active")
    );

    std::vector<domain::Rental> result;
    for (auto&& doc : rentals.find(filter.view())) {
        result.push_back(DocumentToRental_(doc));
    }
    return result;
}

std::vector<domain::Rental> MongoStorage::GetRentalHistoryByUserId(const std::string& user_id) const {
    auto rentals = db_[kRentalsCollection.data()];
    
    bsoncxx::oid uid;
    try {
        uid = bsoncxx::oid{user_id};
    } catch (...) {
        LOG_ERROR() << "Invalid user ID format: " << user_id;
        return {};
    }
    
    auto filter = make_document(
        kvp("user_id", uid),
        kvp("status", make_document(kvp("$in", make_array("completed", "cancelled"))))
    );

    std::vector<domain::Rental> result;
    for (auto&& doc : rentals.find(filter.view())) {
        result.push_back(DocumentToRental_(doc));
    }
    return result;
}

std::vector<domain::Rental> MongoStorage::GetAllRentalsByUserId(const std::string& user_id) const {
    auto rentals = db_[kRentalsCollection.data()];
    
    bsoncxx::oid uid;
    try {
        uid = bsoncxx::oid{user_id};
    } catch (...) {
        LOG_ERROR() << "Invalid user ID format: " << user_id;
        return {};
    }
    
    auto filter = make_document(kvp("user_id", uid));

    std::vector<domain::Rental> result;
    for (auto&& doc : rentals.find(filter.view())) {
        result.push_back(DocumentToRental_(doc));
    }
    return result;
}

bool MongoStorage::CompleteRental(const std::string& id) {
    auto rentals = db_[kRentalsCollection.data()];
    
    bsoncxx::oid oid;
    try {
        oid = bsoncxx::oid{id};
    } catch (...) {
        LOG_ERROR() << "Invalid rental ID format: " << id;
        return false;
    }
    
    auto result = rentals.update_one(
        make_document(
            kvp("_id", oid),
            kvp("status", "active")
        ),
        make_document(kvp("$set", make_document(kvp("status", "completed"))))
    );
    return result && result->modified_count() > 0;
}

bool MongoStorage::IsCarAvailable(
    const std::string& car_id,
    const std::chrono::system_clock::time_point& start,
    const std::chrono::system_clock::time_point& end
) const {
    auto rentals = db_[kRentalsCollection.data()];
    
    bsoncxx::oid cid;
    try {
        cid = bsoncxx::oid{car_id};
    } catch (...) {
        LOG_ERROR() << "Invalid car ID format: " << car_id;
        return false;
    }

    auto filter = make_document(
        kvp("car_id", cid),
        kvp("status", "active"),
        kvp("$or", make_array(
            make_document(
                kvp("start_date", make_document(kvp("$lt", bsoncxx::types::b_date{end}))),
                kvp("end_date", make_document(kvp("$gt", bsoncxx::types::b_date{start}))))
        ))
    );

    return rentals.count_documents(filter.view()) == 0;
}

MongoStorage::Stats MongoStorage::GetStats() const {
    auto users = db_[kUsersCollection.data()];
    auto cars = db_[kCarsCollection.data()];
    auto rentals = db_[kRentalsCollection.data()];

    return Stats{
        static_cast<size_t>(users.count_documents({})),
        static_cast<size_t>(cars.count_documents({})),
        static_cast<size_t>(rentals.count_documents({}))
    };
}

domain::User MongoStorage::DocumentToUser_(const bsoncxx::document::view& doc) const {
    std::string id_str;
    auto id_field = doc["_id"];
    auto id_type = id_field.type();

    if (id_type == bsoncxx::type::k_string) {
        id_str = std::string(id_field.get_string().value);
    } else if (id_type == bsoncxx::type::k_oid) {
        id_str = std::string(id_field.get_oid().value.to_string());
    } else {
        throw std::runtime_error("Unexpected _id type in user document");
    }

    auto login_view = doc["login"].get_string().value;
    std::string login(login_view.data(), login_view.length());
    auto first_name_view = doc["first_name"].get_string().value;
    std::string first_name(first_name_view.data(), first_name_view.length());
    auto last_name_view = doc["last_name"].get_string().value;
    std::string last_name(last_name_view.data(), last_name_view.length());
    auto email_view = doc["email"].get_string().value;
    std::string email(email_view.data(), email_view.length());
    auto password_view = doc["password"].get_string().value;
    std::string password(password_view.data(), password_view.length());

    std::optional<std::string> phone;
    auto phone_field = doc["phone"];
    if (phone_field && phone_field.type() == bsoncxx::type::k_string) {
        auto phone_view = phone_field.get_string().value;
        phone = std::string(phone_view.data(), phone_view.length());
    }

    auto created_at_ms = doc["created_at"].get_date().value;
    std::chrono::system_clock::time_point created_at{
        std::chrono::duration_cast<std::chrono::system_clock::duration>(created_at_ms)
    };

    return domain::User::FromDb(
        id_str, login, first_name, last_name, email, password, phone, created_at
    );
}

domain::Car MongoStorage::DocumentToCar_(const bsoncxx::document::view& doc) const {
    std::string id_str;
    auto id_field = doc["_id"];
    auto id_type = id_field.type();

    if (id_type == bsoncxx::type::k_string) {
        id_str = std::string(id_field.get_string().value);
    } else if (id_type == bsoncxx::type::k_oid) {
        id_str = std::string(id_field.get_oid().value.to_string());
    } else {
        throw std::runtime_error("Unexpected _id type in car document");
    }

    auto vin_view = doc["vin"].get_string().value;
    std::string vin(vin_view.data(), vin_view.length());
    auto brand_view = doc["brand"].get_string().value;
    std::string brand(brand_view.data(), brand_view.length());
    auto model_view = doc["model"].get_string().value;
    std::string model(model_view.data(), model_view.length());
    int year = doc["year"].get_int32().value;
    auto car_class_view = doc["car_class"].get_string().value;
    std::string car_class_str(car_class_view.data(), car_class_view.length());
    auto car_class = domain::Car::CarClassFromString(car_class_str);
    auto license_plate_view = doc["license_plate"].get_string().value;
    std::string license_plate(license_plate_view.data(), license_plate_view.length());
    
    double daily_rate;
    auto daily_rate_field = doc["daily_rate"];
    if (daily_rate_field.type() == bsoncxx::type::k_double) {
        daily_rate = daily_rate_field.get_double().value;
    } else if (daily_rate_field.type() == bsoncxx::type::k_int32) {
        daily_rate = static_cast<double>(daily_rate_field.get_int32().value);
    } else if (daily_rate_field.type() == bsoncxx::type::k_int64) {
        daily_rate = static_cast<double>(daily_rate_field.get_int64().value);
    } else {
        throw std::runtime_error("Unexpected daily_rate type in car document");
    }
    
    bool available = doc["available"].get_bool().value;
    auto created_at_ms = doc["created_at"].get_date().value;
    std::chrono::system_clock::time_point created_at{
        std::chrono::duration_cast<std::chrono::system_clock::duration>(created_at_ms)
    };

    return domain::Car::FromDb(
        id_str, vin, brand, model, year, car_class, license_plate, daily_rate, available, created_at
    );
}

domain::Rental MongoStorage::DocumentToRental_(const bsoncxx::document::view& doc) const {
    std::string id_str;
    auto id_field = doc["_id"];
    auto id_type = id_field.type();

    if (id_type == bsoncxx::type::k_string) {
        id_str = std::string(id_field.get_string().value);
    } else if (id_type == bsoncxx::type::k_oid) {
        id_str = std::string(id_field.get_oid().value.to_string());
    } else {
        throw std::runtime_error("Unexpected _id type in rental document");
    }

    std::string user_id_str;
    auto user_id_field = doc["user_id"];
    auto user_id_type = user_id_field.type();
    if (user_id_type == bsoncxx::type::k_string) {
        user_id_str = std::string(user_id_field.get_string().value);
    } else if (user_id_type == bsoncxx::type::k_oid) {
        user_id_str = std::string(user_id_field.get_oid().value.to_string());
    } else {
        throw std::runtime_error("Unexpected user_id type in rental document");
    }

    std::string car_id_str;
    auto car_id_field = doc["car_id"];
    auto car_id_type = car_id_field.type();
    if (car_id_type == bsoncxx::type::k_string) {
        car_id_str = std::string(car_id_field.get_string().value);
    } else if (car_id_type == bsoncxx::type::k_oid) {
        car_id_str = std::string(car_id_field.get_oid().value.to_string());
    } else {
        throw std::runtime_error("Unexpected car_id type in rental document");
    }

    auto start_date_ms = doc["start_date"].get_date().value;
    std::chrono::system_clock::time_point start_date{
        std::chrono::duration_cast<std::chrono::system_clock::duration>(start_date_ms)
    };
    auto end_date_ms = doc["end_date"].get_date().value;
    std::chrono::system_clock::time_point end_date{
        std::chrono::duration_cast<std::chrono::system_clock::duration>(end_date_ms)
    };
    
    double total_cost;
    auto total_cost_field = doc["total_cost"];
    if (total_cost_field.type() == bsoncxx::type::k_double) {
        total_cost = total_cost_field.get_double().value;
    } else if (total_cost_field.type() == bsoncxx::type::k_int32) {
        total_cost = static_cast<double>(total_cost_field.get_int32().value);
    } else if (total_cost_field.type() == bsoncxx::type::k_int64) {
        total_cost = static_cast<double>(total_cost_field.get_int64().value);
    } else {
        throw std::runtime_error("Unexpected total_cost type in rental document");
    }
    
    auto status_view = doc["status"].get_string().value;
    std::string status_str(status_view.data(), status_view.length());
    auto status = domain::Rental::RentalStatusFromString(status_str).value();
    auto created_at_ms = doc["created_at"].get_date().value;
    std::chrono::system_clock::time_point created_at{
        std::chrono::duration_cast<std::chrono::system_clock::duration>(created_at_ms)
    };

    return domain::Rental::FromDb(
        id_str, user_id_str, car_id_str,
        start_date, end_date, total_cost, status, created_at
    );
}

}  // namespace car_rental::storage
