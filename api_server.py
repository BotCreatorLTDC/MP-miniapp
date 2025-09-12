#!/usr/bin/env python3
"""
Servidor API para la miniapp MP Global Corp
Conecta la miniapp con la base de datos PostgreSQL del bot
"""

import os
import json
import logging
import psycopg2
import psycopg2.extras
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Permitir CORS para la miniapp

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.bot_token = os.getenv('BOT_TOKEN')
        self.connect()

    def convert_file_id_to_url(self, file_id):
        """Convertir file_id de Telegram a URL de la API"""
        if not self.bot_token:
            logger.warning("BOT_TOKEN no configurado, no se pueden convertir file_id")
            return file_id

        try:
            # Si ya es una URL completa, devolverla
            if file_id.startswith('http'):
                return file_id

            # Si es una ruta relativa, mantenerla
            if file_id.startswith('img/'):
                return file_id

            # Si es un file_id, obtener el file_path real de la API de Telegram
            api_url = f"https://api.telegram.org/bot{self.bot_token}/getFile"
            response = requests.get(api_url, params={'file_id': file_id})

            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    file_path = data['result']['file_path']
                    url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
                    logger.info(f"✅ Convertido file_id {file_id} a URL: {url}")
                    return url
                else:
                    logger.error(f"Error en API de Telegram: {data.get('description', 'Unknown error')}")
                    return file_id
            else:
                logger.error(f"Error HTTP {response.status_code} obteniendo file_path para {file_id}")
                return file_id

        except Exception as e:
            logger.error(f"Error convirtiendo file_id {file_id}: {e}")
            return file_id

    def convert_images_to_urls(self, images):
        """Convertir lista de imágenes de file_id a URLs"""
        if not images:
            return []

        converted_images = []
        for image in images:
            if isinstance(image, str):
                converted_images.append(self.convert_file_id_to_url(image))
            else:
                converted_images.append(image)

        return converted_images

    def connect(self):
        """Conectar a la base de datos PostgreSQL"""
        try:
            database_url = os.getenv('DATABASE_URL', 'postgresql://localhost/mp_bot')
            self.connection = psycopg2.connect(database_url)
            logger.info("✅ Conectado a PostgreSQL")
        except Exception as e:
            logger.error(f"❌ Error conectando a PostgreSQL: {e}")
            self.connection = None

    def get_connection(self):
        """Obtener conexión a la base de datos"""
        if not self.connection or self.connection.closed:
            self.connect()
        return self.connection

    def get_catalog(self):
        """Obtener catálogo completo desde la base de datos"""
        try:
            conn = self.get_connection()
            if not conn:
                return self.get_fallback_catalog()

            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Obtener categorías desde la tabla de categorías
            cursor.execute("""
                SELECT c.category_key, c.category_name, c.description
                FROM categories c
                ORDER BY c.category_key
            """)
            categories_data = cursor.fetchall()

            catalog = {"categories": {}}

            for category_row in categories_data:
                category_key = category_row['category_key']
                category_name = category_row['category_name']
                category_description = category_row['description']

                # Obtener productos de la categoría
                cursor.execute("""
                    SELECT name, price, description, stock, images, created_at, updated_at
                    FROM products
                    WHERE category = %s
                    ORDER BY name
                """, (category_key,))

                products = []
                for row in cursor.fetchall():
                    # Procesar imágenes
                    images = json.loads(row['images']) if row['images'] else []
                    converted_images = self.convert_images_to_urls(images)

                    product = {
                        "name": row['name'],
                        "price": row['price'] or "",
                        "description": row['description'] or "",
                        "stock": row['stock'] or "No Disponible",
                        "images": converted_images,
                        "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                        "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None
                    }
                    products.append(product)

                # Usar nombre de la base de datos
                catalog["categories"][category_key] = {
                    "name": category_name,
                    "description": category_description or f"Productos de {category_name}",
                    "products": products
                }

            return catalog

        except Exception as e:
            logger.error(f"Error obteniendo catálogo: {e}")
            return self.get_fallback_catalog()

    def get_category_display_name(self, category):
        """Obtener nombre de visualización de la categoría"""
        category_names = {
            'moroccan_hash': '🇲🇦 MOROCCAN STUFF 🇲🇦',
            'spanish_flower': '🇪🇸 SPANISH STUFF 🇪🇸',
            'cali_flower': '🇺🇸 CALIFORNIA STUFF 🇺🇸',
            'extractions': '🔬 EXTRACTIONS',
            'varios': '📦 OTHER PRODUCTS'
        }
        return category_names.get(category, category.upper())

    def get_fallback_catalog(self):
        """Catálogo de fallback si no hay conexión a BD"""
        try:
            with open('data/catalog.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando catálogo de fallback: {e}")
            return {"categories": {}}

    def add_order(self, order_data):
        """Agregar pedido a la base de datos"""
        try:
            conn = self.get_connection()
            if not conn:
                return {"success": False, "error": "No hay conexión a la base de datos"}

            cursor = conn.cursor()

            # Insertar pedido
            cursor.execute("""
                INSERT INTO orders (
                    user_id, full_name, phone, address, city, province,
                    postal_code, order_content, payment_method, comments,
                    order_data, status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                order_data.get('user_id'),
                order_data.get('fullName'),
                order_data.get('phone'),
                order_data.get('address'),
                order_data.get('city'),
                order_data.get('province'),
                order_data.get('postalCode'),
                order_data.get('orderContent'),
                order_data.get('paymentMethod'),
                order_data.get('comments'),
                json.dumps(order_data),
                'pending',
                datetime.now()
            ))

            order_id = cursor.fetchone()[0]
            conn.commit()

            logger.info(f"Pedido {order_id} creado exitosamente")
            return {"success": True, "order_id": order_id}

        except Exception as e:
            logger.error(f"Error agregando pedido: {e}")
            return {"success": False, "error": str(e)}

    def get_orders(self, user_id=None, limit=50):
        """Obtener pedidos"""
        try:
            conn = self.get_connection()
            if not conn:
                return []

            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            if user_id:
                cursor.execute("""
                    SELECT * FROM orders
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (user_id, limit))
            else:
                cursor.execute("""
                    SELECT * FROM orders
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))

            return cursor.fetchall()

        except Exception as e:
            logger.error(f"Error obteniendo pedidos: {e}")
            return []

# Instancia global del gestor de base de datos
db = DatabaseManager()

@app.route('/')
def index():
    """Servir la página principal de la miniapp"""
    return send_from_directory('.', 'index.html')

@app.route('/demo')
def demo():
    """Servir la página de demostración"""
    return send_from_directory('.', 'demo.html')

@app.route('/api/catalog')
def get_catalog():
    """Obtener catálogo completo"""
    try:
        catalog = db.get_catalog()
        return jsonify({
            "success": True,
            "data": catalog,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error en /api/catalog: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/catalog/<category>')
def get_category(category):
    """Obtener productos de una categoría específica"""
    try:
        catalog = db.get_catalog()
        if category in catalog["categories"]:
            return jsonify({
                "success": True,
                "data": catalog["categories"][category],
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Categoría no encontrada"
            }), 404
    except Exception as e:
        logger.error(f"Error en /api/catalog/{category}: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/products/search')
def search_products():
    """Buscar productos"""
    try:
        query = request.args.get('q', '').lower()
        if not query:
            return jsonify({
                "success": False,
                "error": "Parámetro de búsqueda requerido"
            }), 400

        catalog = db.get_catalog()
        results = []

        for category_id, category in catalog["categories"].items():
            for product in category["products"]:
                if (query in product["name"].lower() or
                    query in product["description"].lower() or
                    query in product["price"].lower()):
                    product_with_category = product.copy()
                    product_with_category["category"] = category_id
                    product_with_category["category_name"] = category["name"]
                    results.append(product_with_category)

        return jsonify({
            "success": True,
            "data": results,
            "query": query,
            "count": len(results),
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error en búsqueda: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Crear nuevo pedido"""
    try:
        order_data = request.get_json()
        if not order_data:
            return jsonify({
                "success": False,
                "error": "Datos del pedido requeridos"
            }), 400

        result = db.add_order(order_data)

        if result["success"]:
            return jsonify({
                "success": True,
                "order_id": result["order_id"],
                "message": "Pedido creado exitosamente"
            })
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 500

    except Exception as e:
        logger.error(f"Error creando pedido: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/orders')
def get_orders():
    """Obtener pedidos"""
    try:
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 50))

        orders = db.get_orders(user_id, limit)

        return jsonify({
            "success": True,
            "data": orders,
            "count": len(orders),
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error obteniendo pedidos: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/health')
def health_check():
    """Verificar estado del servidor y base de datos"""
    try:
        conn = db.get_connection()
        db_status = "connected" if conn and not conn.closed else "disconnected"

        return jsonify({
            "status": "healthy",
            "database": db_status,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/image/<image_id>')
def get_image(image_id):
    """Servir imagen desde la base de datos"""
    try:
        # Si es una referencia a imagen de base de datos
        if image_id.startswith('db_image_'):
            actual_id = image_id.replace('db_image_', '')
            
            conn = db.get_connection()
            if not conn:
                return "Database not connected", 500
                
            cursor = conn.cursor()
            cursor.execute("""
                SELECT image_data, filename FROM images WHERE id = %s
            """, (actual_id,))
            
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                image_data, filename = result
                # Decodificar base64
                import base64
                image_bytes = base64.b64decode(image_data)
                
                # Determinar content type basado en la extensión
                if filename.lower().endswith('.png'):
                    content_type = 'image/png'
                elif filename.lower().endswith('.gif'):
                    content_type = 'image/gif'
                else:
                    content_type = 'image/jpeg'
                
                return image_bytes, 200, {'Content-Type': content_type}
            else:
                return "Image not found", 404
        else:
            return "Invalid image ID format", 400
            
    except Exception as e:
        logger.error(f"Error obteniendo imagen {image_id}: {e}")
        return f"Error: {str(e)}", 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint no encontrado"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Error interno del servidor"
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'

    logger.info(f"🚀 Iniciando servidor API en puerto {port}")
    logger.info(f"📊 Base de datos: {'Conectada' if db.get_connection() else 'Desconectada'}")

    app.run(host='0.0.0.0', port=port, debug=debug)
