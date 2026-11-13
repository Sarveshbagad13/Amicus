import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

class Database:
    client = None
    db = None

    @classmethod
    def init_app(cls, app=None, client=None):
        from app.config import Config
        def get_cfg_val(key, default):
            if hasattr(app, "config") and isinstance(app.config, dict):
                return app.config.get(key, default)
            elif hasattr(app, "state") and hasattr(app.state, "config"):
                return getattr(app.state.config, key, default)
            elif app and hasattr(app, key):
                return getattr(app, key, default)
            return getattr(Config, key, default)

        db_name = get_cfg_val("DB_NAME", "amicus_legal_analyzer")
        mongo_uri = get_cfg_val("MONGODB_URI", "mongodb://localhost:27017")

        if client is not None:
            cls.client = client
            cls.db = client[db_name]
        else:
            try:
                test_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1000)
                test_client.admin.command("ping")
                cls.client = test_client
                cls.db = cls.client[db_name]
                logger.info(f"Connected to live MongoDB at {mongo_uri}, database: {db_name}")
            except Exception as e:
                import mongomock
                logger.info(f"Local MongoDB daemon not running ({e}). Initializing embedded in-memory database.")
                cls.client = mongomock.MongoClient()
                cls.db = cls.client[db_name]
        
        cls._create_indexes()


    @classmethod
    def _create_indexes(cls):
        """Ensure indexes matching PRD Section 5 schemas."""
        if cls.db is None:
            return
        try:
            # Users: unique email
            cls.db.users.create_index([("email", ASCENDING)], unique=True)
            
            # Documents: user_id + created_at
            cls.db.documents.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            cls.db.documents.create_index([("status", ASCENDING)])
            
            # Summaries: document_id (unique 1:1) + user_id
            cls.db.summaries.create_index([("document_id", ASCENDING)], unique=True)
            cls.db.summaries.create_index([("user_id", ASCENDING)])
            
            # Extracted Clauses: document_id + category
            cls.db.extracted_clauses.create_index([("document_id", ASCENDING), ("category", ASCENDING)])
            cls.db.extracted_clauses.create_index([("user_id", ASCENDING)])
            
            # Extracted Entities: document_id + entity_type
            cls.db.extracted_entities.create_index([("document_id", ASCENDING), ("entity_type", ASCENDING)])
            cls.db.extracted_entities.create_index([("user_id", ASCENDING)])
            
            logger.info("MongoDB indexes verified successfully.")
        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")

    @classmethod
    def get_users_collection(cls):
        return cls.db.users

    @classmethod
    def get_documents_collection(cls):
        return cls.db.documents

    @classmethod
    def get_summaries_collection(cls):
        return cls.db.summaries

    @classmethod
    def get_clauses_collection(cls):
        return cls.db.extracted_clauses

    @classmethod
    def get_entities_collection(cls):
        return cls.db.extracted_entities

def serialize_doc(doc):
    """Recursively convert MongoDB document BSON fields (ObjectId, datetime) to JSON-serializable types."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = serialize_doc(value)
            elif isinstance(value, list):
                serialized[key] = serialize_doc(value)
            else:
                serialized[key] = value
        return serialized
    return doc
