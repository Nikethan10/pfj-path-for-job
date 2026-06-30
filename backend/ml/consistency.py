from datetime import datetime, timedelta
from typing import List, Dict


def calculate_consistency(
    activity_dates: List[datetime],
    total_days: int = 30,
) -> Dict:
    """
    Consistency Score = active_days / total_days
    Also calculates current streak of consecutive active days.
    """
    if not activity_dates:
        return {
            "consistency_score": 0.0,
            "active_days": 0,
            "total_days": total_days,
            "streak": 0,
        }

    unique_days = set()
    for dt in activity_dates:
        unique_days.add(dt.date() if isinstance(dt, datetime) else dt)

    active_count = len(unique_days)
    score = round(active_count / total_days, 2) if total_days > 0 else 0

    sorted_days = sorted(unique_days, reverse=True)
    streak = 0
    expected = datetime.utcnow().date()
    for day in sorted_days:
        if day == expected or day == expected - timedelta(days=1):
            streak += 1
            expected = day - timedelta(days=1)
        else:
            break

    return {
        "consistency_score": min(score, 1.0),
        "active_days": active_count,
        "total_days": total_days,
        "streak": streak,
    }
