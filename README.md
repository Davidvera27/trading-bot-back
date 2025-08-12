# 🤖 Trading Bot Backend API

Backend API para un sistema de trading automatizado con integración a Binance, gestión de estrategias, órdenes y posiciones.

## 🚀 Características

- **🔐 Autenticación JWT** - Sistema seguro de autenticación
- **📊 Gestión de Estrategias** - 7 tipos de estrategias de trading
- **📈 Gestión de Órdenes** - Market, limit, stop, stop-limit
- **💰 Gestión de Posiciones** - Tracking de PnL en tiempo real
- **📱 Notificaciones** - Email, SMS, push, webhooks
- **🔍 Backtesting** - Simulación de estrategias
- **📉 Indicadores Técnicos** - Análisis técnico avanzado
- **🛡️ Gestión de Riesgo** - Validaciones y límites automáticos
- **📚 Documentación Swagger** - API completamente documentada

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos principal
- **Sequelize** - ORM para PostgreSQL
- **JWT** - Autenticación y autorización
- **Swagger** - Documentación de API
- **Redis** - Caché y sesiones
- **Winston** - Logging estructurado

## 📋 Prerrequisitos

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+ (opcional)
- Git

## ⚙️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/trading-bot-back.git
cd trading-bot-back
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_bot
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Binance API (para producción)
BINANCE_API_KEY=tu_api_key
BINANCE_API_SECRET=tu_api_secret
```

### 4. Configurar base de datos
```bash
# Crear base de datos PostgreSQL
createdb trading_bot

# Ejecutar migraciones
npm run migrate

# Ejecutar seeders (datos de prueba)
npm run seed
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Documentación de la API

Una vez iniciado el servidor, la documentación Swagger estará disponible en:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🏗️ Estructura del Proyecto

```
src/
├── config/          # Configuraciones
├── controllers/     # Controladores de la API
├── middleware/      # Middlewares personalizados
├── models/          # Modelos de Sequelize
├── routes/          # Rutas de la API
├── services/        # Lógica de negocio
├── utils/           # Utilidades y helpers
└── index.js         # Punto de entrada
```

## 🔌 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión

### Estrategias
- `GET /api/strategies` - Listar estrategias
- `POST /api/strategies` - Crear estrategia
- `PUT /api/strategies/:id` - Actualizar estrategia
- `DELETE /api/strategies/:id` - Eliminar estrategia
- `GET /api/strategies/statistics` - Estadísticas

### Órdenes
- `GET /api/orders` - Listar órdenes
- `POST /api/orders` - Crear orden
- `PUT /api/orders/:id` - Actualizar orden
- `DELETE /api/orders/:id` - Cancelar orden
- `GET /api/orders/statistics` - Estadísticas

### Posiciones
- `GET /api/positions` - Listar posiciones
- `POST /api/positions` - Crear posición
- `PUT /api/positions/:id` - Actualizar posición
- `POST /api/positions/:id/close` - Cerrar posición
- `GET /api/positions/statistics` - Estadísticas

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar con nodemon
npm run start        # Iniciar en producción

# Base de datos
npm run migrate      # Ejecutar migraciones
npm run seed         # Ejecutar seeders
npm run db:reset     # Resetear base de datos

# Testing
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch

# Linting
npm run lint         # Verificar código
npm run lint:fix     # Corregir problemas de linting
```

## 🚀 Despliegue

### Docker
```bash
# Construir imagen
docker build -t trading-bot-back .

# Ejecutar contenedor
docker run -p 3001:3001 trading-bot-back
```

### Heroku
```bash
# Crear app en Heroku
heroku create trading-bot-back

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=tu_url_de_postgres

# Desplegar
git push heroku main
```

### Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

## 🔒 Seguridad

- **JWT Tokens** para autenticación
- **Rate Limiting** para prevenir abuso
- **CORS** configurado
- **Helmet** para headers de seguridad
- **Validación de entrada** con express-validator
- **Encriptación de contraseñas** con bcrypt

## 📊 Monitoreo

- **Logs estructurados** con Winston
- **Health checks** automáticos
- **Métricas de rendimiento**
- **Alertas de errores**

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Email**: soporte@tradingbot.com
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/trading-bot-back/wiki)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/trading-bot-back/issues)

## 🙏 Agradecimientos

- [Binance API](https://binance-docs.github.io/apidocs/) por la API de trading
- [Sequelize](https://sequelize.org/) por el ORM
- [Express.js](https://expressjs.com/) por el framework web
- [Ant Design](https://ant.design/) por los componentes de UI

---

**Desarrollado con ❤️ para la comunidad de trading**
