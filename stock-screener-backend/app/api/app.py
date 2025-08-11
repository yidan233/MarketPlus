from flask import Flask
from flask_cors import CORS
import logging
from app.config import FRONTEND_URL

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    origins = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:3000"
    ]
    
    if FRONTEND_URL:
        origins.append(FRONTEND_URL)
    
    CORS(app, 
         origins=origins,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type"])
    
    logging.basicConfig(level=logging.INFO)
    
    # Register routes
    from app.api.routes import register_routes
    register_routes(app)
    
    return app

app = create_app()