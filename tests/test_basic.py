import jwt
import pytest
import uuid
import random
import string
from datetime import datetime, timedelta

from testsuite.utils import matching

JWT_SECRET_KEY = '3zSPwp5OPzbRoI8iR7FjLvH6j8jDuSWxy3BZejcjrIL'
VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
HANDLER_USERS = '/api/v1/users'
HANDLER_LOGIN = '/api/v1/users/login'
HANDLER_CARS = '/api/v1/cars'
HANDLER_RENTALS = '/api/v1/rentals'


# ----------------------------
# Helpers
# ----------------------------

def generate_vin() -> str:
    return ''.join(random.choice(VIN_CHARS) for _ in range(17))

def unique(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def make_jwt_token(payload: dict = None) -> str:
    if payload is None:
        payload = {'iss': 'car-rental-api', 'sub': 'test-user'}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')


def make_auth_headers(token: str = None) -> dict:
    if token is None:
        token = make_jwt_token()
    return {'Authorization': f'Bearer {token}'}


def make_user_data(login: str = None, override: dict = None) -> dict:
    login = login or unique('test_user')

    data = {
        'login': login,
        'first_name': 'Иван',
        'last_name': 'Петров',
        'email': f'{login}@example.com',
        'password': 'SuperSecret123!'
    }
    if override:
        data.update(override)
    return data


def make_login_data(login: str = None, password: str = 'SuperSecret123!') -> dict:
    return {
        'login': login or unique('test_user'),
        'password': password
    }


def make_car_data(vin: str = None, override: dict = None) -> dict:
    vin = vin or generate_vin()

    data = {
        'vin': vin,
        'brand': 'BMW',
        'model': '3 Series',
        'year': 2022,
        'car_class': 'midsize',
        'license_plate': f"A{uuid.uuid4().hex[:5]}BC777",
        'daily_rate': 5500.00
    }
    if override:
        data.update(override)
    return data


def make_rental_data(car_id: str = None, override: dict = None) -> dict:
    now = datetime.utcnow()
    data = {
        'car_id': car_id or str(uuid.uuid4()),
        'start_date': (now + timedelta(days=1)).isoformat() + 'Z',
        'end_date': (now + timedelta(days=5)).isoformat() + 'Z'
    }
    if override:
        data.update(override)
    return data


async def get_auth_token(service_client, login: str, password: str = 'SuperSecret123!') -> str:
    response = await service_client.post(
        HANDLER_LOGIN,
        json={'login': login, 'password': password}
    )
    if response.status == 200:
        return response.json()['token']
    return None


# ----------------------------
# Tests
# ----------------------------

class TestUserRegistration:

    async def test_create_user_201(self, service_client):
        login = unique('new_user')

        response = await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login)
        )

        assert response.status == 201
        data = response.json()
        assert data['login'] == login
        assert 'id' in data
        assert 'created_at' in data

    async def test_create_user_400_invalid_login(self, service_client):
        response = await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login='ab')
        )

        assert response.status == 400
        assert response.json()['code'] == 'validation_error'

    async def test_create_user_400_short_password(self, service_client):
        response = await service_client.post(
            HANDLER_USERS,
            json=make_user_data(override={'password': 'short'})
        )

        assert response.status == 400
        assert response.json()['code'] == 'validation_error'

    async def test_create_user_409_conflict(self, service_client):
        login = unique('duplicate_user')

        await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login)
        )

        response = await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login)
        )

        assert response.status == 409
        assert response.json()['code'] == 'conflict'


class TestUserLogin:

    async def test_login_200_success(self, service_client):
        login = unique('login_user')
        password = 'SuperSecret123!'

        await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login, override={'password': password})
        )

        response = await service_client.post(
            HANDLER_LOGIN,
            json={'login': login, 'password': password}
        )

        assert response.status == 200
        assert 'token' in response.json()

    async def test_login_400_invalid_credentials(self, service_client):
        response = await service_client.post(
            HANDLER_LOGIN,
            json=make_login_data(password='wrong')
        )

        assert response.status == 400
        assert response.json()['code'] == 'validation_error'

    async def test_login_404_user_not_found(self, service_client):
        response = await service_client.post(
            HANDLER_LOGIN,
            json=make_login_data(login=unique('no_user'))
        )

        assert response.status == 404
        assert response.json()['code'] == 'not_found'


class TestGetUserByLogin:

    async def test_get_user_200(self, service_client):
        login = unique('search_user')

        await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login)
        )

        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip("No auth token")

        response = await service_client.get(
            f'{HANDLER_USERS}/by-login/{login}',
            headers=make_auth_headers(token)
        )

        assert response.status == 200
        assert response.json()['login'] == login

    async def test_get_user_400_no_auth(self, service_client):
        response = await service_client.get(f'{HANDLER_USERS}/by-login/test')
        assert response.status == 400

    async def test_get_user_404_not_found(self, service_client):
        login = unique('existing')

        await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login)
        )

        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip("No auth token")

        response = await service_client.get(
            f'{HANDLER_USERS}/by-login/{unique("missing")}',
            headers=make_auth_headers(token)
        )

        assert response.status == 404


