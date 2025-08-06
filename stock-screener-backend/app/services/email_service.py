from flask_mail import Mail, Message
from app.config import (
    MAIL_SERVER, MAIL_PORT, MAIL_USE_TLS, MAIL_USE_SSL,
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER
)

# Initialize Flask-Mail
mail = Mail()

def init_email(app):
    """Initialize email configuration using existing config"""
    app.config['MAIL_SERVER'] = MAIL_SERVER
    app.config['MAIL_PORT'] = MAIL_PORT
    app.config['MAIL_USE_TLS'] = MAIL_USE_TLS
    app.config['MAIL_USE_SSL'] = MAIL_USE_SSL
    app.config['MAIL_USERNAME'] = MAIL_USERNAME
    app.config['MAIL_PASSWORD'] = MAIL_PASSWORD
    app.config['MAIL_DEFAULT_SENDER'] = MAIL_DEFAULT_SENDER
    
    mail.init_app(app)

def send_watchlist_alert(user_email, username, watchlist_name, matches):
    """Send email alert for watchlist matches"""
    try:
        subject = f"Stock Screener Alert: {watchlist_name} - {len(matches)} Matches Found"
        
        # Create email body
        body = create_email_body(username, watchlist_name, matches)
        
        # Create HTML version
        html_body = create_html_email_body(username, watchlist_name, matches)
        
        msg = Message(
            subject=subject,
            recipients=[user_email],
            body=body,
            html=html_body
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def create_email_body(username, watchlist_name, matches):
    """Create plain text email body"""
    body = f"""
Hello {username},

Your watchlist "{watchlist_name}" has found {len(matches)} matching stocks.

Matching Stocks:
"""
    
    for match in matches[:20]:  # Show first 20
        body += f"- {match['symbol']}: ${match['price']:.2f} ({match['sector']})\n"
    
    if len(matches) > 20:
        body += f"\n... and {len(matches) - 20} more stocks.\n"
    
    body += """
You can view all matches in your Stock Screener dashboard.

Best regards,
Stock Screener Team
"""
    
    return body

def create_html_email_body(username, watchlist_name, matches):
    """Create HTML email body"""
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .stock-list {{ margin: 20px 0; }}
            .stock-item {{ 
                padding: 10px; 
                border-bottom: 1px solid #eee; 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
            }}
            .symbol {{ font-weight: bold; color: #2563eb; }}
            .price {{ color: #059669; font-weight: bold; }}
            .sector {{ color: #6b7280; }}
            .footer {{ background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 Stock Screener Alert</h1>
            <p>Watchlist: {watchlist_name}</p>
        </div>
        
        <div class="content">
            <h2>Hello {username},</h2>
            <p>Your watchlist <strong>"{watchlist_name}"</strong> has found <strong>{len(matches)} matching stocks</strong>.</p>
            
            <h3>📈 Matching Stocks</h3>
            <div class="stock-list">
    """
    
    for match in matches[:20]:  # Show first 20
        html += f"""
                <div class="stock-item">
                    <div>
                        <span class="symbol">{match['symbol']}</span>
                    </div>
                    <div>
                        <span class="price">${match['price']:.2f}</span>
                        <span class="sector">({match['sector']})</span>
                    </div>
                </div>
        """
    
    if len(matches) > 20:
        html += f"""
                <div class="stock-item">
                    <div>
                        <span class="sector">... and {len(matches) - 20} more stocks</span>
                    </div>
                </div>
        """
    
    html += """
            </div>
            
            <p>You can view all matches in your Stock Screener dashboard.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>Stock Screener Team</p>
        </div>
    </body>
    </html>
    """
    
    return html 