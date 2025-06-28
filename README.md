# 🧾 API de Productos – Express + SQLite + Knex

Este proyecto es una API REST sencilla para manejar productos, usando **Node.js**, **Express**, **Knex.js** y **SQLite**. Está configurado para trabajar en modo **ES Modules** (`"type": "module"` en `package.json`).

---

## 📦 Requisitos

- Node.js v18 o superior
- npm
- Git

---

## 🚀 Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/tu-usuario/nombre-repo.git
   cd nombre-repo
   ```
3. **Instalar dependecias**
   ```bash
   npm install
   ```
3.  **Aplicar migraciones**
   ```bash
   npx knex migrate:latest --esm
   ```
4. **Iniciar proyecto en modo producción**
   ```bash
   node --watch src\app.js
   ```

LISTO
