const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  // Auth
  register(data) {
    return this.request("/auth/register", { method: "POST", body: JSON.stringify(data) });
  }
  login(data) {
    return this.request("/auth/login", { method: "POST", body: JSON.stringify(data) });
  }

  // Users
  getMe() {
    return this.request("/users/me");
  }
  searchUsers(q) {
    return this.request(`/users/search?q=${encodeURIComponent(q)}`);
  }
  getUser(id) {
    return this.request(`/users/${id}`);
  }
  getUserFoodLogs(userId) {
    return this.request(`/food-logs/?user_id=${userId}`);
  }
  followUser(id) {
    return this.request(`/users/${id}/follow`, { method: "POST" });
  }
  unfollowUser(id) {
    return this.request(`/users/${id}/unfollow`, { method: "DELETE" });
  }
  getFollowing(userId) {
    return this.request(`/users/${userId}/following`);
  }
  getFollowers(userId) {
    return this.request(`/users/${userId}/followers`);
  }

  // Food Logs
  createFoodLog(data) {
    return this.request("/food-logs/", { method: "POST", body: JSON.stringify(data) });
  }
  getFoodLogs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/food-logs/?${qs}`);
  }
  getFoodLog(id) {
    return this.request(`/food-logs/${id}`);
  }
  updateFoodLog(id, data) {
    return this.request(`/food-logs/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  deleteFoodLog(id) {
    return this.request(`/food-logs/${id}`, { method: "DELETE" });
  }

  // Restaurants
  getRestaurants(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/restaurants/?${qs}`);
  }
  getRestaurant(id) {
    return this.request(`/restaurants/${id}`);
  }
  createRestaurant(data) {
    return this.request("/restaurants/", { method: "POST", body: JSON.stringify(data) });
  }

  // Reviews
  getReviews(restaurantId) {
    return this.request(`/restaurants/${restaurantId}/reviews`);
  }
  createReview(restaurantId, data) {
    return this.request(`/restaurants/${restaurantId}/reviews`, { method: "POST", body: JSON.stringify(data) });
  }

  // Feed
  getFeed(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/feed/?${qs}`);
  }

  // Recommendations
  getRecommendations(limit = 10) {
    return this.request(`/recommendations/?limit=${limit}`);
  }

  // Upload
  uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request("/upload/", { method: "POST", body: formData });
  }

  // Nearby Discovery
  searchNearby(lat, lng, radius = 1500, limit = 20) {
    const qs = new URLSearchParams({ lat, lng, radius, limit }).toString();
    return this.request(`/nearby/?${qs}`);
  }
  getPlaceDetails(placeId) {
    return this.request(`/nearby/${placeId}`);
  }
  importPlace(placeId) {
    return this.request(`/nearby/${placeId}/import`, { method: "POST" });
  }
}

const api = new ApiClient();
export default api;
