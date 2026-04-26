"""Smoke test for all API endpoints."""
import requests
import sys

BASE = "http://localhost:8000"

def test(name, resp):
    ok = resp.status_code < 400
    status = "✅" if ok else "❌"
    print(f"{status} {name} — HTTP {resp.status_code}")
    if not ok:
        print(f"   {resp.text[:200]}")
    return ok, resp

results = []

# Root
ok, _ = test("GET /", requests.get(f"{BASE}/"))
results.append(ok)

# Register user1
ok, r = test("POST /auth/register (user1)", requests.post(f"{BASE}/auth/register", json={
    "username": "testuser", "email": "test@example.com", "password": "password123"
}))
results.append(ok)
token1 = r.json().get("access_token", "")
headers1 = {"Authorization": f"Bearer {token1}"}

# Register user2
ok, r = test("POST /auth/register (user2)", requests.post(f"{BASE}/auth/register", json={
    "username": "foodlover", "email": "food@test.com", "password": "pass123"
}))
results.append(ok)

# Login user1
ok, r = test("POST /auth/login", requests.post(f"{BASE}/auth/login", json={
    "email": "test@example.com", "password": "password123"
}))
results.append(ok)
token = r.json().get("access_token", token1)
headers = {"Authorization": f"Bearer {token}"}

# Me
ok, _ = test("GET /users/me", requests.get(f"{BASE}/users/me", headers=headers))
results.append(ok)

# Create restaurant
ok, _ = test("POST /restaurants", requests.post(f"{BASE}/restaurants/", headers=headers, json={
    "name": "Sushi Haven", "cuisine": "Japanese", "location": "Midtown"
}))
results.append(ok)

# Create restaurant 2
ok, _ = test("POST /restaurants (2)", requests.post(f"{BASE}/restaurants/", headers=headers, json={
    "name": "Pizza Palace", "cuisine": "Italian", "location": "Downtown NYC",
    "description": "Best wood-fired pizza in the city"
}))
results.append(ok)

# Search restaurants
ok, _ = test("GET /restaurants?q=sushi", requests.get(f"{BASE}/restaurants/?q=sushi"))
results.append(ok)

# Get restaurant detail
ok, _ = test("GET /restaurants/1", requests.get(f"{BASE}/restaurants/1"))
results.append(ok)

# Create food log 1
ok, _ = test("POST /food-logs (japanese)", requests.post(f"{BASE}/food-logs/", headers=headers, json={
    "dish_name": "Dragon Roll", "rating": 4.5, "review_text": "Incredible fresh fish!",
    "restaurant_id": 1, "cuisine_tag": "japanese"
}))
results.append(ok)

# Create food log 2
ok, _ = test("POST /food-logs (italian)", requests.post(f"{BASE}/food-logs/", headers=headers, json={
    "dish_name": "Margherita Pizza", "rating": 5, "review_text": "Perfect crust!",
    "restaurant_id": 2, "cuisine_tag": "italian"
}))
results.append(ok)

# List food logs
ok, _ = test("GET /food-logs", requests.get(f"{BASE}/food-logs/"))
results.append(ok)

# Get single food log
ok, _ = test("GET /food-logs/1", requests.get(f"{BASE}/food-logs/1"))
results.append(ok)

# Update food log
ok, _ = test("PUT /food-logs/1", requests.put(f"{BASE}/food-logs/1", headers=headers, json={
    "rating": 5, "review_text": "Updated: Even better the second time!"
}))
results.append(ok)

# Follow user2
ok, _ = test("POST /users/2/follow", requests.post(f"{BASE}/users/2/follow", headers=headers))
results.append(ok)

# Get followers
ok, _ = test("GET /users/2/followers", requests.get(f"{BASE}/users/2/followers"))
results.append(ok)

# Get following
ok, _ = test("GET /users/1/following", requests.get(f"{BASE}/users/1/following"))
results.append(ok)

# Feed
ok, r = test("GET /feed", requests.get(f"{BASE}/feed/", headers=headers))
results.append(ok)

# Recommendations
ok, r = test("GET /recommendations", requests.get(f"{BASE}/recommendations/", headers=headers))
results.append(ok)
print(f"   Recommendations: {r.json()}")

# Create review
ok, _ = test("POST /restaurants/1/reviews", requests.post(f"{BASE}/restaurants/1/reviews", headers=headers, json={
    "rating": 5, "text": "Best sushi in town!"
}))
results.append(ok)

# List reviews
ok, _ = test("GET /restaurants/1/reviews", requests.get(f"{BASE}/restaurants/1/reviews"))
results.append(ok)

# Claim restaurant
ok, _ = test("POST /restaurants/1/claim", requests.post(f"{BASE}/restaurants/1/claim", headers=headers))
results.append(ok)

# Reply to review as owner
ok, _ = test("PUT review reply", requests.put(f"{BASE}/restaurants/1/reviews/1/reply", headers=headers, json={
    "reply": "Thank you for your kind words!"
}))
results.append(ok)

# Unfollow
ok, _ = test("DELETE /users/2/unfollow", requests.delete(f"{BASE}/users/2/unfollow", headers=headers))
results.append(ok)

print(f"\n{'='*40}")
passed = sum(results)
total = len(results)
print(f"Results: {passed}/{total} passed")
if passed == total:
    print("🎉 All tests passed!")
else:
    print(f"⚠️  {total - passed} test(s) failed")
sys.exit(0 if passed == total else 1)
