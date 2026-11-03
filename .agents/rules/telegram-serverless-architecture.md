# Архитектурное правило: Полная работа на Telegram Serverless (tgcloud) и SQLite

## СТРОГОЕ ПРАВИЛО ПРОЕКТА:
Вся бэкенд-логика, хранение данных и обработка событий бота/Mini App работают **ИСКЛЮЧИТЕЛЬНО** на платформе **Telegram Serverless (`tgcloud`)** с использованием выделенного **SQLite**.

### 1. Архитектурные границы:
1. **Бэкенд (`tgcloud/`) — единственный источник правды:**
   - Таблицы базы данных: строго в `tgcloud/schema.js` с использованием DSL `sdk/db` (SQLite).
   - Серверные эндпоинты для Mini App: строго в `tgcloud/endpoints/<name>.js` (вызываются как `POST /api/<name>`).
   - Обработчики событий бота: строго в `tgcloud/handlers/<type>.js` (`message.js`, `callback_query.js`).
   - Общие модули: строго в `tgcloud/lib/`.
2. **Фронтенд — только статический экспорт (`out/`):**
   - Фронтенд собирается командой `$env:STATIC_EXPORT="true"; npm run build` в директорию `out/`.
   - Статика развертывается и хостится на инфраструктуре Telegram (`tgcloud.jsonc` -> `"source": "out"`).
3. **ЗАПРЕЩЕНО:**
   - ❌ Создавать или использовать Node.js API роуты в Next.js (`src/app/api/...`) для сохранения тренировок, профилей атлетов или вебхуков. В статическом продакшн-билде (`out/`) они отсутствуют и отдают 404!
   - ❌ Использовать локальные JSON-файлы (`data/trainees.json`, `/tmp/...`) как источник правды для дашборда или атлетов.
   - ❌ Использовать NPM-пакет `tgcloud` (это сторонний CLI). Официальный CLI Telegram Serverless — строго `@tgcloud/cli`.

### 2. Взаимодействие фронтенда и эндпоинтов:
- Вызовы эндпоинтов из Mini App осуществляются через `Telegram.WebApp.Serverless.call('<name>', payload, callback)` либо прямой HTTP-запрос к `/api/<name>` с обязательным заголовком авторизации:
  `Authorization: TMA ` + window.btoa(window.Telegram.WebApp.initData).
- Все сохранения тренировок (`saveWorkout`), получение списка атлетов (`getCoachTrainees`) и регистрация лидов (`syncTrainee`) выполняются напрямую через эндпоинты `tgcloud/endpoints/`.

### 3. Инструменты и команды CLI:
- Проверка статуса: `npx @tgcloud/cli status`
- Тестирование эндпоинтов в облаке: `npx @tgcloud/cli run endpoints/<name> '<payload_json5>'`
- Применение миграций схемы БД: `npx @tgcloud/cli migrate`
- Деплой бэкенда и статического фронтенда: `npx @tgcloud/cli push` (требуется `$env:TGCLOUD_TOKEN`).
