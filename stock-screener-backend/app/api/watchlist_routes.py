from flask import Blueprint, request, jsonify
from app.database import SessionLocal
from app.database.models import User, Watchlist, WatchlistMatch, Stock
import json
import logging

logger = logging.getLogger(__name__)

watchlist_bp = Blueprint('watchlist', __name__, url_prefix='/api/watchlists')

# Handle both with and without trailing slash
@watchlist_bp.route('', methods=['GET'])
@watchlist_bp.route('/', methods=['GET'])
def get_user_watchlists():
    """Get all watchlists for a user"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        watchlists = db.query(Watchlist).filter(Watchlist.user_id == user.id).all()
        
        # Get matches for each watchlist
        result = []
        for watchlist in watchlists:
            watchlist_data = watchlist.to_dict()
            
            # Get matches with stock data
            matches = db.query(WatchlistMatch).filter(WatchlistMatch.watchlist_id == watchlist.id).all()
            watchlist_data['matches'] = [match.to_dict() for match in matches]
            
            result.append(watchlist_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error getting watchlists: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@watchlist_bp.route('/', methods=['POST'])
def create_watchlist():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        # Get or create user
        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            user = User(
                username=username,
                email=data.get('email', f'{username}@example.com')
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create watchlist
        watchlist = Watchlist(
            user_id=user.id,
            name=data.get('name', 'Unnamed Watchlist'),
            criteria=json.dumps(data.get('criteria', {})),
            is_active=data.get('is_active', True),
            is_monitoring=data.get('is_monitoring', True),
            email_alerts=data.get('email_alerts', True)  # Add this
        )
        
        db.add(watchlist)
        db.commit()
        db.refresh(watchlist)
        
        return jsonify(watchlist.to_dict()), 201
        
    except Exception as e:
        logger.error(f"Error creating watchlist: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@watchlist_bp.route('/<int:watchlist_id>', methods=['PUT'])
def update_watchlist(watchlist_id):
    """Update watchlist settings including email preferences"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        db = SessionLocal()
        watchlist = db.query(Watchlist).filter_by(id=watchlist_id).first()
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        # Update fields
        if 'name' in data:
            watchlist.name = data['name']
        if 'criteria' in data:
            watchlist.criteria = json.dumps(data['criteria'])
        if 'is_active' in data:
            watchlist.is_active = data['is_active']
        if 'is_monitoring' in data:
            watchlist.is_monitoring = data['is_monitoring']
        if 'email_alerts' in data:
            watchlist.email_alerts = data['email_alerts']
        
        db.commit()
        
        return jsonify(watchlist.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error updating watchlist: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@watchlist_bp.route('/<int:watchlist_id>', methods=['DELETE'])
def delete_watchlist(watchlist_id):
    """Delete a watchlist"""
    try:
        db = SessionLocal()
        watchlist = db.query(Watchlist).get(watchlist_id)
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        db.delete(watchlist)
        db.commit()
        
        return '', 204
        
    except Exception as e:
        logger.error(f"Error deleting watchlist: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        db.close() 

@watchlist_bp.route('/<int:watchlist_id>/matches', methods=['GET'])
def get_watchlist_matches(watchlist_id):
    """Get all matches for a specific watchlist"""
    try:
        db = SessionLocal()
        watchlist = db.query(Watchlist).get(watchlist_id)
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        # Get matches, ordered by most recent first
        matches = db.query(WatchlistMatch).filter_by(
            watchlist_id=watchlist_id
        ).order_by(WatchlistMatch.matched_at.desc()).all()
        
        return jsonify([match.to_dict() for match in matches])
        
    except Exception as e:
        logger.error(f"Error getting watchlist matches: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        db.close()

@watchlist_bp.route('/<int:watchlist_id>/matches/<int:match_id>', methods=['DELETE'])
def delete_match(watchlist_id, match_id):
    """Delete a specific match"""
    try:
        db = SessionLocal()
        match = db.query(WatchlistMatch).filter_by(
            id=match_id,
            watchlist_id=watchlist_id
        ).first()
        
        if not match:
            return jsonify({'error': 'Match not found'}), 404
        
        db.delete(match)
        db.commit()
        
        return '', 204
        
    except Exception as e:
        logger.error(f"Error deleting match: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        db.close()

@watchlist_bp.route('/<int:watchlist_id>/matches', methods=['DELETE'])
def clear_watchlist_matches(watchlist_id):
    """Clear all matches for a watchlist"""
    try:
        db = SessionLocal()
        matches = db.query(WatchlistMatch).filter_by(watchlist_id=watchlist_id).all()
        
        for match in matches:
            db.delete(match)
        
        db.commit()
        
        return '', 204
        
    except Exception as e:
        logger.error(f"Error clearing matches: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        db.close() 