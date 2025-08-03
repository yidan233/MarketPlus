from flask import Blueprint, request, jsonify
from app.database.models import User
from app.database.connection import SessionLocal
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Validate 
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required.'}), 400
    
    session = SessionLocal()
    try:
        if session.query(User).filter((User.username == username) | (User.email == email)).first():
            return jsonify({'error': 'Username or email already exists.'}), 400
        
        user = User(username=username, email=email)
        user.set_password(password)  
        session.add(user)
        session.commit()
        
        return jsonify({'message': 'User registered successfully.'}), 201
    finally:
        session.close()

# User Login Endpoint
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    remember = data.get('remember', True) 
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        
        if user and user.check_password(password):  
            login_user(user, remember=remember)  
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    finally:
        session.close()

# User Logout Endpoint
@auth_bp.route('/logout', methods=['POST'])
@login_required  
def logout():
    logout_user()  # This clears the session
    return jsonify({'message': 'Logout successful.'}), 200

# Check Authentication Status
@auth_bp.route('/status', methods=['GET'])
def check_auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'username': current_user.username, 
                'email': current_user.email,
                'id': current_user.id
            }
        })
    return jsonify({'authenticated': False}), 401

@auth_bp.route('/profile', methods=['GET'])
@login_required  # PROTECT THIS ROUTE
def get_user_profile():
    return jsonify({
        'username': current_user.username,
        'email': current_user.email,
        'id': current_user.id
    })