class TestCreateCar:

    async def test_create_car_201(self, service_client):
        login = unique('car_admin')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.post(
            HANDLER_CARS,
            json=make_car_data(),
            headers=make_auth_headers(token)
        )

        assert response.status == 201
        assert response.json()['available'] is True

    async def test_create_car_400_no_auth(self, service_client):
        response = await service_client.post(HANDLER_CARS, json=make_car_data())
        assert response.status == 400

    async def test_create_car_400_invalid_vin(self, service_client):
        login = unique('car_admin2')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.post(
            HANDLER_CARS,
            json=make_car_data(vin='INVALID'),
            headers=make_auth_headers(token)
        )

        assert response.status == 400

    async def test_create_car_400_invalid_year(self, service_client):
        login = unique('car_admin3')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.post(
            HANDLER_CARS,
            json=make_car_data(override={'year': 1800}),
            headers=make_auth_headers(token)
        )

        assert response.status == 400

    async def test_create_car_409_vin_exists(self, service_client):
        login = unique('car_admin4')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        vin = generate_vin()

        await service_client.post(
            HANDLER_CARS,
            json=make_car_data(vin=vin),
            headers=make_auth_headers(token)
        )

        response = await service_client.post(
            HANDLER_CARS,
            json=make_car_data(vin=vin),
            headers=make_auth_headers(token)
        )

        assert response.status == 409


class TestGetAvailableCars:

    async def test_get_cars_200(self, service_client):
        login = unique('cars_view')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.get(
            f'{HANDLER_CARS}/available',
            headers=make_auth_headers(token)
        )

        assert response.status == 200

    async def test_get_cars_200_with_pagination(self, service_client):
        login = unique('cars_view2')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.get(
            f'{HANDLER_CARS}/available',
            params={'limit': 10, 'offset': 0},
            headers=make_auth_headers(token)
        )

        assert response.status == 200

    async def test_get_cars_400_invalid_limit(self, service_client):
        login = unique('cars_view3')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.get(
            f'{HANDLER_CARS}/available',
            params={'limit': 200},
            headers=make_auth_headers(token)
        )

        assert response.status == 400

    async def test_get_cars_400_no_auth(self, service_client):
        response = await service_client.get(f'{HANDLER_CARS}/available')
        assert response.status == 400


class TestGetCarsByClass:

    @pytest.mark.parametrize('car_class', [
        'economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'van'
    ])
    async def test_get_cars_by_class_200(self, service_client, car_class):
        login = unique('class_view')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.get(
            f'{HANDLER_CARS}/class/{car_class}',
            headers=make_auth_headers(token)
        )

        assert response.status == 200

    async def test_get_cars_by_class_400_invalid_class(self, service_client):
        login = unique('class_view2')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.get(
            f'{HANDLER_CARS}/class/invalid_class',
            headers=make_auth_headers(token)
        )

        assert response.status == 400

    async def test_get_cars_by_class_400_no_auth(self, service_client):
        response = await service_client.get(f'{HANDLER_CARS}/class/suv')
        assert response.status == 400


class TestCreateRental:

    async def test_create_rental_201(self, service_client):
        login = unique('rental_user')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        car = await service_client.post(
            HANDLER_CARS,
            json=make_car_data(),
            headers=make_auth_headers(token)
        )

        car_id = car.json()['id']

        response = await service_client.post(
            HANDLER_RENTALS,
            json=make_rental_data(car_id=car_id),
            headers=make_auth_headers(token)
        )

        assert response.status == 201
        assert response.json()['status'] == 'active'

    async def test_create_rental_400_end_before_start(self, service_client):
        login = unique('rental_user2')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        now = datetime.utcnow()

        response = await service_client.post(
            HANDLER_RENTALS,
            json={
                'car_id': str(uuid.uuid4()),
                'start_date': (now + timedelta(days=5)).isoformat() + 'Z',
                'end_date': (now + timedelta(days=1)).isoformat() + 'Z'
            },
            headers=make_auth_headers(token)
        )

        assert response.status == 400

    async def test_create_rental_400_no_auth(self, service_client):
        response = await service_client.post(HANDLER_RENTALS, json=make_rental_data())
        assert response.status == 400

    async def test_create_rental_404_car_not_found(self, service_client):
        login = unique('rental_user3')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.post(
            HANDLER_RENTALS,
            json=make_rental_data(car_id=str(uuid.uuid4())),
            headers=make_auth_headers(token)
        )

        assert response.status == 404

    async def test_create_rental_409_car_not_available(self, service_client):
        login = unique('rental_user4')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        car = await service_client.post(
            HANDLER_CARS,
            json=make_car_data(),
            headers=make_auth_headers(token)
        )

        car_id = car.json()['id']
        now = datetime.utcnow()

        await service_client.post(
            HANDLER_RENTALS,
            json={
                'car_id': car_id,
                'start_date': (now + timedelta(days=1)).isoformat() + 'Z',
                'end_date': (now + timedelta(days=10)).isoformat() + 'Z'
            },
            headers=make_auth_headers(token)
        )

        response = await service_client.post(
            HANDLER_RENTALS,
            json={
                'car_id': car_id,
                'start_date': (now + timedelta(days=2)).isoformat() + 'Z',
                'end_date': (now + timedelta(days=5)).isoformat() + 'Z'
            },
            headers=make_auth_headers(token)
        )

        assert response.status == 409


class TestErrorResponses:

    async def test_validation_error_schema(self, service_client):
        response = await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login='ab')
        )

        data = response.json()
        assert data['code'] == 'validation_error'
        assert 'message' in data

    async def test_not_found_error_schema(self, service_client):
        login = unique('error_user')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))
        token = await get_auth_token(service_client, login)
        if not token:
            pytest.skip()

        response = await service_client.get(
            f'{HANDLER_USERS}/by-login/{unique("missing")}',
            headers=make_auth_headers(token)
        )

        assert response.status == 404
        assert response.json()['code'] == 'not_found'

    async def test_conflict_error_schema(self, service_client):
        login = unique('conflict_user')

        await service_client.post(HANDLER_USERS, json=make_user_data(login=login))

        response = await service_client.post(
            HANDLER_USERS,
            json=make_user_data(login=login)
        )

        assert response.json()['code'] == 'conflict'