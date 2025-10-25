#!/usr/bin/env python3
"""
Servidor API simplificado para la miniapp MP Global Corp
Conecta la miniapp con Supabase
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from supabase import create_client

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Permitir CORS para la miniapp

class SupabaseManager:
    def __init__(self):
        self.client = None
        self.bot_token = os.getenv('BOT_TOKEN')
        self.connect()

    def connect(self):
        """Conectar a Supabase"""
        try:
            url = os.getenv('SUPABASE_URL')
            key = os.getenv('SUPABASE_KEY')

            if not url or not key:
                logger.error("❌ SUPABASE_URL o SUPABASE_KEY no encontradas en .env")
                return

            self.client = create_client(url, key)
            logger.info("✅ Conectado a Supabase")
        except Exception as e:
            logger.error(f"❌ Error conectando a Supabase: {e}")
            self.client = None

    def get_catalog(self):
        """Obtener catálogo completo desde Supabase"""
        try:
            if not self.client:
                return self.get_fallback_catalog()

            # Obtener categorías desde Supabase
            categories_result = self.client.table('categories').select('category_key, category_name, description').execute()
            categories_data = categories_result.data

            catalog = {"categories": {}}

            for category_row in categories_data:
                category_key = category_row['category_key']
                category_name = category_row['category_name']
                category_description = category_row['description']

                # Obtener productos de la categoría
                products_result = self.client.table('products').select('name, price, description, stock, images, created_at').eq('category', category_key).execute()
                products_data = products_result.data

                catalog["categories"][category_key] = {
                    "name": category_name,
                    "description": category_description,
                    "products": []
                }

                for product_row in products_data:
                    # Convertir imágenes
                    images = product_row.get('images', [])
                    converted_images = self.convert_images_to_urls(images)

                    catalog["categories"][category_key]["products"].append({
                        "name": product_row['name'],
                        "price": product_row['price'],
                        "description": product_row['description'],
                        "stock": product_row['stock'],
                        "images": converted_images
                    })

            logger.info(f"✅ Catálogo cargado desde Supabase: {len(catalog['categories'])} categorías")
            return catalog

        except Exception as e:
            logger.error(f"❌ Error obteniendo catálogo desde Supabase: {e}")
            return self.get_fallback_catalog()

    def convert_images_to_urls(self, images):
        """Convertir imágenes a URLs válidas"""
        if not images:
            return []

        converted_images = []
        for image in images:
            if isinstance(image, str):
                if image.startswith('http'):
                    converted_images.append(image)
                elif image.startswith('img/'):
                    # Para imágenes locales, usar GitHub Pages
                    converted_images.append(f"https://botcreatorltdc.github.io/MP-miniapp/{image}")
                else:
                    # Mantener como está
                    converted_images.append(image)
            else:
                converted_images.append(str(image))

        return converted_images

    def get_fallback_catalog(self):
        """Obtener catálogo de respaldo desde archivo JSON"""
        try:
            with open('data/catalog.json', 'r', encoding='utf-8') as f:
                catalog = json.load(f)
            logger.info("✅ Catálogo cargado desde archivo JSON de respaldo")
            return catalog
        except Exception as e:
            logger.error(f"❌ Error cargando catálogo de respaldo: {e}")
            return {"categories": {}}

# Inicializar manager
db_manager = SupabaseManager()

@app.route('/api/catalog', methods=['GET'])
def get_catalog():
    """Endpoint para obtener el catálogo completo"""
    try:
        catalog = db_manager.get_catalog()
        return jsonify(catalog)
    except Exception as e:
        logger.error(f"❌ Error en endpoint /api/catalog: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de salud del servidor"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route('/api/sections', methods=['GET'])
def get_sections():
    """Endpoint para obtener secciones"""
    try:
        if not db_manager.client:
            return jsonify({"sections": {}})

        sections_result = db_manager.client.table('sections').select('section_key, title, content').execute()
        sections = {}

        for section in sections_result.data:
            sections[section['section_key']] = {
                'title': section['title'],
                'content': section['content']
            }

        return jsonify({"sections": sections})
    except Exception as e:
        logger.error(f"❌ Error en endpoint /api/sections: {e}")
        return jsonify({"sections": {}})

@app.route('/api/products/search', methods=['GET'])
def search_products():
    """Endpoint para buscar productos"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({"products": []})

        if not db_manager.client:
            return jsonify({"products": []})

        # Buscar productos que contengan la query en el nombre o descripción
        products_result = db_manager.client.table('products').select('name, price, description, stock, images, category').or_(f'name.ilike.%{query}%,description.ilike.%{query}%').execute()

        products = []
        for product in products_result.data:
            images = db_manager.convert_images_to_urls(product.get('images', []))
            products.append({
                'name': product['name'],
                'price': product['price'],
                'description': product['description'],
                'stock': product['stock'],
                'images': images,
                'category': product['category']
            })

        return jsonify({"products": products})
    except Exception as e:
        logger.error(f"❌ Error en endpoint /api/products/search: {e}")
        return jsonify({"products": []})

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Endpoint para crear órdenes"""
    try:
        order_data = request.get_json()
        logger.info(f"📦 Nueva orden recibida: {order_data}")

        # Aquí podrías guardar la orden en Supabase si tienes una tabla de órdenes
        # Por ahora solo logueamos la orden

        return jsonify({"status": "success", "message": "Orden recibida correctamente"})
    except Exception as e:
        logger.error(f"❌ Error en endpoint /api/orders: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route('/')
def serve_index():
    """Servir página principal"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Servir archivos estáticos"""
    try:
        return send_from_directory('.', filename)
    except Exception as e:
        logger.error(f"❌ Error sirviendo archivo {filename}: {e}")
        return "Archivo no encontrado", 404

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"🚀 Iniciando servidor API en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
