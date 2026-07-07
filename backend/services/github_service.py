import urllib.request
import json
import logging
from datetime import datetime, timedelta
from config.settings import get_settings

logger = logging.getLogger(__name__)


def make_github_request(url: str) -> dict:
    """Helper to perform GET requests to the GitHub API, incorporating GITHUB_TOKEN if available."""
    settings = get_settings()
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Antigravity-AI-Resume-Platform")
    
    if settings.GITHUB_TOKEN:
        req.add_header("Authorization", f"token {settings.GITHUB_TOKEN}")
        
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"GitHub API error fetching {url}: {e}")
        
    return None


def analyze_github_profile(username: str) -> dict:
    """
    Crawls public GitHub API for user repositories, languages, commit velocities, and stars.
    Computes github_score and returns structured strengths/weaknesses.
    Returns None when the profile can't be fetched (unknown user, rate limit, network) —
    the caller/UI shows an honest "unavailable" state instead of invented data.
    """
    if not username:
        return None

    # Clean username if it is a full URL
    username = username.strip().split("/")[-1]

    # 1. Try to fetch user info
    user_url = f"https://api.github.com/users/{username}"
    user_data = make_github_request(user_url)

    # 2. Try to fetch repositories
    repos_url = f"https://api.github.com/users/{username}/repos?per_page=60&sort=updated"
    repos_data = make_github_request(repos_url)

    if not user_data or repos_data is None:
        logger.warning(f"Failed to fetch GitHub API data for {username}.")
        return None
        
    # Process actual API data
    public_repos = user_data.get("public_repos", 0)
    followers = user_data.get("followers", 0)
    bio = user_data.get("bio") or ""
    avatar_url = user_data.get("avatar_url") or ""
    
    total_stars = 0
    total_forks = 0
    languages = {}
    repos_list = []
    recent_updates_count = 0
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    ninety_days_ago = now - timedelta(days=90)
    
    for repo in repos_data:
        # Exclude forks to check original work
        if repo.get("fork"):
            continue
            
        stars = repo.get("stargazers_count", 0)
        forks = repo.get("forks_count", 0)
        total_stars += stars
        total_forks += forks
        
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
            
        updated_at_str = repo.get("updated_at")
        updated_at = None
        if updated_at_str:
            try:
                updated_at = datetime.strptime(updated_at_str, "%Y-%m-%dT%H:%M:%SZ")
                if updated_at > thirty_days_ago:
                    recent_updates_count += 2  # high weight
                elif updated_at > ninety_days_ago:
                    recent_updates_count += 1
            except ValueError:
                pass
                
        repos_list.append({
            "name": repo.get("name"),
            "description": repo.get("description") or "No description provided.",
            "stars": stars,
            "forks": forks,
            "language": lang or "Other",
            "url": repo.get("html_url"),
            "updated_at": updated_at_str
        })
        
    # Sorted languages list
    sorted_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)
    lang_distribution = {lang: count for lang, count in sorted_languages[:5]}
    
    # Calculate score
    # Formula: repos count (max 20), followers (max 20), stars (max 20), update velocity (max 25), bio/profile elements (max 15)
    repos_score = min((len(repos_list) / 10) * 20, 20)
    followers_score = min((followers / 15) * 20, 20)
    stars_score = min((total_stars / 5) * 20, 20)
    velocity_score = min((recent_updates_count / 6) * 25, 25)
    bio_score = 15 if bio else 5
    
    github_score = round(repos_score + followers_score + stars_score + velocity_score + bio_score, 1)
    github_score = max(min(github_score, 98.5), 25.0)
    
    # Evaluate velocity text
    if recent_updates_count >= 8:
        velocity_desc = "Highly Active (Multiple commits/updates in the last 30 days)"
    elif recent_updates_count >= 4:
        velocity_desc = "Moderate Activity (Recent updates in the last 90 days)"
    else:
        velocity_desc = "Low Activity (No updates in the last 90 days)"
        
    # Analyze strengths & weaknesses
    strengths = []
    weaknesses = []
    recommendations = []
    
    if len(repos_list) >= 5:
        strengths.append(f"Strong repository quantity ({len(repos_list)} original public projects).")
    if total_stars > 2:
        strengths.append(f"Community recognition (accumulated {total_stars} stars across repos).")
    if len(sorted_languages) >= 3:
        strengths.append(f"Diverse technical stack: active in {', '.join([l[0] for l in sorted_languages[:3]])}.")
    if recent_updates_count >= 5:
        strengths.append("High code contribution velocity showing consistency.")
        
    if len(strengths) == 0:
        strengths.append("Maintains public GitHub developer profile.")
        
    if len(repos_list) < 3:
        weaknesses.append("Very few public repositories. Hard to gauge depth of coding practice.")
    if total_stars == 0:
        weaknesses.append("Zero stars across public repos; lacks community-validated projects.")
    if recent_updates_count < 3:
        weaknesses.append("Stale code repository. Low commit velocity in the last 90 days.")
    # Check if README description is missing in repos
    empty_descriptions = sum(1 for r in repos_list if r["description"] == "No description provided.")
    if empty_descriptions > 0 and len(repos_list) > 0:
        percent = int((empty_descriptions / len(repos_list)) * 100)
        if percent > 30:
            weaknesses.append(f"{percent}% of public repositories lack descriptions or taglines.")
            
    if not bio:
        weaknesses.append("GitHub bio is empty, which reduces professional profile completeness.")
        
    # Construct recommendations
    if not bio:
        recommendations.append("Update your GitHub profile bio to include your core tech stack and career aspirations.")
    if recent_updates_count < 3:
        recommendations.append("Commit regularly. Establish a solid green contribution graph to demonstrate consistency.")
    if empty_descriptions > 0:
        recommendations.append("Write short descriptions and taglines for all repository metadata fields.")
    recommendations.append("Pin your top 3-4 repositories, and ensure they have a detailed README with architectural summaries.")
    recommendations.append("Add license files (MIT or Apache) and .gitignore setups to all projects to show production readiness.")
    
    return {
        "username": username,
        "name": user_data.get("name") or username,
        "avatar_url": avatar_url,
        "github_score": github_score,
        "public_repos": public_repos,
        "followers": followers,
        "stars": total_stars,
        "forks": total_forks,
        "velocity": velocity_desc,
        "languages": lang_distribution,
        "top_repositories": repos_list[:4],
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations
    }
