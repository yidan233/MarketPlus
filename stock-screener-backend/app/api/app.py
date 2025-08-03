from flask import Flask
from flask_cors import CORS
import logging

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type"])
    
    logging.basicConfig(level=logging.INFO)
    
    # Register routes
    from app.api.routes import register_routes
    register_routes(app)
    
    return app

app = create_app()