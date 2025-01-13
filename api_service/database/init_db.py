from api_service.database.base import Base, engine
from api_service.database.models.user import User
from api_service.database.models.extended_user import ExtendedUser

def init_db():
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Создание таблиц в базе данных...")
    init_db()
    print("Таблицы успешно созданы.") 