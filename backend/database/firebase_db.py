import firebase_admin
from firebase_admin import credentials, firestore, db, auth
from config.settings import get_settings
import os
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
def initialize_firebase():
    settings = get_settings()
    
    # Check if already initialized
    if not firebase_admin._apps:
        try:
            # Resolve the absolute path of the credentials file
            # Assuming settings.FIREBASE_CREDENTIALS_PATH is relative to the backend directory
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            cred_path = os.path.join(base_dir, settings.FIREBASE_CREDENTIALS_PATH)
            
            if not os.path.exists(cred_path):
                logger.error(f"Firebase credentials not found at: {cred_path}")
                return
                
            cred = credentials.Certificate(cred_path)
            
            # Initialize with both Firestore capabilities and Realtime DB URL
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.FIREBASE_DATABASE_URL
            })
            logger.info("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")

# Call it immediately when this module is imported
initialize_firebase()

# Export Firestore client
def get_firestore():
    return firestore.client()

# Export Realtime DB reference
def get_rtdb():
    return db.reference()

# Verify Firebase ID token for Auth
def verify_token(id_token: str):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {e}")
        return None
