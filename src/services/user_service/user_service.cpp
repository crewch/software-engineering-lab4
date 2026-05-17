#include "user_service.hpp"

#include <algorithm>

namespace car_rental::services {

UserService::UserService(storage::MongoStorage& storage)
    : storage_(storage) {}

UserResult UserService::CreateUser(
    const lab2::user::CreateUserRequest& dto
) {
    auto user_result = domain::User::Create(
        dto.login,
        dto.first_name,
        dto.last_name,
        dto.email,
        dto.password,
        dto.phone
    );

    if (std::holds_alternative<exceptions::domain::ValidationError>(user_result)) {
        const auto& error = std::get<exceptions::domain::ValidationError>(user_result);

        return {
            UserErrorCode::VALIDATION_ERROR,
            error.message,
            std::nullopt
        };
    }

    const auto& user = std::get<domain::User>(user_result);
    
    auto created_user = storage_.CreateUser(user);

     if (!created_user.has_value()) {
        return {
            UserErrorCode::CONFLICT,
            "User with this login or email already exists",
            std::nullopt
        };
    }
    
    return {UserErrorCode::OK, "", std::move(created_user.value())};
}

UserResult UserService::GetUserByLogin(const std::string& login) {
    auto user = storage_.GetUserByLogin(login);
    
    if (!user.has_value()) {
        return {
            UserErrorCode::NOT_FOUND,
            "User not found",
            std::nullopt
        };
    }
    
    return {UserErrorCode::OK, "", std::move(user)};
}

UserListResult UserService::SearchUsers(
    const std::string& name_mask,
    int limit,
    int offset
) {
    auto users = storage_.SearchUsers(name_mask);
    
    const int total = static_cast<int>(users.size());
    
    if (offset >= total) {
        return {UserErrorCode::OK, "", {}, total};
    }
    
    const int end = std::min(offset + limit, total);
    std::vector<domain::User> paginated(users.begin() + offset, users.begin() + end);
    
    return {UserErrorCode::OK, "", std::move(paginated), total};
}

AuthResult UserService::Login(
    const lab2::auth::LoginRequest& dto,
    const std::shared_ptr<lab2::infrastructure::JwtTokenGenerator> jwt_token_generator
) {
    auto user = storage_.GetUserByLogin(dto.login);

    if (!user.has_value()) {
        return {
            AuthErrorCode::NOT_FOUND,
            "User not found",
            std::nullopt
        };
    }

    auto hasher = lab2::infrastructure::PasswordHasher();

    if (!hasher.Verify(dto.password, user->GetPassword())) {
        return  {
            AuthErrorCode::INVALID_CREDENTIALS,
            "Invalid credentials",
            std::nullopt
        };
    }

    std::string token = jwt_token_generator->Generate(user->GetId());

    return  {
        AuthErrorCode::OK,
        "",
        token
    };
}

} // namespace car_rental::services