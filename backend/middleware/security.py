from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

# Create a limiter that limits based on the client's IP address
limiter = Limiter(key_func=get_remote_address)

def setup_rate_limiting(app):
    """
    Attach the limiter and its exception handler to the FastAPI app.
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
