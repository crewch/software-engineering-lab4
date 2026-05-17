#pragma once

#include <chrono>
#include <cstdint>
#include <string>
#include <optional>
#include <vector>

#include <bsoncxx/document/view.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/database.hpp>
#include <mongocxx/uri.hpp>

#include <domain/user.hpp>
#include <domain/car.hpp>
#include <domain/rental.hpp>

namespace car_rental::storage {

template <typename T>
struct Page {
    std::vector<T> items;
    int total = 0;
};

class MongoStorage final {
public:
    explicit MongoStorage(std::string mongo_uri);

    std::optional<domain::User> CreateUser(const domain::User& user);
    std::optional<domain::User> GetUserByLogin(const std::string& login) const;
    std::optional<domain::User> GetUserById(const std::string& id) const;
    std::vector<domain::User> SearchUsers(const std::string& name_mask) const;
    bool UserExists(const std::string& id) const;

    std::optional<domain::Car> CreateCar(const domain::Car& car);
    Page<domain::Car> GetCars(
        std::optional<domain::CarClass> car_class,
        std::optional<bool> available_only,
        int limit,
        int offset
    ) const;
    std::optional<domain::Car> GetCarById(const std::string& id) const;
    std::optional<domain::Car> GetCarByVin(const std::string& vin) const;
    bool UpdateCarAvailability(const std::string& id, bool available);
    bool CarExists(const std::string& id) const;

    std::optional<domain::Rental> CreateRental(const domain::Rental& rental);
    std::optional<domain::Rental> GetRentalById(const std::string& id) const;
    std::vector<domain::Rental> GetActiveRentalsByUserId(const std::string& user_id) const;
    std::vector<domain::Rental> GetRentalHistoryByUserId(const std::string& user_id) const;
    std::vector<domain::Rental> GetAllRentalsByUserId(const std::string& user_id) const;
    bool CompleteRental(const std::string& id);

    bool IsCarAvailable(
        const std::string& car_id,
        const std::chrono::system_clock::time_point& start,
        const std::chrono::system_clock::time_point& end
    ) const;

    struct Stats {
        size_t user_count;
        size_t car_count;
        size_t rental_count;
    };

    Stats GetStats() const;

private:
    static constexpr std::string_view kDefaultDbName = "car_rental";
    static constexpr std::string_view kUsersCollection = "users";
    static constexpr std::string_view kCarsCollection = "cars";
    static constexpr std::string_view kRentalsCollection = "rentals";

    mongocxx::client client_;
    mongocxx::database db_;

    domain::User DocumentToUser_(const bsoncxx::document::view& doc) const;
    domain::Car DocumentToCar_(const bsoncxx::document::view& doc) const;
    domain::Rental DocumentToRental_(const bsoncxx::document::view& doc) const;
};

}  // namespace car_rental::storage
