# Sourced by scripts/deploy.sh. See the header of deploy.sh for every option.

# Optional runtime secret: in-app feedback is copied to RevenueHog when set.
# Read from ./.env.prod (or the shared env file) by name; never committed.
OPTIONAL_SECRETS=(REVENUE_HOG_API_KEY:REVENUE_HOG_API_KEY)
