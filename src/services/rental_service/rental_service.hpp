#pragma once

#include <optional>
#include <string>
#include <domain/rental.hpp>
#include <docs/definitions/rental.hpp>
#include <infrastructure/mongo_storage/mongo_storage.hpp>

namespace car_rental::services {

enum class RentalErrorCode {
    OK,
    VALIDATION_ERROR,
    NOT_FOUND,
    CONFLICT,
    CAR_NOT_AVAILABLE,
    INTERNAL_ERROR
};

struct RentalResult {
    RentalErrorCode code;
    std::string message;
    std::optional<domain::Rental> rental;
};

struct RentalListResult {
    RentalErrorCode code;
    std::string message;
    std::vector<domain::Rental> rentals;
    int total;
};

class RentalService {
public:
    explicit RentalService(storage::MongoStorage& storage);

    RentalResult CreateRental(
        const lab2::rental::CreateRentalRequest& dto,
        const std::string& user_id
    );

    RentalResult GetRentalById(const std::string& id);

    RentalListResult GetActiveRentalsByUserId(const std::string& user_id);

    RentalListResult GetRentalHistoryByUserId(const std::string& user_id);

    RentalResult CompleteRental(const std::string& id);

private:
    storage::MongoStorage& storage_;
};

} // namespace car_rental::services