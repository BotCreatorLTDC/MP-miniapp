#!/bin/bash

# Script para iniciar el servidor API de la miniapp MP Global Corp

echo "🚀 Iniciando servidor API de la miniapp MP Global Corp..."

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado. Por favor instala Python3 primero."
    exit 1
fi

# Verificar si pip está instalado
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 no está instalado. Por favor instala pip3 primero."
    exit 1
fi

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "📚 Instalando dependencias..."
pip install -r requirements_api.txt

# Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Creando archivo de ejemplo..."
    cat > .env << EOF
# Configuración de la base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/mp_bot

# Configuración del servidor
PORT=5000
DEBUG=True

# Configuración de logging
LOG_LEVEL=INFO
EOF
    echo "📝 Por favor edita el archivo .env con tu configuración de base de datos."
fi

# Cargar variables de entorno
if [ -f ".env" ]; then
    echo "🔑 Cargando variables de entorno..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar conexión a la base de datos
echo "🔍 Verificando conexión a la base de datos..."
python3 -c "
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL', 'postgresql://localhost/mp_bot'))
    print('✅ Conexión a la base de datos exitosa')
    conn.close()
except Exception as e:
    print(f'❌ Error conectando a la base de datos: {e}')
    print('⚠️  La miniapp funcionará con datos de fallback')
"

# Iniciar servidor
echo "🌐 Iniciando servidor en puerto ${PORT:-5000}..."
echo "📱 Miniapp disponible en: http://localhost:${PORT:-5000}"
echo "🔗 API disponible en: http://localhost:${PORT:-5000}/api/"
echo "📊 Health check: http://localhost:${PORT:-5000}/api/health"
echo ""
echo "Presiona Ctrl+C para detener el servidor"

python3 api_server.py
