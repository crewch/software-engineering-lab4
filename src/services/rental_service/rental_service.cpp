#include "rental_service.hpp"

#include <chrono>
#include <cmath>

namespace car_rental::services {

RentalService::RentalService(storage::MongoStorage& storage)
    : storage_(storage) {}

namespace {

constexpr int kHoursPerDay = 24;

int CalculateDays(
    std::chrono::system_clock::time_point start_date,
    std::chrono::system_clock::time_point end_date
) {
    const auto duration = std::chrono::duration_cast<std::chrono::hours>(
        end_date - start_date
    ).count();
    
    return (duration + kHoursPerDay - 1) / kHoursPerDay;
}

double CalculateTotalCost(double daily_rate, int days) {
    return daily_rate * static_cast<double>(days);
}

} // anonymous namespace

RentalResult RentalService::CreateRental(
    const lab2::rental::CreateRentalRequest& dto,
    const std::string& user_id
) {
    auto rental_result = domain::Rental::Create(
        user_id,
        dto.car_id,
        dto.start_date,
        dto.end_date
    );

    if (std::holds_alternative<exceptions::domain::ValidationError>(rental_result)) {
        const auto& error = std::get<exceptions::domain::ValidationError>(rental_result);

        return {
            RentalErrorCode::VALIDATION_ERROR,
            error.message,
            std::nullopt
        };
    }

    auto& rental = std::get<domain::Rental>(rental_result);

    if (!storage_.UserExists(user_id)) {
        return {
            RentalErrorCode::NOT_FOUND,
            "User not found",
            std::nullopt
        };
    }

    auto car = storage_.GetCarById(dto.car_id);
    if (!car.has_value()) {
        return {
            RentalErrorCode::NOT_FOUND,
            "Car not found",
            std::nullopt
        };
    }

    if (!storage_.IsCarAvailable(dto.car_id, rental.GetStartDate(), rental.GetEndDate())) {
        return {
            RentalErrorCode::CAR_NOT_AVAILABLE,
            "Car is not available for selected period",
            std::nullopt
        };
    }

    const int days = CalculateDays(rental.GetStartDate(), rental.GetEndDate());
    const double total_cost = CalculateTotalCost(car->GetDailyRate(), days);
    rental.RecalculateCost(total_cost);

    auto created_rental = storage_.CreateRental(rental);

    if (!created_rental.has_value()) {
        return {
            RentalErrorCode::CONFLICT,
            "Failed to create rental",
            std::nullopt
        };
    }

    storage_.UpdateCarAvailability(dto.car_id, false);

    return {RentalErrorCode::OK, "", std::move(created_rental)};
}

RentalResult RentalService::GetRentalById(const std::string& id) {
    auto rental = storage_.GetRentalById(id);
    
    if (!rental.has_value()) {
        return {
            RentalErrorCode::NOT_FOUND,
            "Rental not found",
            std::nullopt
        };
    }
    
    return {RentalErrorCode::OK, "", std::move(rental)};
}

RentalListResult RentalService::GetActiveRentalsByUserId(const std::string& user_id) {
    if (!storage_.UserExists(user_id)) {
        return {
            RentalErrorCode::NOT_FOUND,
            "User not found",
            {},
            0
        };
    }
    
    auto rentals = storage_.GetActiveRentalsByUserId(user_id);
    return {
        RentalErrorCode::OK,
        "",
        std::move(rentals),
        static_cast<int>(rentals.size())
    };
}

RentalListResult RentalService::GetRentalHistoryByUserId(const std::string& user_id) {
    if (!storage_.UserExists(user_id)) {
        return {
            RentalErrorCode::NOT_FOUND,
            "User not found",
            {},
            0
        };
    }
    
    auto rentals = storage_.GetRentalHistoryByUserId(user_id);
    return {
        RentalErrorCode::OK,
        "",
        std::move(rentals),
        static_cast<int>(rentals.size())
    };
}

RentalResult RentalService::CompleteRental(const std::string& id) {
    auto rental = storage_.GetRentalById(id);
    if (!rental.has_value()) {
        return {
            RentalErrorCode::NOT_FOUND,
            "Rental not found",
            std::nullopt
        };
    }
    
    if (rental->GetStatus() != domain::RentalStatus::active) {
        return {
            RentalErrorCode::CONFLICT,
            "Rental is already completed or cancelled",
            std::nullopt
        };
    }
    
    if (!storage_.CompleteRental(id)) {
        return {
            RentalErrorCode::CONFLICT,
            "Failed to complete rental",
            std::nullopt
        };
    }
    
    storage_.UpdateCarAvailability(rental->GetCarId(), true);
    
    rental->SetStatus(domain::RentalStatus::completed); 
    
    return {RentalErrorCode::OK, "", std::move(rental)};
}

} // namespace car_rental::services