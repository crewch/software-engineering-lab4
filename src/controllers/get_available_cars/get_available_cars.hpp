#pragma once

#include <userver/server/handlers/http_handler_base.hpp>
#include <userver/components/component_context.hpp>
#include <userver/components/component_config.hpp>

#include <services/car_service/car_service.hpp>

namespace car_rental::components {

class GetAvailableCars final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "HandlerGetAvailableCars";
    
    GetAvailableCars(
        const userver::components::ComponentConfig& config,
        const userver::components::ComponentContext& context
    );
    
    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext& context
    ) const override;

private:
    storage::MongoStorage& storage_;
    mutable services::CarService car_service_;
};

} // namespace car_rental::components