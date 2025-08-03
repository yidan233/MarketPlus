from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
import logging
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    
    # Configure secret key for sessions
    from app.config import SECRET_KEY
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Configure session settings for 1 day persistence
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
    app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=1)
    app.config['REMEMBER_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['REMEMBER_COOKIE_HTTPONLY'] = True
    app.config['REMEMBER_COOKIE_REFRESH_EACH_REQUEST'] = True
    
    # Fix CORS configuration
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173"],
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    logging.basicConfig(level=logging.INFO)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'api.auth.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.database.models import User
        from app.database.connection import SessionLocal
        session = SessionLocal()
        try:
            return session.query(User).get(int(user_id))
        finally:
            session.close()
    
    from app.api.routes import register_routes
    register_routes(app)
    
    return app

app = create_app()