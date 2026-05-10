#pragma once

#include <string>
#include <chrono>
#include <optional>
#include <variant>
#include <domain/exceptions.hpp>
#include <boost/uuid/uuid.hpp>

namespace car_rental::domain {

enum class RentalStatus {
    active,
    completed,
    cancelled
};

class Rental {
public:
    static std::variant<exceptions::domain::ValidationError, Rental> Create(
        const boost::uuids::uuid& user_id,
        const boost::uuids::uuid& car_id,
        std::chrono::system_clock::time_point start_date,
        std::chrono::system_clock::time_point end_date
    ) {
        if (start_date >= end_date) {
            return exceptions::domain::ValidationError{
                "end_date",
                "End date must be after start date"
            };
        }
        
        if (user_id.is_nil()) {
            return exceptions::domain::ValidationError{
                "user_id",
                "User ID is required"
            };
        }
        
        if (car_id.is_nil()) {
            return exceptions::domain::ValidationError{
                "car_id",
                "Car ID is required"
            };
        }
        
        Rental rental;
        rental.user_id_ = user_id;
        rental.car_id_ = car_id;
        rental.start_date_ = start_date;
        rental.end_date_ = end_date;
        rental.total_cost_ = 0.0;
        rental.status_ = domain::RentalStatus::active;
        
        return rental;
    }

    static Rental FromDb(
        const boost::uuids::uuid& id,
        const boost::uuids::uuid& user_id,
        const boost::uuids::uuid& car_id,
        const std::chrono::system_clock::time_point& start_date,
        const std::chrono::system_clock::time_point& end_date,
        double total_cost,
        RentalStatus status,
        const std::chrono::system_clock::time_point& created_at
    ) {
        Rental rental;
        rental.id_ = id;
        rental.user_id_ = user_id;
        rental.car_id_ = car_id;
        rental.start_date_ = start_date;
        rental.end_date_ = end_date;
        rental.total_cost_ = total_cost;
        rental.status_ = status;
        rental.created_at_ = created_at;
        return rental;
    }

    const boost::uuids::uuid& GetId() const { return id_; }
    const boost::uuids::uuid& GetUserId() const { return user_id_; }
    const boost::uuids::uuid& GetCarId() const { return car_id_; }
    const std::chrono::system_clock::time_point& GetStartDate() const { return start_date_; }
    const std::chrono::system_clock::time_point& GetEndDate() const { return end_date_; }
    double GetTotalCost() const { return total_cost_; }
    RentalStatus GetStatus() const { return status_; }
    const std::chrono::system_clock::time_point& GetCreatedAt() const { return created_at_; }
    void SetStatus(RentalStatus status) { status_ = status; }
    void RecalculateCost(double new_cost) {
        if (new_cost >= 0) {
            total_cost_ = new_cost;
        }
    }

    static std::string RentalStatusToString(RentalStatus status) {
        switch (status) {
            case RentalStatus::active: return "active";
            case RentalStatus::completed: return "completed";
            case RentalStatus::cancelled: return "cancelled";
            default: return "unknown";
        }
    }

    static std::optional<RentalStatus> RentalStatusFromString(const std::string& str) {
        if (str == "active") return RentalStatus::active;
        if (str == "completed") return RentalStatus::completed;
        if (str == "cancelled") return RentalStatus::cancelled;
        return std::nullopt;
    }

    bool IsActive() const { return status_ == RentalStatus::active; }

private:
    boost::uuids::uuid id_;
    boost::uuids::uuid user_id_;
    boost::uuids::uuid car_id_;
    std::chrono::system_clock::time_point start_date_;
    std::chrono::system_clock::time_point end_date_;
    double total_cost_;
    RentalStatus status_;
    std::chrono::system_clock::time_point created_at_;
};

} // namespace car_rental::domain